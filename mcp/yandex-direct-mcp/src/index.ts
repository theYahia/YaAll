#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

import {
  listCampaignsSchema, handleListCampaigns,
  getCampaignSchema, handleGetCampaign,
  createCampaignSchema, handleCreateCampaign,
  updateCampaignSchema, handleUpdateCampaign,
  manageCampaignsSchema, handleManageCampaigns,
} from "./tools/campaigns.js";
import {
  listAdGroupsSchema, handleListAdGroups,
  createAdGroupSchema, handleCreateAdGroup,
  deleteAdGroupsSchema, handleDeleteAdGroups,
} from "./tools/ad_groups.js";
import {
  listAdsSchema, handleListAds,
  createTextAdSchema, handleCreateTextAd,
  updateTextAdSchema, handleUpdateTextAd,
  manageAdsSchema, handleManageAds,
  moderateAdsSchema, handleModerateAds,
} from "./tools/ads.js";
import {
  listKeywordsSchema, handleListKeywords,
  addKeywordsSchema, handleAddKeywords,
  manageKeywordsSchema, handleManageKeywords,
} from "./tools/keywords.js";
import { setKeywordBidsSchema, handleSetKeywordBids } from "./tools/bids.js";
import {
  setCampaignNegativeKeywordsSchema, handleSetCampaignNegativeKeywords,
  getCampaignNegativeKeywordsSchema, handleGetCampaignNegativeKeywords,
  setAdGroupNegativeKeywordsSchema, handleSetAdGroupNegativeKeywords,
} from "./tools/negative_keywords.js";
import { getStatisticsSchema, handleGetStatistics } from "./tools/statistics.js";
import { getSearchQueriesSchema, handleGetSearchQueries } from "./tools/search_queries.js";
import { getAccountBalanceSchema, handleGetAccountBalance } from "./tools/account.js";
import { getRegionsSchema, handleGetRegions } from "./tools/dictionaries.js";
import {
  listSitelinksSchema, handleListSitelinks,
  setSitelinksSchema, handleSetSitelinks,
} from "./tools/sitelinks.js";
import {
  listAdExtensionsSchema, handleListAdExtensions,
  addAdExtensionsSchema, handleAddAdExtensions,
  deleteAdExtensionsSchema, handleDeleteAdExtensions,
} from "./tools/ad_extensions.js";
import {
  getBidAdjustmentsSchema, handleGetBidAdjustments,
  setBidAdjustmentsSchema, handleSetBidAdjustments,
} from "./tools/bid_adjustments.js";
import {
  getStrategySchema, handleGetStrategy,
  setStrategySchema, handleSetStrategy,
} from "./tools/strategy.js";
import { manageAdImagesSchema, handleManageAdImages } from "./tools/ad_images.js";
import {
  listRetargetingListsSchema, handleListRetargetingLists,
  addRetargetingListSchema, handleAddRetargetingList,
} from "./tools/retargeting.js";
import {
  listAudienceTargetsSchema, handleListAudienceTargets,
  setAudienceTargetsSchema, handleSetAudienceTargets,
} from "./tools/audience_targets.js";
import {
  listDynamicTargetsSchema, handleListDynamicTargets,
  manageDynamicTargetsSchema, handleManageDynamicTargets,
} from "./tools/dynamic_targets.js";
import { listFeedsSchema, handleListFeeds } from "./tools/feeds.js";
import {
  listNegativeKeywordSharedSetsSchema, handleListNegativeKeywordSharedSets,
  manageNegativeKeywordSharedSetsSchema, handleManageNegativeKeywordSharedSets,
  linkNegativeKeywordSetsSchema, handleLinkNegativeKeywordSets,
} from "./tools/negative_keyword_shared_sets.js";
import { getChangesSchema, handleGetChanges } from "./tools/changes.js";
import {
  listVcardsSchema, handleListVcards,
  addVcardSchema, handleAddVcard,
} from "./tools/vcards.js";
import { listBusinessesSchema, handleListBusinesses } from "./tools/businesses.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8"));
    return typeof pkg.version === "string" ? pkg.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const VERSION = readVersion();

const server = new McpServer({
  name: "yandex-direct-mcp",
  version: VERSION,
});

