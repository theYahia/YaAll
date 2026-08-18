/**
 * Lightweight, dependency-free formatting helpers that turn Yandex API JSON
 * into compact, LLM-friendly Markdown. Every renderer is best-effort: callers
 * wrap them with `present()`, which falls back to raw JSON on any error.
 */

export type OutputFormat = "markdown" | "json";

export interface Column<T> {
  key: keyof T & string;
  label?: string;
  format?: (value: unknown, row: T) => string;
}

export function formatNumber(n: unknown): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return n == null ? "" : String(n);
  return n.toLocaleString("en-US");
}

export function formatDate(value: unknown): string {
  if (typeof value !== "string") return value == null ? "" : String(value);
  // Yandex returns ISO timestamps; show the date part of a full timestamp.
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return m ? m[1] : value;
}

function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export function mdTable<T>(rows: T[], columns: Column<T>[]): string {
  if (rows.length === 0) return "_(no rows)_";
  const headers = columns.map((c) => c.label ?? c.key);
  const sep = columns.map(() => "---");
  const body = rows.map((row) =>
    columns.map((c) => (c.format ? c.format(row[c.key], row) : cell(row[c.key]))),
  );
  return [
    `| ${headers.join(" | ")} |`,
    `| ${sep.join(" | ")} |`,
    ...body.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");
}

/** Infer a Markdown table from an array of objects, using their primitive fields. */
export function autoTable(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "_(empty)_";
  const keys: string[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    for (const k of Object.keys(row)) {
      const v = row[k];
      if ((v === null || typeof v !== "object") && !keys.includes(k)) keys.push(k);
    }
  }
  if (keys.length === 0) {
    return rows.map((r) => `- ${JSON.stringify(r)}`).join("\n");
  }
  return mdTable(
    rows,
    keys.map((k) => ({ key: k })),
  );
}

export function kvList(obj: Record<string, unknown>, fields?: string[]): string {
  const keys = fields ?? Object.keys(obj);
  const lines: string[] = [];
  for (const k of keys) {
    const v = obj[k];
    if (v === undefined) continue;
    const rendered = v !== null && typeof v === "object" ? JSON.stringify(v) : String(v);
    lines.push(`- **${k}**: ${rendered}`);
  }
  return lines.length ? lines.join("\n") : "_(no fields)_";
}

/**
 * Generic renderer for responses whose exact shape isn't modelled:
 * - array -> table
 * - object with exactly one array property -> headline kv + table of that array
 * - other object -> key/value list (nested values shown as JSON)
 */
export function renderAuto(data: unknown): string {
  if (Array.isArray(data)) {
    return autoTable(data as Array<Record<string, unknown>>);
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const arrayProps = Object.entries(obj).filter(([, v]) => Array.isArray(v));
    if (arrayProps.length === 1) {
      const [name, arr] = arrayProps[0] as [string, unknown[]];
      const rest = Object.fromEntries(Object.entries(obj).filter(([k]) => k !== name));
      const head = Object.keys(rest).length ? `${kvList(rest)}\n\n` : "";
      return `${head}**${name}** (${arr.length}):\n${autoTable(arr as Array<Record<string, unknown>>)}`;
    }
    return kvList(obj);
  }
  return String(data);
}

/** Apply the requested output format, falling back to JSON if rendering throws. */
export function present(
  data: unknown,
  format: OutputFormat,
  render: (data: unknown) => string = renderAuto,
): string {
  if (format === "json") return JSON.stringify(data, null, 2);
  try {
    return render(data);
  } catch {
    return JSON.stringify(data, null, 2);
  }
}
