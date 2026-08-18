import { z } from "zod";
import { apiReport } from "../client.js";
import { idField } from "../id.js";

const dateField = (label: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Формат даты YYYY-MM-DD").describe(label);

export const getSearchQueriesSchema = z.object({
  campaign_ids: z.array(idField("ID кампании")).min(1).describe("ID кампаний"),
  date_from: dateField("Дата начала YYYY-MM-DD"),
  date_to: dateField("Дата окончания YYYY-MM-DD"),
  fields: z.array(z.string()).optional().describe(
    "Поля отчёта. По умолчанию: Query, CampaignId, CampaignName, AdGroupId, AdGroupName, Criterion, Impressions, Clicks, Cost.",
  ),
});

export async function handleGetSearchQueries(params: z.infer<typeof getSearchQueriesSchema>): Promise<string> {
  const fields = params.fields ?? [
    "Query", "CampaignId", "CampaignName", "AdGroupId", "AdGroupName",
    "Criterion", "Impressions", "Clicks", "Cost",
  ];
  return apiReport({
    SelectionCriteria: {
      DateFrom: params.date_from,
      DateTo: params.date_to,
      Filter: [{
        Field: "CampaignId",
        Operator: "IN",
        Values: params.campaign_ids,
      }],
    },
    FieldNames: fields,
    ReportName: `search_queries_${Date.now()}`,
    ReportType: "SEARCH_QUERY_PERFORMANCE_REPORT",
    DateRangeType: "CUSTOM_DATE",
    Format: "TSV",
    IncludeVAT: "YES",
  });
}
