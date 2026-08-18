import { microsToRubles } from "./client.js";

// Поля ответов API v5, которые приходят в микроединицах и конвертируются в рубли на выводе.
// Консервативный набор: только заведомо денежные ключи, чтобы не задеть счётчики/ID.
const MONEY_KEYS = new Set(["Amount", "Bid", "ContextBid", "WeeklySpendLimit", "BidCeiling"]);

function convertMoney(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(convertMoney);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = MONEY_KEYS.has(k) && typeof v === "number" ? microsToRubles(v) : convertMoney(v);
    }
    return out;
  }
  return value;
}

interface Notification {
  Code?: number;
  Message?: string;
  Details?: string;
}

function fmtNote(prefix: string, key: string, idx: number, n: Notification): string {
  const detail = n.Details ? ` — ${n.Details}` : "";
  return `${prefix} ${key}[${idx}] [${n.Code ?? "?"}] ${n.Message ?? ""}${detail}`;
}

// Собирает понятные уведомления: per-item ошибки/предупреждения операций add/update/delete
// (частичный успех сохраняется в теле) и признак обрезанной выборки (LimitedBy → next offset).
function collectNotices(data: unknown): string {
  const lines: string[] = [];
  const result = (data as { result?: Record<string, unknown> })?.result;
  if (result && typeof result === "object") {
    if (typeof result.LimitedBy === "number") {
      lines.push(`ℹ️ Результат обрезан (LimitedBy=${result.LimitedBy}). Для следующей страницы передайте offset=${result.LimitedBy}.`);
    }
    for (const [key, val] of Object.entries(result)) {
      if (/Results$/.test(key) && Array.isArray(val)) {
        val.forEach((item, idx) => {
          for (const e of (item?.Errors ?? []) as Notification[]) lines.push(fmtNote("❌", key, idx, e));
          for (const w of (item?.Warnings ?? []) as Notification[]) lines.push(fmtNote("⚠️", key, idx, w));
        });
      }
    }
  }
  return lines.join("\n");
}

// Единый форматтер вывода инструментов: деньги → рубли, плюс шапка с уведомлениями.
export function formatResult(data: unknown, opts: { money?: boolean } = {}): string {
  const payload = opts.money === false ? data : convertMoney(data);
  const notices = collectNotices(data);
  const body = JSON.stringify(payload, null, 2);
  return notices ? `${notices}\n\n${body}` : body;
}
