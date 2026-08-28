import { z } from "zod";
import { apiReport } from "../client.js";
import { idField } from "../id.js";

const dateField = (label: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Формат даты YYYY-MM-DD").describe(label);

export const getStatisticsSchema = z.object({
  campaign_ids: z.array(idField("ID кампании")).min(1).describe("ID кампаний для отчёта"),
  date_from: dateField("Дата начала YYYY-MM-DD"),
  date_to: dateField("Дата окончания YYYY-MM-DD"),
  fields: z.array(z.string()).optional().describe("Поля отчёта (по умолчанию: Date, CampaignName, Impressions, Clicks, Cost, Ctr, AvgCpc). Деньги — в рублях."),
});

export async function handleGetStatistics(params: z.infer<typeof getStatisticsSchema>): Promise<string> {
  const fields = params.fields ?? ["Date", "CampaignName", "Impressions", "Clicks", "Cost", "Ctr", "AvgCpc"];
  // ReportName должен быть уникальным; служебная строка-заголовок отчёта убирается
  // (skipReportHeader=true по умолчанию в клиенте), названия столбцов и итог сохраняются.
  const data = await apiReport({
    SelectionCriteria: {
      DateFrom: params.date_from,
      DateTo: params.date_to,
      Filter: [{
        Field: "CampaignId",
        Operator: "IN",
        Values: params.campaign_ids.map(String),
      }],
    },
    FieldNames: fields,
    ReportName: `report_${Date.now()}`,
    ReportType: "CAMPAIGN_PERFORMANCE_REPORT",
    DateRangeType: "CUSTOM_DATE",
    Format: "TSV",
    IncludeVAT: "YES",
  });
  return data;
}
