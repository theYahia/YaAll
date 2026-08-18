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
} from "./tools/ads.js";
import {
  listKeywordsSchema, handleListKeywords,
  addKeywordsSchema, handleAddKeywords,
  manageKeywordsSchema, handleManageKeywords,
} from "./tools/keywords.js";
import { setKeywordBidsSchema, handleSetKeywordBids } from "./tools/bids.js";
import {
  setCampaignNegativeKeywordsSchema, handleSetCampaignNegativeKeywords,
  setAdGroupNegativeKeywordsSchema, handleSetAdGroupNegativeKeywords,
} from "./tools/negative_keywords.js";
import { getStatisticsSchema, handleGetStatistics } from "./tools/statistics.js";
import { getAccountBalanceSchema, handleGetAccountBalance } from "./tools/account.js";
import { getRegionsSchema, handleGetRegions } from "./tools/dictionaries.js";

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

reg("set_ad_group_negative_keywords", "Минус-фразы группы",
  "Задать минус-фразы на уровне группы объявлений (заменяет текущий список; пустой массив очищает).",
  setAdGroupNegativeKeywordsSchema.shape, IDEMPOTENT, handleSetAdGroupNegativeKeywords);

// ─── Статистика и аккаунт ───
reg("get_statistics", "Статистика",
  "Статистика кампаний за период: показы, клики, расход (руб), CTR, CPC (ReportService, TSV).",
  getStatisticsSchema.shape, READ, handleGetStatistics);

reg("get_account_balance", "Баланс аккаунта",
  "Баланс и финансовая информация аккаунта (Amount, Currency) через Live API v4.",
  getAccountBalanceSchema.shape, READ, handleGetAccountBalance);

reg("get_regions", "Справочник регионов",
  "Справочник кодов регионов (GeoRegions) для таргетинга. Фильтр по названию. 225 = Россия.",
  getRegionsSchema.shape, READ, handleGetRegions);

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
