import { z } from "zod";
import { apiPost } from "../client.js";
import { formatResult } from "../format.js";
import { pageFields, buildPage } from "../pagination.js";
import { apiId, apiIds, idField } from "../id.js";

export const listAdsSchema = z.object({
  ad_group_ids: z.array(idField("ID группы объявлений")).describe("ID групп объявлений"),
  ...pageFields,
});

export async function handleListAds(params: z.infer<typeof listAdsSchema>): Promise<string> {
  const requestParams: Record<string, unknown> = {
    SelectionCriteria: { AdGroupIds: apiIds(params.ad_group_ids) },
    FieldNames: ["Id", "CampaignId", "AdGroupId", "State", "Status"],
    TextAdFieldNames: ["Title", "Title2", "Text", "Href", "DisplayDomain"],
  };
  const page = buildPage(params);
  if (page) requestParams.Page = page;

  const data = await apiPost("ads", "get", requestParams);
  return formatResult(data);
}

// Лимиты длины из офиц. доки: Title ≤56, Title2 ≤30, Text ≤81.
export const createTextAdSchema = z.object({
  ad_group_id: idField("ID группы объявлений"),
  title: z.string().max(56).describe("Заголовок (до 56 символов)"),
  title2: z.string().max(30).optional().describe("Второй заголовок (до 30 символов)"),
  text: z.string().max(81).describe("Текст объявления (до 81 символа)"),
  href: z.string().describe("Ссылка на сайт"),
});

export async function handleCreateTextAd(params: z.infer<typeof createTextAdSchema>): Promise<string> {
  const textAd: Record<string, unknown> = {
    Title: params.title,
    Text: params.text,
    Href: params.href,
  };
  if (params.title2) textAd.Title2 = params.title2;

  const data = await apiPost("ads", "add", {
    Ads: [{
      AdGroupId: apiId(params.ad_group_id),
      TextAd: textAd,
    }],
  });
  return formatResult(data);
}

export const updateTextAdSchema = z.object({
  ad_id: idField("ID объявления для обновления"),
  title: z.string().max(56).optional().describe("Новый заголовок (до 56 символов)"),
  title2: z.string().max(30).optional().describe("Новый второй заголовок (до 30 символов)"),
  text: z.string().max(81).optional().describe("Новый текст (до 81 символа)"),
  href: z.string().optional().describe("Новая ссылка на сайт"),
});

export async function handleUpdateTextAd(params: z.infer<typeof updateTextAdSchema>): Promise<string> {
  const textAd: Record<string, unknown> = {};
  if (params.title !== undefined) textAd.Title = params.title;
  if (params.title2 !== undefined) textAd.Title2 = params.title2;
  if (params.text !== undefined) textAd.Text = params.text;
  if (params.href !== undefined) textAd.Href = params.href;

  if (Object.keys(textAd).length === 0) {
    throw new Error("Нечего обновлять: укажите хотя бы одно из title/title2/text/href.");
  }

  const data = await apiPost("ads", "update", {
    Ads: [{ Id: apiId(params.ad_id), TextAd: textAd }],
  });
  return formatResult(data);
}

const AD_ACTIONS: Record<string, string> = {
  suspend: "suspend",     // остановить показы
  resume: "resume",       // возобновить
  archive: "archive",     // в архив
  unarchive: "unarchive", // из архива
  moderate: "moderate",   // отправить на модерацию
  delete: "delete",       // удалить
};

export const manageAdsSchema = z.object({
  ad_ids: z.array(idField("ID объявления")).min(1).describe("ID объявлений"),
  action: z.enum(["suspend", "resume", "archive", "unarchive", "moderate", "delete"])
    .describe("Действие: suspend/resume/archive/unarchive/moderate/delete"),
});

export async function handleManageAds(params: z.infer<typeof manageAdsSchema>): Promise<string> {
  const method = AD_ACTIONS[params.action];
  const data = await apiPost("ads", method, {
    SelectionCriteria: { Ids: apiIds(params.ad_ids) },
  });
  return formatResult(data);
}

export const moderateAdsSchema = z.object({
  ad_ids: z.array(idField("ID объявления")).min(1).max(10000),
});

export async function handleModerateAds(params: z.infer<typeof moderateAdsSchema>): Promise<string> {
  return formatResult(await apiPost("ads", "moderate", {
    SelectionCriteria: { Ids: apiIds(params.ad_ids) },
  }));
}
