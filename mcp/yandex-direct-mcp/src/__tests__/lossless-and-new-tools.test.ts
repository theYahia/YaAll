import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);
process.env.YANDEX_DIRECT_TOKEN = "test-token";

function response(body: string, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "OK",
    headers: { get: () => null },
    text: () => Promise.resolve(body),
  };
}

function ok(data: unknown) {
  return response(JSON.stringify(data));
}

function lastBody(): string {
  return mockFetch.mock.calls.at(-1)[1].body;
}

describe("lossless 64-bit IDs", () => {
  beforeEach(() => mockFetch.mockReset());

  it("requires IDs as decimal strings", async () => {
    const { updateTextAdSchema } = await import("../tools/ads.js");
    expect(updateTextAdSchema.parse({
      ad_id: "1915016273214320641",
      title: "Точный ID",
    }).ad_id).toBe("1915016273214320641");
    expect(() => updateTextAdSchema.parse({
      ad_id: 1915016273214320641,
      title: "Неточный ID",
    })).toThrow();
  });

  it("sends a 19-digit ad ID as an exact JSON number", async () => {
    const { handleUpdateTextAd } = await import("../tools/ads.js");
    mockFetch.mockResolvedValueOnce(ok({ result: { UpdateResults: [{ Id: 1 }] } }));

    await handleUpdateTextAd({ ad_id: "1915016273214320641", title: "Новый заголовок" });

    expect(lastBody()).toContain('"Id":1915016273214320641');
    expect(lastBody()).not.toContain('"Id":"1915016273214320641"');
  });

  it("preserves a 19-digit ID returned by Yandex", async () => {
    const { handleListCampaigns } = await import("../tools/campaigns.js");
    mockFetch.mockResolvedValueOnce(response(
      '{"result":{"Campaigns":[{"Id":1915016273214320641,"Name":"Test"}]}}',
    ));

    const result = JSON.parse(await handleListCampaigns({}));
    expect(result.result.Campaigns[0].Id).toBe("1915016273214320641");
  });
});

describe("new tools", () => {
  beforeEach(() => mockFetch.mockReset());

  it("manages campaigns in one request", async () => {
    const { handleManageCampaigns } = await import("../tools/campaigns.js");
    mockFetch.mockResolvedValueOnce(ok({ result: { SuspendResults: [{ Id: 1 }] } }));

    await handleManageCampaigns({ campaign_ids: ["1915016273214320641"], action: "suspend" });

    expect(lastBody()).toContain('"method":"suspend"');
    expect(lastBody()).toContain('"Ids":[1915016273214320641]');
  });

  it("requests the search-query report", async () => {
    const { handleGetSearchQueries } = await import("../tools/search_queries.js");
    mockFetch.mockResolvedValueOnce(response("Query\tClicks\nкупить orchestra\t2"));

    const result = await handleGetSearchQueries({
      campaign_ids: ["123"],
      date_from: "2026-07-01",
      date_to: "2026-07-23",
    });

    expect(result).toContain("купить orchestra");
    expect(lastBody()).toContain('"ReportType":"SEARCH_QUERY_PERFORMANCE_REPORT"');
  });

  it("creates a sitelinks set", async () => {
    const { handleSetSitelinks } = await import("../tools/sitelinks.js");
    mockFetch.mockResolvedValueOnce(ok({ result: { AddResults: [{ Id: 55 }] } }));

    await handleSetSitelinks({
      sitelinks: [{ title: "Тарифы", href: "https://seedon.ru/#pricing" }],
    });

    expect(lastBody()).toContain('"method":"add"');
    expect(lastBody()).toContain('"Title":"Тарифы"');
  });

  it("lists callout extensions", async () => {
    const { handleListAdExtensions } = await import("../tools/ad_extensions.js");
    mockFetch.mockResolvedValueOnce(ok({ result: { AdExtensions: [] } }));

    await handleListAdExtensions({});

    expect(lastBody()).toContain('"Types":["CALLOUT"]');
    expect(lastBody()).toContain('"CalloutFieldNames":["CalloutText"]');
  });

  it("sets an existing bid adjustment", async () => {
    const { handleSetBidAdjustments } = await import("../tools/bid_adjustments.js");
    mockFetch.mockResolvedValueOnce(ok({ result: { SetResults: [{ Id: 99 }] } }));

    await handleSetBidAdjustments({
      adjustments: [{ adjustment_id: "1915016273214320641", bid_modifier: 80 }],
    });

    expect(lastBody()).toContain('"Id":1915016273214320641');
    expect(lastBody()).toContain('"BidModifier":80');
  });

  it("sets maximum-clicks strategy using rubles", async () => {
    const { handleSetStrategy } = await import("../tools/strategy.js");
    mockFetch.mockResolvedValueOnce(ok({ result: { UpdateResults: [{ Id: 123 }] } }));

    await handleSetStrategy({
      campaign_id: "123",
      search_type: "WB_MAXIMUM_CLICKS",
      network_type: "NETWORK_DEFAULT",
      weekly_spend_limit: 1000,
    });

    expect(lastBody()).toContain('"WeeklySpendLimit":1000000000');
    expect(lastBody()).toContain('"NetworkDefault":{}');
  });
});