// Наборы MCP-аннотаций (подсказки клиентам про природу инструмента).
const READ: ToolAnnotations = { readOnlyHint: true, openWorldHint: true };
const WRITE: ToolAnnotations = { readOnlyHint: false, openWorldHint: true };
const IDEMPOTENT: ToolAnnotations = { readOnlyHint: false, idempotentHint: true, openWorldHint: true };
const DESTRUCTIVE: ToolAnnotations = { readOnlyHint: false, destructiveHint: true, openWorldHint: true };

const registered: string[] = [];

function reg(
  name: string,
  title: string,
  description: string,
  inputSchema: z.ZodRawShape,
  annotations: ToolAnnotations,
  handler: (params: any) => Promise<string>,
): void {
  server.registerTool(
    name,
    { title, description, inputSchema, annotations },
    (async (params: any) => ({
      content: [{ type: "text" as const, text: await handler(params) }],
    })) as any,
  );
  registered.push(name);
}

// ─── Кампании ───
reg("list_campaigns", "Список кампаний",
  "Список рекламных кампаний Яндекс.Директ с фильтрацией по статусу и типу. Бюджеты — в рублях.",
  listCampaignsSchema.shape, READ, handleListCampaigns);

reg("get_campaign", "Кампания по ID",
  "Детальная информация о кампании по ID: бюджет (руб), статус, даты, статистика.",
  getCampaignSchema.shape, READ, handleGetCampaign);

reg("create_campaign", "Создать кампанию",
  "Создать новую рекламную кампанию. Бюджет в рублях. ⚠️ Тратит реальные деньги — используйте sandbox для теста.",
  createCampaignSchema.shape, WRITE, handleCreateCampaign);

reg("update_campaign", "Обновить кампанию",
  "Обновить кампанию: название, бюджет (руб) и/или статус (SUSPEND/RESUME/ARCHIVE/UNARCHIVE).",
  updateCampaignSchema.shape, IDEMPOTENT, handleUpdateCampaign);

reg("manage_campaigns", "Управление кампаниями",
  "Запустить, остановить, архивировать или разархивировать несколько кампаний.",
  manageCampaignsSchema.shape, IDEMPOTENT, handleManageCampaigns);

reg("get_strategy", "Стратегия кампании",
  "Получить текущую стратегию показов текстово-графической кампании.",
  getStrategySchema.shape, READ, handleGetStrategy);

reg("set_strategy", "Изменить стратегию кампании",
  "Изменить стратегию текстово-графической кампании: ручная или максимум кликов с недельным бюджетом.",
  setStrategySchema.shape, IDEMPOTENT, handleSetStrategy);

// ─── Группы объявлений ───
reg("list_ad_groups", "Список групп",
  "Группы объявлений выбранных кампаний: названия, регионы, статусы.",
  listAdGroupsSchema.shape, READ, handleListAdGroups);

reg("create_ad_group", "Создать группу",
  "Создать группу объявлений в кампании с таргетингом по регионам (см. get_regions).",
  createAdGroupSchema.shape, WRITE, handleCreateAdGroup);

reg("delete_ad_groups", "Удалить группы",
  "Удалить группы объявлений по их ID. ⚠️ Необратимо.",
  deleteAdGroupsSchema.shape, DESTRUCTIVE, handleDeleteAdGroups);

// ─── Объявления ───
reg("list_ads", "Список объявлений",
  "Объявления в группах: заголовки, тексты, ссылки, статусы.",
  listAdsSchema.shape, READ, handleListAds);

reg("create_text_ad", "Создать объявление",
  "Создать текстовое объявление: заголовок (≤56), второй заголовок (≤30), текст (≤81), ссылка.",
  createTextAdSchema.shape, WRITE, handleCreateTextAd);

reg("update_text_ad", "Обновить объявление",
  "Обновить текстовое объявление: заголовок, текст, ссылка. Изменённое объявление уходит на модерацию.",
  updateTextAdSchema.shape, IDEMPOTENT, handleUpdateTextAd);

reg("manage_ads", "Управление объявлениями",
  "Действие над объявлениями: suspend/resume/archive/unarchive/moderate/delete. ⚠️ delete необратимо.",
  manageAdsSchema.shape, DESTRUCTIVE, handleManageAds);

