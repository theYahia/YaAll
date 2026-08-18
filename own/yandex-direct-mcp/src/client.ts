// ─── Конфигурация эндпоинтов ───
// Песочница (sandbox) включается переменной YANDEX_DIRECT_SANDBOX=1 — изолированные
// данные, тот же OAuth-токен, безопасно для тестов и dry-run без реальных трат.
// Док: https://yandex.com/dev/direct/doc/en/concepts/sandbox

const SANDBOX = process.env.YANDEX_DIRECT_SANDBOX === "1" || process.env.YANDEX_DIRECT_SANDBOX === "true";

const BASE_URL = SANDBOX
  ? "https://api-sandbox.direct.yandex.com/json/v5/"
  : "https://api.direct.yandex.com/json/v5/";
const REPORT_URL = `${BASE_URL}reports`;
// Финансовая информация (баланс) живёт только в Live API v4, не в v5.
const V4_URL = SANDBOX
  ? "https://api-sandbox.direct.yandex.ru/live/v4/json/"
  : "https://api.direct.yandex.ru/live/v4/json/";

const TIMEOUT = 15_000;
const MAX_RETRIES = 3;
const REPORT_MAX_POLLS = 6;
const DEFAULT_RETRY_IN_SEC = 5;

// ─── Деньги ───
// API Яндекс.Директ оперирует «микроединицами» (сумма в валюте × 1 000 000).
// Этот сервер принимает и возвращает суммы в рублях/валюте аккаунта; конверсия здесь.
export function rublesToMicros(rubles: number): number {
  return Math.round(rubles * 1_000_000);
}
export function microsToRubles(micros: number): number {
  return micros / 1_000_000;
}

function getToken(): string {
  const token = process.env.YANDEX_DIRECT_TOKEN;
  if (!token) {
    throw new Error("Переменная окружения YANDEX_DIRECT_TOKEN не задана");
  }
  return token;
}

// Общие заголовки v5. Client-Login обязателен для агентских токенов — задаётся
// через YANDEX_DIRECT_LOGIN. Док: https://yandex.ru/dev/direct/doc/en/concepts/headers
function commonHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
    "Accept-Language": "ru",
  };
  const clientLogin = process.env.YANDEX_DIRECT_LOGIN;
  if (clientLogin) headers["Client-Login"] = clientLogin;
  return headers;
}

// Заголовок Units = «израсходовано/остаток/суточный лимит» баллов API.
function logUnits(response: Response): void {
  const units = response.headers?.get?.("Units");
  if (units) console.error(`[yandex-direct-mcp] Баллы API (потрачено/остаток/лимит): ${units}`);
}

interface YandexApiError {
  error_code?: number | string;
  error_string?: string;
  error_detail?: string;
  request_id?: string;
}

// API v5 возвращает ошибки уровня запроса в теле с HTTP 200 — детектируем по ключу `error`.
// Док: https://yandex.ru/dev/direct/doc/en/concepts/errors-list
function assertNoApiError(data: unknown): void {
  const e = (data as { error?: YandexApiError } | null)?.error;
  if (e && typeof e === "object") {
    const parts = [
      `Ошибка API Яндекс.Директ [${e.error_code ?? "?"}]: ${e.error_string ?? "неизвестная ошибка"}`,
    ];
    if (e.error_detail) parts.push(`— ${e.error_detail}`);
    if (e.request_id) parts.push(`(request_id: ${e.request_id})`);
    throw new Error(parts.join(" "));
  }
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
        console.error(`[yandex-direct-mcp] ${response.status} от ${url}, повтор через ${delay}мс (${attempt}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      const body = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}: ${response.statusText}. ${body}`);
    } catch (error) {
      clearTimeout(timer);
      if (attempt === retries) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        console.error(`[yandex-direct-mcp] Таймаут ${url}, повтор (${attempt}/${retries})`);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Все попытки исчерпаны");
}

// ─── JSON API v5 ───
export async function apiPost(service: string, method: string, params: Record<string, unknown> = {}): Promise<unknown> {
  const url = `${BASE_URL}${service}`;
  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: commonHeaders(),
    body: JSON.stringify({ method, params }),
  });
  logUnits(response);
  const data = await response.json();
  assertNoApiError(data);
  return data;
}

// ─── ReportService (TSV) с поллингом offline-режима ───
// 200 = готов, 201 = поставлен в очередь, 202 = ещё формируется (повторить через retryIn сек).
// Док: https://yandex.ru/dev/direct/doc/en/codes
export interface ReportOptions {
  skipReportHeader?: boolean;
  skipReportSummary?: boolean;
  skipColumnHeader?: boolean;
}

export async function apiReport(params: Record<string, unknown>, opts: ReportOptions = {}): Promise<string> {
  const headers: Record<string, string> = {
    ...commonHeaders(),
    processingMode: "auto",
    returnMoneyInMicros: "false",
    skipReportHeader: opts.skipReportHeader === false ? "false" : "true",
    skipReportSummary: opts.skipReportSummary ? "true" : "false",
    skipColumnHeader: opts.skipColumnHeader ? "true" : "false",
  };
  const body = JSON.stringify({ params });

  for (let poll = 0; poll <= REPORT_MAX_POLLS; poll++) {
    const response = await fetchWithRetry(REPORT_URL, { method: "POST", headers, body });
    logUnits(response);

    if (response.status === 200) {
      return response.text();
    }

    if (response.status === 201 || response.status === 202) {
      if (poll === REPORT_MAX_POLLS) {
        throw new Error(`Отчёт всё ещё формируется после ${REPORT_MAX_POLLS} попыток опроса. Повторите запрос позже.`);
      }
      const raw = response.headers?.get?.("retryIn");
      const parsed = raw == null ? NaN : Number(raw);
      const retryIn = Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_RETRY_IN_SEC;
      console.error(`[yandex-direct-mcp] Отчёт формируется (HTTP ${response.status}), повтор через ${retryIn}с (${poll + 1}/${REPORT_MAX_POLLS})`);
      await new Promise(r => setTimeout(r, Math.min(retryIn, 15) * 1000));
      continue;
    }

    // Прочие коды (>=300, не 2xx) до сюда не доходят: fetchWithRetry бросает на не-ok.
    return response.text();
  }
  throw new Error("Не удалось получить отчёт");
}

// ─── Live API v4 (только для баланса аккаунта) ───
// Формат: { method, token, param }. Ошибки: { error_code, error_str, error_detail }.
export async function apiV4(method: string, param: Record<string, unknown> = {}): Promise<unknown> {
  const response = await fetchWithRetry(V4_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept-Language": "ru" },
    body: JSON.stringify({ method, token: getToken(), param }),
  });
  logUnits(response);
  const data = await response.json() as Record<string, unknown>;
  if (data && (data.error_code !== undefined || data.error_str !== undefined)) {
    const detail = data.error_detail ? ` — ${data.error_detail}` : "";
    throw new Error(`Ошибка API v4 [${data.error_code ?? "?"}]: ${data.error_str ?? "неизвестная ошибка"}${detail}`);
  }
  return data;
}
