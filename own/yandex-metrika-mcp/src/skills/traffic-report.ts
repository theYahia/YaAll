import { apiGet } from "../client.js";

/**
 * skill-traffic-report
 * Trigger: "Покажи трафик за месяц", "трафик", "traffic report"
 *
 * Returns a monthly traffic summary for a counter:
 * visits, users, new users, bounce rate, page depth, avg duration.
 */
export async function trafficReport(counterId: number, date1: string, date2: string): Promise<string> {
  const data = await apiGet("/stat/v1/data", {
    ids: String(counterId),
    date1,
    date2,
    metrics: [
      "ym:s:visits",
      "ym:s:users",
      "ym:s:newUsers",
      "ym:s:bounceRate",
      "ym:s:pageDepth",
      "ym:s:avgVisitDurationSeconds",
    ].join(","),
    dimensions: "ym:s:date",
    sort: "ym:s:date",
    limit: "31",
  }) as Record<string, unknown>;

  const totals = data.totals as number[];
  const labels = ["Визиты", "Пользователи", "Новые", "Отказы %", "Глубина", "Ср. длительность (сек)"];

  let summary = `## Трафик ${date1} — ${date2}\n\n`;
  if (totals) {
    labels.forEach((label, i) => {
      const val = typeof totals[i] === "number" ? (totals[i] % 1 === 0 ? totals[i] : totals[i].toFixed(2)) : totals[i];
      summary += `- **${label}**: ${val}\n`;
    });
  }

  summary += `\n\nПолные данные:\n${JSON.stringify(data, null, 2)}`;
  return summary;
}
