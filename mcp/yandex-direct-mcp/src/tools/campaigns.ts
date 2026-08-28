import { z } from "zod";
import { apiPost, rublesToMicros } from "../client.js";
import { formatResult } from "../format.js";
import { pageFields, buildPage } from "../pagination.js";
import { apiId, idField } from "../id.js";

export const listCampaignsSchema = z.object({
  status: z.string().optional().describe("Фильтр по статусу: ACCEPTED, DRAFT, MODERATION и т.д."),
  types: z.array(z.string()).optional().describe("Типы кампаний: TEXT_CAMPAIGN, DYNAMIC_TEXT_CAMPAIGN и т.д."),
  ...pageFields,
});

export async function handleListCampaigns(params: z.infer<typeof listCampaignsSchema>): Promise<string> {
  const selectionCriteria: Record<string, unknown> = {};
  if (params.status) selectionCriteria.Statuses = [params.status];
  if (params.types) selectionCriteria.Types = params.types;

  const requestParams: Record<string, unknown> = {
    SelectionCriteria: selectionCriteria,
    FieldNames: ["Id", "Name", "Status", "State", "DailyBudget", "StartDate", "Type", "Statistics"],
  };
  const page = buildPage(params);
  if (page) requestParams.Page = page;

  const data = await apiPost("campaigns", "get", requestParams);
  return formatResult(data);
}

export const getCampaignSchema = z.object({
  campaign_id: idField("ID рекламной кампании"),
});

export async function handleGetCampaign(params: z.infer<typeof getCampaignSchema>): Promise<string> {
  const data = await apiPost("campaigns", "get", {
    SelectionCriteria: { Ids: [apiId(params.campaign_id)] },
    FieldNames: ["Id", "Name", "Status", "State", "DailyBudget", "StartDate", "EndDate", "Type", "Statistics"],
  });
  return formatResult(data);
}

export const createCampaignSchema = z.object({
  name: z.string().describe("Название кампании"),
  type: z.string().default("TEXT_CAMPAIGN").describe("Тип: TEXT_CAMPAIGN, DYNAMIC_TEXT_CAMPAIGN"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Формат даты YYYY-MM-DD").describe("Дата начала YYYY-MM-DD"),
  daily_budget: z.number().positive().optional().describe("Дневной бюджет в рублях (напр. 1000 = 1000 ₽)"),
  search_strategy: z.string().default("HIGHEST_POSITION").describe("Стратегия на поиске: HIGHEST_POSITION, WB_MAXIMUM_CLICKS, AVERAGE_CPC, AVERAGE_CPA, PAY_FOR_CONVERSION, SERVING_OFF"),
  network_strategy: z.string().default("SERVING_OFF").describe("Стратегия в сетях (РСЯ): SERVING_OFF, NETWORK_DEFAULT, MAXIMUM_COVERAGE, WB_MAXIMUM_CLICKS"),
});

export async function handleCreateCampaign(params: z.infer<typeof createCampaignSchema>): Promise<string> {
  const campaign: Record<string, unknown> = {
    Name: params.name,
    StartDate: params.start_date,
  };
  if (params.daily_budget !== undefined) {
    campaign.DailyBudget = { Amount: rublesToMicros(params.daily_budget), Mode: "STANDARD" };
  }

  const biddingStrategy = {
    Search: { BiddingStrategyType: params.search_strategy },
    Network: { BiddingStrategyType: params.network_strategy },
  };
  if (params.type === "DYNAMIC_TEXT_CAMPAIGN") {
    campaign.DynamicTextCampaign = { BiddingStrategy: biddingStrategy };
  } else {
    campaign.TextCampaign = { BiddingStrategy: biddingStrategy };
  }

  const data = await apiPost("campaigns", "add", { Campaigns: [campaign] });
  return formatResult(data);
}

export const updateCampaignSchema = z.object({
  campaign_id: idField("ID кампании"),
  name: z.string().optional().describe("Новое название"),
  daily_budget: z.number().positive().optional().describe("Новый дневной бюджет в рублях"),
  status: z.string().optional().describe("Действие со статусом: SUSPEND, RESUME, ARCHIVE, UNARCHIVE"),
});

export async function handleUpdateCampaign(params: z.infer<typeof updateCampaignSchema>): Promise<string> {
  // Каждый ответ форматируется отдельно через formatResult, чтобы per-item ошибки
  // и предупреждения (collectNotices) не терялись при комбинированном вызове.
  const sections: string[] = [];

  // 1) Действие со статусом (отдельный метод API).
  if (params.status) {
    const actionMap: Record<string, string> = {
      SUSPEND: "suspend", RESUME: "resume", ARCHIVE: "archive", UNARCHIVE: "unarchive",
    };
    const method = actionMap[params.status.toUpperCase()];
    if (!method) {
      throw new Error(`Неизвестное действие статуса: ${params.status}. Допустимо: SUSPEND, RESUME, ARCHIVE, UNARCHIVE.`);
    }
    const r = await apiPost("campaigns", method, { SelectionCriteria: { Ids: [apiId(params.campaign_id)] } });
    sections.push(formatResult(r));
  }

  // 2) Обновление полей — выполняется ДОПОЛНИТЕЛЬНО к действию статуса, если заданы
  //    (исправление: раньше при наличии status поля name/budget молча терялись).
  if (params.name !== undefined || params.daily_budget !== undefined) {
    const campaign: Record<string, unknown> = { Id: apiId(params.campaign_id) };
    if (params.name !== undefined) campaign.Name = params.name;
    if (params.daily_budget !== undefined) {
      campaign.DailyBudget = { Amount: rublesToMicros(params.daily_budget), Mode: "STANDARD" };
    }
    const r = await apiPost("campaigns", "update", { Campaigns: [campaign] });
    sections.push(formatResult(r));
  }

  if (sections.length === 0) {
    throw new Error("Нечего обновлять: укажите status и/или name/daily_budget.");
  }
  return sections.join("\n\n");
}

export const manageCampaignsSchema = z.object({
  campaign_ids: z.array(idField("ID кампании")).min(1).max(1000).describe("ID кампаний"),
  action: z.enum(["suspend", "resume", "archive", "unarchive"])
    .describe("Действие: suspend/resume/archive/unarchive"),
});

export async function handleManageCampaigns(params: z.infer<typeof manageCampaignsSchema>): Promise<string> {
  const data = await apiPost("campaigns", params.action, {
    SelectionCriteria: { Ids: params.campaign_ids.map(apiId) },
  });
  return formatResult(data);
}
