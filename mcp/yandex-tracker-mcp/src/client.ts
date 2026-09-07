const BASE_URL = "https://api.tracker.yandex.net/v2";
const TIMEOUT = 15_000;
const MAX_RETRIES = 3;

function getToken(): string {
  const token = process.env.YANDEX_TRACKER_TOKEN;
  if (!token) throw new Error("YANDEX_TRACKER_TOKEN is not set");
  return token;
}

// Облачная организация (Yandex Cloud Organization) требует X-Cloud-Org-ID,
// организация Яндекс 360 — X-Org-ID. С чужим заголовком API отдаёт 403 errorCode 620345.
function getOrgHeaders(): Record<string, string> {
  const cloudOrgId = process.env.YANDEX_TRACKER_CLOUD_ORG_ID;
  if (cloudOrgId) return { "X-Cloud-Org-ID": cloudOrgId };
  const orgId = process.env.YANDEX_TRACKER_ORG_ID;
  if (!orgId) throw new Error("YANDEX_TRACKER_ORG_ID or YANDEX_TRACKER_CLOUD_ORG_ID is not set");
  return { "X-Org-ID": orgId };
}

export async function trackerRequest(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  endpoint: string,
  body?: Record<string, unknown> | string,
  params?: Record<string, string>,
): Promise<unknown> {
  const token = getToken();
  const orgHeaders = getOrgHeaders();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    const query = params ? `?${new URLSearchParams(params).toString()}` : "";

    try {
      const response = await fetch(`${BASE_URL}/${endpoint}${query}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `OAuth ${token}`,
          ...orgHeaders,
        },
        ...(body ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {}),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.ok) {
        const text = await response.text();
        return text ? JSON.parse(text) : { success: true };
      }

      if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 8000);
        console.error(`[yandex-tracker-mcp] ${response.status}, retry in ${delay}ms (${attempt}/${MAX_RETRIES})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      const errBody = await response.text();
      throw new Error(`Yandex Tracker HTTP ${response.status}: ${errBody}`);
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof DOMException && error.name === "AbortError" && attempt < MAX_RETRIES) {
        console.error(`[yandex-tracker-mcp] Timeout, retry (${attempt}/${MAX_RETRIES})`);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Yandex Tracker: all retries exhausted");
}
