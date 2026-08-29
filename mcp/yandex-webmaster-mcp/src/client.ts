const BASE_URL = "https://api.webmaster.yandex.net/v4";
const TIMEOUT = 15_000;
const MAX_RETRIES = 3;

/** Error carrying the HTTP status of a failed Yandex API response. */
export class YandexApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, statusText: string, body: string) {
    super(`HTTP ${status}: ${statusText}${body ? `. ${body}` : ""}`);
    this.name = "YandexApiError";
    this.status = status;
    this.body = body;
  }
}

function getToken(): string {
  const token = process.env.YANDEX_WEBMASTER_TOKEN;
  if (!token) {
    throw new Error("YANDEX_WEBMASTER_TOKEN is not set");
  }
  return token;
}

// --- User ID resolution: env override -> cached -> auto-fetch GET /user/ ---

let cachedUserId: string | null = null;
let userIdPromise: Promise<string> | null = null;

/** Env-only accessor. Throws when the variable is unset. */
export function getUserId(): string {
  const userId = process.env.YANDEX_WEBMASTER_USER_ID;
  if (!userId) {
    throw new Error("YANDEX_WEBMASTER_USER_ID is not set");
  }
  return userId;
}

/**
 * Resolve the numeric Webmaster user id. Prefers YANDEX_WEBMASTER_USER_ID;
 * otherwise fetches it once from GET /user/ and caches it for the process.
 * Concurrent first calls share a single in-flight request.
 */
export async function resolveUserId(): Promise<string> {
  const fromEnv = process.env.YANDEX_WEBMASTER_USER_ID;
  if (fromEnv) return fromEnv;
  if (cachedUserId) return cachedUserId;
  if (userIdPromise) return userIdPromise;

  userIdPromise = (async () => {
    try {
      const data = (await apiGet("/user/")) as { user_id?: number | string };
      const id = data?.user_id;
      if (id === undefined || id === null || id === "") {
        throw new Error("response did not contain user_id");
      }
      cachedUserId = String(id);
      return cachedUserId;
    } catch (error) {
      userIdPromise = null; // allow a later retry
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Could not resolve Yandex user id automatically (${reason}). ` +
          "Set YANDEX_WEBMASTER_USER_ID, or check the token's webmaster:api scope.",
      );
    }
  })();

  return userIdPromise;
}

/** Reset the in-memory user-id cache. Intended for tests. */
export function resetUserIdCache(): void {
  cachedUserId = null;
  userIdPromise = null;
}

// --- HTTP plumbing ---

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(attempt: number): number {
  return Math.min(1000 * 2 ** (attempt - 1), 8000);
}

const RETRYABLE_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ETIMEDOUT",
  "EPIPE",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
]);

function isAbortError(error: unknown): boolean {
  return (error as { name?: string } | undefined)?.name === "AbortError";
}

function isRetryableNetworkError(error: unknown): boolean {
  if (isAbortError(error)) return true;
  if (error instanceof TypeError) return true; // fetch network failure
  const code =
    (error as { cause?: { code?: string } } | undefined)?.cause?.code ??
    (error as { code?: string } | undefined)?.code;
  return code !== undefined && RETRYABLE_NETWORK_CODES.has(code);
}

function buildHeaders(hasBody: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `OAuth ${getToken()}`,
    Accept: "application/json",
  };
  if (hasBody) headers["Content-Type"] = "application/json";
  return headers;
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return {};
  }
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response from Yandex API: ${text.slice(0, 200)}`);
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);

      if (response.ok) return response;

      if (response.status >= 500 && attempt < retries) {
        const delay = backoffDelay(attempt);
        void response.body?.cancel(); // release the socket back to the pool
        console.error(
          `[yandex-webmaster-mcp] ${response.status} from ${url}, retry in ${delay}ms (${attempt}/${retries})`,
        );
        await sleep(delay);
        continue;
      }

      const body = await response.text().catch(() => "");
      throw new YandexApiError(response.status, response.statusText, body);
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof YandexApiError) throw error; // mapped HTTP error, not retryable
      lastError = error;

      if (attempt < retries && isRetryableNetworkError(error)) {
        const delay = backoffDelay(attempt);
        const label = isAbortError(error) ? "Timeout" : "Network error";
        console.error(
          `[yandex-webmaster-mcp] ${label} ${url}, retry in ${delay}ms (${attempt}/${retries})`,
        );
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("All retries exhausted");
}

/** Build the absolute request URL, auto-prefixing /user/{id} unless already present. */
async function resolvePath(path: string): Promise<string> {
  const fullPath = path.startsWith("/user/") ? path : `/user/${await resolveUserId()}${path}`;
  // NOTE: concatenate rather than `new URL(path, base)` — an absolute path would
  // otherwise drop the `/v4` base segment.
  return `${BASE_URL}${fullPath}`;
}

export type QueryParams = Record<string, string | number | string[] | undefined>;

export async function apiGet(path: string, params: QueryParams = {}): Promise<unknown> {
  const url = new URL(await resolvePath(path));
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    if (Array.isArray(v)) {
      for (const item of v) url.searchParams.append(k, String(item));
    } else {
      url.searchParams.set(k, String(v));
    }
  }
  const response = await fetchWithRetry(url.toString(), {
    headers: buildHeaders(false),
  });
  return parseResponse(response);
}

export async function apiPost(path: string, body: unknown): Promise<unknown> {
  const url = await resolvePath(path);
  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(body),
  });
  return parseResponse(response);
}