reg("moderate_ads", "Отправить объявления на модерацию",
  "Отправить выбранные объявления на модерацию.",
  moderateAdsSchema.shape, IDEMPOTENT, handleModerateAds);

// ─── Ключевые слова ───
reg("list_keywords", "Список ключевых слов",
  "Ключевые фразы в группах объявлений: фразы, ставки (руб), статусы.",
  listKeywordsSchema.shape, READ, handleListKeywords);

reg("add_keywords", "Добавить ключевые слова",
  "Добавить ключевые фразы в группу объявлений.",
  addKeywordsSchema.shape, WRITE, handleAddKeywords);

reg("set_keyword_bids", "Установить ставки",
  "Установить ставки (поиск/сети, в рублях) на уровне фраз, групп или кампаний (сервис Bids).",
  setKeywordBidsSchema.shape, IDEMPOTENT, handleSetKeywordBids);

reg("manage_keywords", "Управление ключевыми словами",
  "Действие над ключевыми фразами: suspend/resume/delete. ⚠️ delete необратимо.",
  manageKeywordsSchema.shape, DESTRUCTIVE, handleManageKeywords);

// ─── Минус-фразы ───
reg("set_campaign_negative_keywords", "Минус-фразы кампании",
  "Задать минус-фразы на уровне кампании (заменяет текущий список; пустой массив очищает).",
  setCampaignNegativeKeywordsSchema.shape, IDEMPOTENT, handleSetCampaignNegativeKeywords);

reg("get_campaign_negative_keywords", "Получить минус-фразы кампаний",
  "Получить текущие минус-фразы кампаний по их ID.",
  getCampaignNegativeKeywordsSchema.shape, READ, handleGetCampaignNegativeKeywords);

reg("set_ad_group_negative_keywords", "Минус-фразы группы",
  "Задать минус-фразы на уровне группы объявлений (заменяет текущий список; пустой массив очищает).",
  setAdGroupNegativeKeywordsSchema.shape, IDEMPOTENT, handleSetAdGroupNegativeKeywords);

// ─── Статистика и аккаунт ───
reg("get_statistics", "Статистика",
  "Статистика кампаний за период: показы, клики, расход (руб), CTR, CPC (ReportService, TSV).",
  getStatisticsSchema.shape, READ, handleGetStatistics);

reg("get_search_queries", "Поисковые запросы",
  "Отчёт по фактическим поисковым запросам для анализа и добавления минус-фраз.",
  getSearchQueriesSchema.shape, READ, handleGetSearchQueries);

reg("list_sitelinks", "Список быстрых ссылок",
  "Получить все или выбранные наборы быстрых ссылок.",
  listSitelinksSchema.shape, READ, handleListSitelinks);

reg("set_sitelinks", "Создать быстрые ссылки",
  "Создать новый набор из 1–8 быстрых ссылок. Возвращает ID набора для привязки к объявлению.",
  setSitelinksSchema.shape, WRITE, handleSetSitelinks);

reg("list_ad_extensions", "Список уточнений",
  "Получить уточнения (callouts) с их статусами и текстом.",
  listAdExtensionsSchema.shape, READ, handleListAdExtensions);

reg("add_ad_extensions", "Создать уточнения",
  "Создать уточнения (callouts), каждый текст до 25 символов.",
  addAdExtensionsSchema.shape, WRITE, handleAddAdExtensions);

reg("delete_ad_extensions", "Удалить уточнения",
  "Удалить уточнения по ID. ⚠️ Необратимо.",
  deleteAdExtensionsSchema.shape, DESTRUCTIVE, handleDeleteAdExtensions);

reg("manage_ad_images", "Управление изображениями",
  "Загрузить, получить или удалить изображения объявлений (AdImages). Для add данные передаются в base64.",
  manageAdImagesSchema.shape, DESTRUCTIVE, handleManageAdImages);

reg("get_bid_adjustments", "Корректировки ставок",
  "Получить корректировки ставок по устройствам, полу и возрасту на уровне кампании или группы.",
  getBidAdjustmentsSchema.shape, READ, handleGetBidAdjustments);

reg("set_bid_adjustments", "Изменить корректировки ставок",
  "Изменить коэффициенты существующих корректировок по их ID.",
  setBidAdjustmentsSchema.shape, IDEMPOTENT, handleSetBidAdjustments);

