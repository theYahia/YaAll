import { z } from "zod";
import { apiPost } from "../client.js";
import { formatResult } from "../format.js";
import { apiIds, idField } from "../id.js";
import { buildPage, pageFields } from "../pagination.js";

export const listSitelinksSchema = z.object({
  sitelink_set_ids: z.array(idField("ID набора быстрых ссылок")).max(10000).optional(),
  ...pageFields,
});

export async function handleListSitelinks(params: z.infer<typeof listSitelinksSchema>): Promise<string> {
  const request: Record<string, unknown> = {
    FieldNames: ["Id"],
    SitelinkFieldNames: ["Title", "Href", "Description", "TurboPageId"],
  };
  if (params.sitelink_set_ids?.length) {
    request.SelectionCriteria = { Ids: apiIds(params.sitelink_set_ids) };
  }
  const page = buildPage(params);
  if (page) request.Page = page;
  return formatResult(await apiPost("sitelinks", "get", request), { money: false });
}

const sitelinkSchema = z.object({
  title: z.string().min(1).max(30).describe("Текст быстрой ссылки, до 30 символов"),
  href: z.string().max(1024).optional().describe("URL с протоколом и доменом"),
  description: z.string().max(60).optional().describe("Описание, до 60 символов"),
});

export const setSitelinksSchema = z.object({
  sitelinks: z.array(sitelinkSchema).min(1).max(8).describe("Новый набор из 1–8 быстрых ссылок"),
});

export async function handleSetSitelinks(params: z.infer<typeof setSitelinksSchema>): Promise<string> {
  const Sitelinks = params.sitelinks.map((link) => {
    const item: Record<string, string> = { Title: link.title };
    if (link.href !== undefined) item.Href = link.href;
    if (link.description !== undefined) item.Description = link.description;
    return item;
  });
  return formatResult(await apiPost("sitelinks", "add", {
    SitelinksSets: [{ Sitelinks }],
  }), { money: false });
}
