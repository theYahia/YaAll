import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);
process.env.YANDEX_DIRECT_TOKEN = "test-token";

function ok(data: unknown = { result: {} }) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: { get: () => null },
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

function body() {
  return JSON.parse(mockFetch.mock.calls.at(-1)[1].body);
}

function rawBody(): string {
  return mockFetch.mock.calls.at(-1)[1].body;
}

describe("remaining Yandex Direct tools", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(ok());
  });

  it("creates and deletes callouts", async () => {
    const { handleAddAdExtensions, handleDeleteAdExtensions } = await import("../tools/ad_extensions.js");
    await handleAddAdExtensions({ callouts: ["Поддержка 24/7"] });
    expect(body()).toMatchObject({
      method: "add",
      params: { AdExtensions: [{ Callout: { CalloutText: "Поддержка 24/7" } }] },
    });
    await handleDeleteAdExtensions({ ad_extension_ids: ["1915016273214320641"] });
    expect(rawBody()).toContain('"Ids":[1915016273214320641]');
  });

  it("moderates ads with lossless IDs", async () => {
    const { handleModerateAds } = await import("../tools/ads.js");
    await handleModerateAds({ ad_ids: ["1915016273214320641"] });
    expect(rawBody()).toContain('"method":"moderate"');
    expect(rawBody()).toContain('"Ids":[1915016273214320641]');
  });

  it("adds, gets and deletes ad images", async () => {
    const { handleManageAdImages } = await import("../tools/ad_images.js");
    await handleManageAdImages({
      action: "add",
      images: [{ image_data: "aW1hZ2U=", name: "image.png", type: "AUTO" }],
    });
    expect(body()).toMatchObject({
      method: "add",
      params: { AdImages: [{ ImageData: "aW1hZ2U=", Name: "image.png", Type: "AUTO" }] },
    });
    await handleManageAdImages({ action: "get", associated: "NO", limit: 10 });
    expect(body()).toMatchObject({
      method: "get",
      params: { SelectionCriteria: { Associated: "NO" }, Page: { Limit: 10 } },
    });
    await handleManageAdImages({ action: "delete", ad_image_hashes: ["hash"] });
    expect(body()).toMatchObject({
      method: "delete",
      params: { SelectionCriteria: { AdImageHashes: ["hash"] } },
    });
  });

  it("lists and creates retargeting lists", async () => {
    const { handleListRetargetingLists, handleAddRetargetingList } =
      await import("../tools/retargeting.js");
    await handleListRetargetingLists({
      retargeting_list_ids: ["1915016273214320641"],
      types: ["RETARGETING"],
    });
    expect(rawBody()).toContain('"Ids":[1915016273214320641]');
    await handleAddRetargetingList({
      name: "Брошенная заявка",
      type: "RETARGETING",
      rules: [{
        operator: "ANY",
        arguments: [{ external_id: "1915016273214320641", membership_life_span: 30 }],
      }],
    });
    expect(rawBody()).toContain('"ExternalId":1915016273214320641');
    expect(body().params.RetargetingLists[0].Rules[0].Operator).toBe("ANY");
  });

  it("lists audience targets and manages their lifecycle", async () => {
    const { handleListAudienceTargets, handleSetAudienceTargets } =
      await import("../tools/audience_targets.js");
    await handleListAudienceTargets({ campaign_ids: ["1915016273214320641"] });
    expect(rawBody()).toContain('"CampaignIds":[1915016273214320641]');
    await handleSetAudienceTargets({
      action: "add",
      targets: [{
        ad_group_id: "1915016273214320641",
        retargeting_list_id: "99",
        context_bid: 12.5,
      }],
    });
    expect(rawBody()).toContain('"AdGroupId":1915016273214320641');
    expect(body().params.AudienceTargets[0].ContextBid).toBe(12_500_000);
    await handleSetAudienceTargets({
      action: "set_bids",
      bids: [{ audience_target_id: "77", strategy_priority: "HIGH" }],
    });
    expect(body()).toMatchObject({
      method: "setBids",
      params: { Bids: [{ Id: 77, StrategyPriority: "HIGH" }] },
    });
    await handleSetAudienceTargets({ action: "suspend", audience_target_ids: ["77"] });
    expect(body().method).toBe("suspend");
  });

  it("lists dynamic targets and changes their bids", async () => {
    const { handleListDynamicTargets, handleManageDynamicTargets } =
      await import("../tools/dynamic_targets.js");
    await handleListDynamicTargets({ ad_group_ids: ["1915016273214320641"] });
    expect(rawBody()).toContain('"AdGroupIds":[1915016273214320641]');
    await handleManageDynamicTargets({
      action: "add",
      targets: [{
        ad_group_id: "1915016273214320641",
        name: "Страница тарифов",
        conditions: [{
          operand: "PAGE_TITLE",
          operator: "CONTAINS_ANY",
          arguments: ["/pricing"],
        }],
        bid: 10,
      }],
    });
    expect(rawBody()).toContain('"AdGroupId":1915016273214320641');
    expect(body().params.Webpages[0]).toMatchObject({
      Name: "Страница тарифов",
      Bid: 10_000_000,
      Conditions: [{ Operand: "PAGE_TITLE", Operator: "CONTAINS_ANY", Arguments: ["/pricing"] }],
    });
    await handleManageDynamicTargets({
      action: "set_bids",
      bids: [{ dynamic_target_id: "1915016273214320641", bid: 8, context_bid: 4 }],
    });
    expect(rawBody()).toContain('"Id":1915016273214320641');
    expect(body().params.Bids[0]).toMatchObject({ Bid: 8_000_000, ContextBid: 4_000_000 });
    await handleManageDynamicTargets({ action: "delete", dynamic_target_ids: ["88"] });
    expect(body().method).toBe("delete");
  });

  it("lists feeds", async () => {
    const { handleListFeeds } = await import("../tools/feeds.js");
    await handleListFeeds({ feed_ids: ["1915016273214320641"], offset: 5 });
    expect(rawBody()).toContain('"Ids":[1915016273214320641]');
    expect(body().params).toMatchObject({
      FileFeedFieldNames: ["Filename"],
      UrlFeedFieldNames: ["Login", "Url", "RemoveUtmTags"],
      Page: { Offset: 5 },
    });
  });

  it("lists and manages shared negative keyword sets", async () => {
    const {
      handleListNegativeKeywordSharedSets,
      handleManageNegativeKeywordSharedSets,
      handleLinkNegativeKeywordSets,
    } = await import("../tools/negative_keyword_shared_sets.js");
    await handleListNegativeKeywordSharedSets({ set_ids: ["1915016273214320641"] });
    expect(rawBody()).toContain('"Ids":[1915016273214320641]');
    await handleManageNegativeKeywordSharedSets({
      action: "add",
      add_sets: [{ name: "Мусор", negative_keywords: ["бесплатно"] }],
    });
    expect(body().params.NegativeKeywordSharedSets[0].NegativeKeywords).toEqual(["бесплатно"]);
    await handleManageNegativeKeywordSharedSets({
      action: "update",
      update_sets: [{ set_id: "1915016273214320641", negative_keywords: [] }],
    });
    expect(rawBody()).toContain('"Id":1915016273214320641');
    await handleManageNegativeKeywordSharedSets({
      action: "delete",
      set_ids: ["1915016273214320641"],
    });
    expect(body().method).toBe("delete");
    await handleLinkNegativeKeywordSets({
      ad_group_ids: ["1915016273214320641"],
      set_ids: ["77"],
    });
    expect(rawBody()).toContain('"Id":1915016273214320641');
    expect(body().params.AdGroups[0].NegativeKeywordSharedSetIds.Items).toEqual([77]);
  });

  it("checks campaign and object changes", async () => {
    const { handleGetChanges } = await import("../tools/changes.js");
    await handleGetChanges({ mode: "campaigns", timestamp: "2026-07-23T00:00:00Z" });
    expect(body()).toMatchObject({
      method: "checkCampaigns",
      params: { Timestamp: "2026-07-23T00:00:00Z" },
    });
    await handleGetChanges({
      mode: "objects",
      timestamp: "2026-07-23T00:00:00Z",
      ad_ids: ["1915016273214320641"],
    });
    expect(rawBody()).toContain('"AdIds":[1915016273214320641]');
    expect(body().params.FieldNames).toEqual(["AdIds"]);
  });

  it("lists and creates vCards", async () => {
    const { handleListVcards, handleAddVcard } = await import("../tools/vcards.js");
    await handleListVcards({ vcard_ids: ["1915016273214320641"] });
    expect(rawBody()).toContain('"Ids":[1915016273214320641]');
    mockFetch
      .mockResolvedValueOnce(ok({ result: { Ads: [{ TextAd: { VCardId: 55 } }] } }))
      .mockResolvedValueOnce(ok({ result: { VCards: [] } }));
    await handleListVcards({ campaign_ids: ["1915016273214320641"] });
    expect(mockFetch.mock.calls.at(-2)[1].body).toContain('"CampaignIds":[1915016273214320641]');
    expect(body().params.SelectionCriteria.Ids).toEqual([55]);
    await handleAddVcard({
      campaign_id: "1915016273214320641",
      country: "Россия",
      city: "Красноярск",
      company_name: "Сидон",
      work_time: "1#5#9#0#18#0",
      phone_country_code: "+7",
      phone_city_code: "391",
      phone_number: "1234567",
      metro_station_id: "1915016273214320641",
    });
    expect(rawBody()).toContain('"CampaignId":1915016273214320641');
    expect(rawBody()).toContain('"MetroStationId":1915016273214320641');
  });

  it("lists businesses", async () => {
    const { handleListBusinesses } = await import("../tools/businesses.js");
    await handleListBusinesses({ business_ids: ["1915016273214320641"], limit: 20 });
    expect(rawBody()).toContain('"Ids":[1915016273214320641]');
    expect(body().params.Page).toEqual({ Limit: 20 });
    expect(body().params.FieldNames).toContain("IsPublished");
  });
});
