const BASE_URL = "https://api-metrika.yandex.net";
const TIMEOUT = 15_000;
const MAX_RETRIES = 3;

function getToken(): string {
  const token = process.env.YANDEX_METRIKA_TOKEN;
  if (!token) {
    throw new Error("YANDEX_METRIKA_TOKEN env variable is not set. Get one at https://oauth.yandex.ru/");
  }
  return token;
}

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);

      if (response.ok) return response;

      if (response.status >= 500 && attempt < retries) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 8000);
        console.error(`[yandex-metrika-mcp] ${response.status} from ${url}, retry in ${delay}ms (${attempt}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      const body = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}: ${response.statusText}. ${body}`);
    } catch (error) {
      clearTimeout(timer);
      if (attempt === retries) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        console.error(`[yandex-metrika-mcp] Timeout ${url}, retry (${attempt}/${retries})`);
        continue;
      }
      throw error;
    }
  }
  throw new Error("All retry attempts exhausted");
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  };
}

export async function apiGet(path: string, params: Record<string, string> = {}): Promise<unknown> {
  const url = new URL(path, BASE_URL);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  const response = await fetchWithRetry(url.toString(), {
    headers: authHeaders(),
  });
  return response.json();
}

export async function apiPost(path: string, body: unknown, params: Record<string, string> = {}): Promise<unknown> {
  const url = new URL(path, BASE_URL);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  const response = await fetchWithRetry(url.toString(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return response.json();
}

export async function apiPut(path: string, body: unknown): Promise<unknown> {
  const url = new URL(path, BASE_URL);
  const response = await fetchWithRetry(url.toString(), {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return response.json();
}

export async function apiDelete(path: string): Promise<unknown> {
  const url = new URL(path, BASE_URL);
  const response = await fetchWithRetry(url.toString(), {
    method: "DELETE",
    headers: authHeaders(),
  });
  // DELETE may return empty body
  const text = await response.text();
  return text ? JSON.parse(text) : { success: true };
}
