import { z } from "zod";
import { apiPost } from "../client.js";
import { formatResult } from "../format.js";
import { apiId, apiIds, idField } from "../id.js";
import { buildPage, pageFields } from "../pagination.js";

export const listVcardsSchema = z.object({
  vcard_ids: z.array(idField("ID визитки")).max(10000).optional(),
  campaign_ids: z.array(idField("ID кампании")).max(10).optional()
    .describe("Найти визитки, привязанные к объявлениям этих кампаний"),
  ...pageFields,
});

export async function handleListVcards(params: z.infer<typeof listVcardsSchema>): Promise<string> {
  const ids = new Set(params.vcard_ids ?? []);
  if (params.campaign_ids?.length) {
    const ads = await apiPost("ads", "get", {
      SelectionCriteria: { CampaignIds: apiIds(params.campaign_ids) },
      FieldNames: ["Id"],
      TextAdFieldNames: ["VCardId"],
      Page: { Limit: 10000 },
    }) as { result?: { Ads?: Array<{ TextAd?: { VCardId?: unknown } }> } };
    for (const ad of ads.result?.Ads ?? []) {
      const value = ad.TextAd?.VCardId;
      if (typeof value === "string" && /^[1-9]\d*$/.test(value)) ids.add(value);
      if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) ids.add(String(value));
    }
  }
  if (!ids.size) {
    if (params.campaign_ids?.length) return formatResult({ result: { VCards: [] } }, { money: false });
    throw new Error("Передайте vcard_ids и/или campaign_ids.");
  }
  const request: Record<string, unknown> = {
    SelectionCriteria: { Ids: apiIds([...ids]) },
    FieldNames: [
      "Id", "CampaignId", "Country", "City", "CompanyName", "WorkTime", "Phone",
      "Street", "House", "Building", "Apartment", "InstantMessenger", "ExtraMessage",
      "ContactEmail", "Ogrn", "ContactPerson", "MetroStationId",
    ],
  };
  const page = buildPage(params);
  if (page) request.Page = page;
  return formatResult(await apiPost("vcards", "get", request), { money: false });
}

export const addVcardSchema = z.object({
  campaign_id: idField("ID кампании"),
  country: z.string().min(1),
  city: z.string().min(1),
  company_name: z.string().min(1),
  work_time: z.string().min(1).describe("Режим работы в формате API, например 1#5#9#0#18#0"),
  phone_country_code: z.string().min(1),
  phone_city_code: z.string().min(1),
  phone_number: z.string().min(1),
  phone_extension: z.string().optional(),
  street: z.string().optional(),
  house: z.string().optional(),
  building: z.string().optional(),
  apartment: z.string().optional(),
  extra_message: z.string().optional(),
  contact_email: z.string().email().optional(),
  ogrn: z.string().optional(),
  contact_person: z.string().optional(),
  metro_station_id: idField("ID станции метро").optional(),
});

export async function handleAddVcard(params: z.infer<typeof addVcardSchema>): Promise<string> {
  const phone: Record<string, unknown> = {
    CountryCode: params.phone_country_code,
    CityCode: params.phone_city_code,
    PhoneNumber: params.phone_number,
  };
  if (params.phone_extension !== undefined) phone.Extension = params.phone_extension;
  const vcard: Record<string, unknown> = {
    CampaignId: apiId(params.campaign_id),
    Country: params.country,
    City: params.city,
    CompanyName: params.company_name,
    WorkTime: params.work_time,
    Phone: phone,
  };
  const optional: Array<[keyof typeof params, string]> = [
    ["street", "Street"],
    ["house", "House"],
    ["building", "Building"],
    ["apartment", "Apartment"],
    ["extra_message", "ExtraMessage"],
    ["contact_email", "ContactEmail"],
    ["ogrn", "Ogrn"],
    ["contact_person", "ContactPerson"],
  ];
  for (const [source, target] of optional) {
    if (params[source] !== undefined) vcard[target] = params[source];
  }
  if (params.metro_station_id) vcard.MetroStationId = apiId(params.metro_station_id);
  return formatResult(await apiPost("vcards", "add", { VCards: [vcard] }), { money: false });
}
