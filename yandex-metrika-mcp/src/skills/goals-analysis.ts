import { apiGet } from "../client.js";

/**
 * skill-goals-analysis
 * Trigger: "Анализ целей и конверсий", "goals analysis", "конверсии"
 *
 * Lists goals for a counter and fetches conversion data for each goal.
 */
export async function goalsAnalysis(counterId: number, date1: string, date2: string): Promise<string> {
  const goalsData = (await apiGet(`/management/v1/counter/${counterId}/goals`)) as {
    goals?: Array<{ id: number; name: string; type: string }>;
  };

  const goals = goalsData.goals || [];

  if (goals.length === 0) {
    return `Для счётчика ${counterId} не настроены цели.`;
  }

  let report = `## Анализ целей (${date1} — ${date2})\n\n`;
  report += `Найдено целей: ${goals.length}\n\n`;

  const goalIds = goals.map((g) => g.id);
  const goalMetrics = goalIds.map((id) => `ym:s:goal${id}reaches,ym:s:goal${id}conversionRate`).join(",");

  try {
    const conversionData = (await apiGet("/stat/v1/data", {
      ids: String(counterId),
      date1,
      date2,
      metrics: goalMetrics,
    })) as { totals?: number[] };

    const totals = conversionData.totals || [];

    goals.forEach((goal, i) => {
      const reaches = totals[i * 2] ?? "N/A";
      const rate = totals[i * 2 + 1];
      const rateStr = typeof rate === "number" ? `${rate.toFixed(2)}%` : "N/A";
      report += `### ${goal.name} (ID: ${goal.id}, тип: ${goal.type})\n`;
      report += `- Достижения: ${reaches}\n`;
      report += `- Конверсия: ${rateStr}\n\n`;
    });
  } catch {
    report += `\n### Список целей:\n`;
    goals.forEach((goal) => {
      report += `- **${goal.name}** (ID: ${goal.id}, тип: ${goal.type})\n`;
    });
    report += `\n_Данные о конверсиях недоступны за указанный период._\n`;
  }

  return report;
}
