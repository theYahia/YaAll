/**
 * Yandex Maps HTTP client.
 *
 * Covers three API families:
 *   - Geocoder API (geocode.maps.yandex.ru)
 *   - Router API (api.routing.yandex.net)
 *   - Geosearch API (search-maps.yandex.ru)
 *   - Suggest API (suggest-maps.yandex.ru)
 *
 * Security:
 *   - API key read from env at call time (not cached)
 *   - Keys never in error messages
 *   - Hard timeout (10s) on all requests
 *   - Retries on transient errors with backoff
 */

import type { ApiResult } from "./types.js";

const GEOCODER_BASE = "https://geocode-maps.yandex.ru/1.x";
const ROUTER_BASE = "https://api.routing.yandex.net/v2/route";
const MATRIX_BASE = "https://api.routing.yandex.net/v2/distancematrix";
const SEARCH_BASE = "https://search-maps.yandex.ru/v1";
const SUGGEST_BASE = "https://suggest-maps.yandex.ru/v1/suggest";
const STATIC_BASE = "https://static-maps.yandex.ru/v1";

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const BACKOFF_BASE_MS = 1_000;
const BACKOFF_MAX_MS = 8_000;

export function getApiKey(): string {
  const key = process.env.YANDEX_MAPS_API_KEY;
  if (!key) {
    throw new Error(
      "YANDEX_MAPS_API_KEY is not set. " +
      "Get your key at https://developer.tech.yandex.ru/ and add it to your MCP client env config."
    );
  }
  return key;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function mapHttpError(status: number): string {
  switch (status) {
    case 400: return "Bad request. Check parameters.";
    case 401: return "Authentication failed. Check YANDEX_MAPS_API_KEY.";
    case 403: return "Access forbidden. Your API key may lack required permissions.";
    case 429: return "Rate limit exceeded. Wait before retrying.";
    default:
      if (status >= 500) return `Yandex Maps service error (HTTP ${status}). Try again later.`;
      return `Unexpected HTTP ${status} from Yandex Maps API.`;
  }
}

async function callGET(url: string): Promise<ApiResult> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        return { data: await response.json(), error: null };
      }

      const isTransient = response.status === 429 || response.status >= 500;
      if (isTransient && attempt < MAX_RETRIES) {
        const waitMs = Math.min(BACKOFF_BASE_MS * Math.pow(2, attempt), BACKOFF_MAX_MS);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      return { data: null, error: mapHttpError(response.status) };
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { data: null, error: "Request timed out (10s). Yandex Maps may be experiencing issues." };
      }
      if (attempt < MAX_RETRIES) continue;
      const message = err instanceof Error ? err.message : "Unknown network error";
      return { data: null, error: `Network error: ${message}` };
    }
  }
  return { data: null, error: "Max retries exceeded." };
}

async function callPOST(url: string, body: unknown): Promise<ApiResult> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return { data: await response.json(), error: null };
      }

      const isTransient = response.status === 429 || response.status >= 500;
      if (isTransient && attempt < MAX_RETRIES) {
        const waitMs = Math.min(BACKOFF_BASE_MS * Math.pow(2, attempt), BACKOFF_MAX_MS);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      return { data: null, error: mapHttpError(response.status) };
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { data: null, error: "Request timed out (10s)." };
      }
      if (attempt < MAX_RETRIES) continue;
      const message = err instanceof Error ? err.message : "Unknown network error";
      return { data: null, error: `Network error: ${message}` };
    }
  }
  return { data: null, error: "Max retries exceeded." };
}

// --- Public API methods ---

export async function callGeocoder(params: Record<string, string>): Promise<ApiResult> {
  let apiKey: string;
  try { apiKey = getApiKey(); } catch {
    return { data: null, error: "YANDEX_MAPS_API_KEY is not set." };
  }
  const query = new URLSearchParams({ apikey: apiKey, format: "json", ...params });
  return callGET(`${GEOCODER_BASE}?${query}`);
}

export async function callRouter(
  waypoints: string,
  mode: string = "driving",
): Promise<ApiResult> {
  let apiKey: string;
  try { apiKey = getApiKey(); } catch {
    return { data: null, error: "YANDEX_MAPS_API_KEY is not set." };
  }
  const query = new URLSearchParams({
    apikey: apiKey,
    waypoints,
    mode,
  });
  return callGET(`${ROUTER_BASE}?${query}`);
}

export async function callMatrix(
  origins: string,
  destinations: string,
  mode: string = "driving",
): Promise<ApiResult> {
  let apiKey: string;
  try { apiKey = getApiKey(); } catch {
    return { data: null, error: "YANDEX_MAPS_API_KEY is not set." };
  }
  const query = new URLSearchParams({
    apikey: apiKey,
    origins,
    destinations,
    mode,
  });
  return callGET(`${MATRIX_BASE}?${query}`);
}

export async function callSearch(params: Record<string, string>): Promise<ApiResult> {
  let apiKey: string;
  try { apiKey = getApiKey(); } catch {
    return { data: null, error: "YANDEX_MAPS_API_KEY is not set." };
  }
  const query = new URLSearchParams({ apikey: apiKey, lang: "ru_RU", ...params });
  return callGET(`${SEARCH_BASE}?${query}`);
}

export async function callSuggest(params: Record<string, string>): Promise<ApiResult> {
  let apiKey: string;
  try { apiKey = getApiKey(); } catch {
    return { data: null, error: "YANDEX_MAPS_API_KEY is not set." };
  }
  const query = new URLSearchParams({ apikey: apiKey, lang: "ru", ...params });
  return callGET(`${SUGGEST_BASE}?${query}`);
}

export function getStaticMapUrl(params: Record<string, string>): string {
  const apiKey = getApiKey();
  const query = new URLSearchParams({ apikey: apiKey, ...params });
  return `${STATIC_BASE}?${query}`;
}