reg("get_account_balance", "Баланс аккаунта",
  "Баланс и финансовая информация аккаунта (Amount, Currency) через Live API v4.",
  getAccountBalanceSchema.shape, READ, handleGetAccountBalance);

reg("get_regions", "Справочник регионов",
  "Справочник кодов регионов (GeoRegions) для таргетинга. Фильтр по названию. 225 = Россия.",
  getRegionsSchema.shape, READ, handleGetRegions);

// ─── Аудитории, фиды и дополнительные объекты ───
reg("list_retargeting_lists", "Списки ретаргетинга",
  "Получить условия ретаргетинга и подбора аудитории с правилами и областью применения.",
  listRetargetingListsSchema.shape, READ, handleListRetargetingLists);

reg("add_retargeting_list", "Создать список ретаргетинга",
  "Создать условие ретаргетинга из целей Метрики, сегментов или интересов.",
  addRetargetingListSchema.shape, WRITE, handleAddRetargetingList);

reg("list_audience_targets", "Аудиторные цели",
  "Получить условия нацеливания на аудиторию по ID кампании, группы, ретаргетинга или интереса.",
  listAudienceTargetsSchema.shape, READ, handleListAudienceTargets);

reg("set_audience_targets", "Управление аудиторными целями",
  "Добавить, остановить, возобновить, удалить аудиторные цели или изменить их ставки.",
  setAudienceTargetsSchema.shape, DESTRUCTIVE, handleSetAudienceTargets);

reg("list_dynamic_targets", "Динамические цели",
  "Получить условия нацеливания динамических текстовых объявлений.",
  listDynamicTargetsSchema.shape, READ, handleListDynamicTargets);

reg("manage_dynamic_targets", "Управление динамическими целями",
  "Создать, изменить ставки, остановить, возобновить или удалить динамические цели.",
  manageDynamicTargetsSchema.shape, DESTRUCTIVE, handleManageDynamicTargets);

reg("list_feeds", "Список фидов",
  "Получить товарные фиды, их источники, статусы обработки и связанные кампании.",
  listFeedsSchema.shape, READ, handleListFeeds);

reg("list_negative_keyword_shared_sets", "Общие наборы минус-фраз",
  "Получить общие наборы минус-фраз аккаунта.",
  listNegativeKeywordSharedSetsSchema.shape, READ, handleListNegativeKeywordSharedSets);

reg("manage_negative_keyword_shared_sets", "Управление общими минус-фразами",
  "Создать, изменить или удалить общие наборы минус-фраз аккаунта.",
  manageNegativeKeywordSharedSetsSchema.shape, DESTRUCTIVE, handleManageNegativeKeywordSharedSets);

reg("link_negative_keyword_sets", "Привязать общие минус-фразы",
  "Заменить привязки общих наборов минус-фраз у групп объявлений. Пустой set_ids очищает привязки.",
  linkNegativeKeywordSetsSchema.shape, IDEMPOTENT, handleLinkNegativeKeywordSets);

reg("get_changes", "Изменения объектов",
  "Проверить изменения кампаний, групп и объявлений начиная с указанного времени.",
  getChangesSchema.shape, READ, handleGetChanges);

reg("list_vcards", "Список визиток",
  "Получить виртуальные визитки по ID или найти их через объявления выбранных кампаний.",
  listVcardsSchema.shape, READ, handleListVcards);

reg("add_vcard", "Создать визитку",
  "Создать виртуальную визитку для кампании.",
  addVcardSchema.shape, WRITE, handleAddVcard);

reg("list_businesses", "Профили организаций",
  "Получить доступные профили организаций из Яндекс Бизнеса.",
  listBusinessesSchema.shape, READ, handleListBusinesses);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  const mode = process.env.YANDEX_DIRECT_SANDBOX === "1" || process.env.YANDEX_DIRECT_SANDBOX === "true"
    ? " [SANDBOX]" : "";
  console.error(`[yandex-direct-mcp] v${VERSION} запущен${mode}. ${registered.length} инструментов. Требуется YANDEX_DIRECT_TOKEN.`);
}

main().catch((error) => {
  console.error("[yandex-direct-mcp] Ошибка запуска:", error);
  process.exit(1);
});
