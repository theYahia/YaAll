import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally before importing modules
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Set env before imports
process.env.YANDEX_DIRECT_TOKEN = "test-token-123";

function mockOk(data: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => null },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === "string" ? data : JSON.stringify(data)),
  };
}

function mockError(status: number, body = "") {
  return {
    ok: false,
    status,
    statusText: "Error",
    headers: { get: () => null },
    text: () => Promise.resolve(body),
  };
}

function lastBody() {
  return JSON.parse(mockFetch.mock.calls[mockFetch.mock.calls.length - 1][1].body);
}

// ─── list_campaigns ───

describe("list_campaigns", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns campaigns list", async () => {
    const { handleListCampaigns } = await import("../tools/campaigns.js");
    const payload = { result: { Campaigns: [{ Id: 1, Name: "Test", Status: "ACCEPTED" }] } };
    mockFetch.mockResolvedValueOnce(mockOk(payload));

    const result = JSON.parse(await handleListCampaigns({}));
    expect(result.result.Campaigns).toHaveLength(1);
    expect(result.result.Campaigns[0].Id).toBe(1);
  });

  it("passes status filter", async () => {
    const { handleListCampaigns } = await import("../tools/campaigns.js");
    mockFetch.mockResolvedValueOnce(mockOk({ result: { Campaigns: [] } }));

    await handleListCampaigns({ status: "DRAFT" });
    expect(lastBody().params.SelectionCriteria.Statuses).toEqual(["DRAFT"]);
  });

  it("adds Page when limit/offset given", async () => {
    const { handleListCampaigns } = await import("../tools/campaigns.js");
    mockFetch.mockResolvedValueOnce(mockOk({ result: { Campaigns: [] } }));

    await handleListCampaigns({ limit: 100, offset: 50 });
    expect(lastBody().params.Page).toEqual({ Limit: 100, Offset: 50 });
  });

  it("surfaces LimitedBy notice", async () => {
    const { handleListCampaigns } = await import("../tools/campaigns.js");
    mockFetch.mockResolvedValueOnce(mockOk({ result: { Campaigns: [], LimitedBy: 10000 } }));

    const res = await handleListCampaigns({});
    expect(res).toContain("LimitedBy=10000");
    expect(res).toContain("offset=10000");
  });
});

// ─── get_campaign ───

describe("get_campaign", () => {
  beforeEach(() => mockFetch.mockReset());

  it("fetches campaign by ID", async () => {
    const { handleGetCampaign } = await import("../tools/campaigns.js");
    mockFetch.mockResolvedValueOnce(mockOk({ result: { Campaigns: [{ Id: 42, Name: "My Campaign" }] } }));

    const result = JSON.parse(await handleGetCampaign({ campaign_id: 42 }));
    expect(result.result.Campaigns[0].Id).toBe(42);
    expect(lastBody().params.SelectionCriteria.Ids).toEqual([42]);
  });
});

// ─── create_campaign (рубли → микроединицы) ───

describe("create_campaign", () => {
  beforeEach(() => mockFetch.mockReset());

  it("converts daily_budget rubles to micros", async () => {
    const { handleCreateCampaign, createCampaignSchema } = await import("../tools/campaigns.js");
    mockFetch.mockResolvedValueOnce(mockOk({ result: { AddResults: [{ Id: 100 }] } }));

    const params = createCampaignSchema.parse({
      name: "New Campaign",
      type: "TEXT_CAMPAIGN",
      start_date: "2026-04-01",
      daily_budget: 5000, // рублей
    });
    const result = JSON.parse(await handleCreateCampaign(params));
    expect(result.result.AddResults[0].Id).toBe(100);

    const body = lastBody();
    expect(body.method).toBe("add");
    expect(body.params.Campaigns[0].Name).toBe("New Campaign");
    expect(body.params.Campaigns[0].DailyBudget.Amount).toBe(5_000_000_000); // 5000 ₽ × 1e6
    expect(body.params.Campaigns[0].TextCampaign.BiddingStrategy.Search.BiddingStrategyType).toBe("HIGHEST_POSITION");
  });
});

// ─── update_campaign (status + поля одновременно) ───

describe("update_campaign", () => {
  beforeEach(() => mockFetch.mockReset());

  it("runs both status action and field update", async () => {
    const { handleUpdateCampaign } = await import("../tools/campaigns.js");
    mockFetch
      .mockResolvedValueOnce(mockOk({ result: { SuspendResults: [{ Id: 1 }] } }))
      .mockResolvedValueOnce(mockOk({ result: { UpdateResults: [{ Id: 1 }] } }));

    await handleUpdateCampaign({ campaign_id: 1, status: "SUSPEND", daily_budget: 100 });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).method).toBe("suspend");
    const upd = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(upd.method).toBe("update");
    expect(upd.params.Campaigns[0].DailyBudget.Amount).toBe(100_000_000);
  });

  it("surfaces per-item errors from a combined call", async () => {
    const { handleUpdateCampaign } = await import("../tools/campaigns.js");
    mockFetch
      .mockResolvedValueOnce(mockOk({ result: { SuspendResults: [{ Id: 1 }] } }))
      .mockResolvedValueOnce(mockOk({ result: { UpdateResults: [{ Errors: [{ Code: 8800, Message: "Бюджет недопустим" }] }] } }));

    const res = await handleUpdateCampaign({ campaign_id: 1, status: "SUSPEND", daily_budget: 1 });
    expect(res).toContain("Бюджет недопустим");
    expect(res).toContain("❌");
  });
});

// ─── list_ad_groups ───

describe("list_ad_groups", () => {
  beforeEach(() => mockFetch.mockReset());

  it("fetches ad groups by campaign IDs", async () => {
    const { handleListAdGroups } = await import("../tools/ad_groups.js");
    mockFetch.mockResolvedValueOnce(mockOk({ result: { AdGroups: [{ Id: 10, Name: "Group 1", CampaignId: 1 }] } }));

    const result = JSON.parse(await handleListAdGroups({ campaign_ids: [1, 2] }));
    expect(result.result.AdGroups).toHaveLength(1);
    expect(lastBody().params.SelectionCriteria.CampaignIds).toEqual([1, 2]);
  });
});

// ─── create_text_ad ───

describe("create_text_ad", () => {
  beforeEach(() => mockFetch.mockReset());

  it("sends ad with title, text, href", async () => {
    const { handleCreateTextAd } = await import("../tools/ads.js");
    mockFetch.mockResolvedValueOnce(mockOk({ result: { AddResults: [{ Id: 200 }] } }));

    await handleCreateTextAd({
      ad_group_id: 10,
      title: "Buy Now",
      text: "Best deals here",
      href: "https://example.com",
    });

    const body = lastBody();
    expect(body.method).toBe("add");
    expect(body.params.Ads[0].TextAd.Title).toBe("Buy Now");
    expect(body.params.Ads[0].TextAd.Href).toBe("https://example.com");
    expect(body.params.Ads[0].AdGroupId).toBe(10);
  });
});

// ─── manage_ads ───

describe("manage_ads", () => {
  beforeEach(() => mockFetch.mockReset());

  it("suspends ads by IDs", async () => {
    const { handleManageAds } = await import("../tools/ads.js");
    mockFetch.mockResolvedValueOnce(mockOk({ result: { SuspendResults: [{ Id: 1 }, { Id: 2 }] } }));

    await handleManageAds({ ad_ids: [1, 2], action: "suspend" });
    const body = lastBody();
    expect(body.method).toBe("suspend");
    expect(body.params.SelectionCriteria.Ids).toEqual([1, 2]);
  });
});

// ─── add_keywords ───

describe("add_keywords", () => {
  beforeEach(() => mockFetch.mockReset());

  it("sends keywords array", async () => {
    const { handleAddKeywords } = await import("../tools/keywords.js");
    mockFetch.mockResolvedValueOnce(mockOk({ result: { AddResults: [{ Id: 300 }, { Id: 301 }] } }));

    await handleAddKeywords({
      ad_group_id: 10,
      keywords: ["купить телефон", "смартфон недорого"],
    });

    const body = lastBody();
    expect(body.params.Keywords).toHaveLength(2);
    expect(body.params.Keywords[0].Keyword).toBe("купить телефон");
    expect(body.params.Keywords[0].AdGroupId).toBe(10);
  });
});

// ─── list_keywords (Bid микро → рубли на выводе) ───

describe("list_keywords", () => {
  beforeEach(() => mockFetch.mockReset());

  it("converts Bid micros to rubles in output", async () => {
    const { handleListKeywords } = await import("../tools/keywords.js");
    mockFetch.mockResolvedValueOnce(mockOk({ result: { Keywords: [{ Id: 1, Bid: 30_000_000, ContextBid: 15_000_000 }] } }));

    const res = JSON.parse(await handleListKeywords({ ad_group_ids: [1] }));
    expect(res.result.Keywords[0].Bid).toBe(30);
    expect(res.result.Keywords[0].ContextBid).toBe(15);
  });
});

// ─── set_keyword_bids ───

describe("set_keyword_bids", () => {
  beforeEach(() => mockFetch.mockReset());

  it("converts rubles to micros and targets keywords", async () => {
    const { handleSetKeywordBids } = await import("../tools/bids.js");
    mockFetch.mockResolvedValueOnce(mockOk({ result: { SetResults: [{ KeywordId: 1 }] } }));

    await handleSetKeywordBids({ keyword_ids: [1, 2], bid: 12.5 });
    const body = lastBody();
    expect(body.method).toBe("set");
    expect(body.params.Bids[0].KeywordId).toBe(1);
    expect(body.params.Bids[0].Bid).toBe(12_500_000);
    expect(body.params.Bids).toHaveLength(2);
  });

  it("rejects when no target level given", async () => {
    const { handleSetKeywordBids } = await import("../tools/bids.js");
    await expect(handleSetKeywordBids({ bid: 10 })).rejects.toThrow(/ровно один уровень/);
  });

  it("rejects when no bid given", async () => {
    const { handleSetKeywordBids } = await import("../tools/bids.js");
    await expect(handleSetKeywordBids({ keyword_ids: [1] })).rejects.toThrow(/bid/);
  });
});

// ─── negative keywords ───

describe("negative_keywords", () => {
  beforeEach(() => mockFetch.mockReset());

  it("sets campaign negative keywords", async () => {
    const { handleSetCampaignNegativeKeywords } = await import("../tools/negative_keywords.js");
    mockFetch.mockResolvedValueOnce(mockOk({ result: { UpdateResults: [{ Id: 1 }] } }));

    await handleSetCampaignNegativeKeywords({ campaign_id: 1, negative_keywords: ["бесплатно", "даром"] });
    const body = lastBody();
    expect(body.method).toBe("update");
    expect(body.params.Campaigns[0].NegativeKeywords.Items).toEqual(["бесплатно", "даром"]);
  });

  it("sets ad group negative keywords", async () => {
    const { handleSetAdGroupNegativeKeywords } = await import("../tools/negative_keywords.js");
    mockFetch.mockResolvedValueOnce(mockOk({ result: { UpdateResults: [{ Id: 5 }] } }));

    await handleSetAdGroupNegativeKeywords({ ad_group_id: 5, negative_keywords: ["скачать"] });
    expect(lastBody().params.AdGroups[0].NegativeKeywords.Items).toEqual(["скачать"]);
  });
});

// ─── get_statistics (с поллингом отчёта) ───

describe("get_statistics", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns report TSV on 200", async () => {
    const { handleGetStatistics } = await import("../tools/statistics.js");
    mockFetch.mockResolvedValueOnce(mockOk("Date\tCampaignName\tImpressions\n2026-01-01\tTest\t100"));

    const result = await handleGetStatistics({ campaign_ids: [1], date_from: "2026-01-01", date_to: "2026-01-31" });
    expect(result).toContain("Impressions");
  });

  it("polls on 202 then returns on 200", async () => {
    const { handleGetStatistics } = await import("../tools/statistics.js");
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 202, headers: { get: (k: string) => (k === "retryIn" ? "0" : null) }, text: () => Promise.resolve("") })
      .mockResolvedValueOnce({ ok: true, status: 200, headers: { get: () => null }, text: () => Promise.resolve("Clicks\n5") });

    const res = await handleGetStatistics({ campaign_ids: [1], date_from: "2026-01-01", date_to: "2026-01-31" });
    expect(res).toContain("Clicks");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

// ─── get_account_balance (Live v4) ───

describe("get_account_balance", () => {
  beforeEach(() => mockFetch.mockReset());

  it("queries Live v4 AccountManagement.Get", async () => {
    const { handleGetAccountBalance } = await import("../tools/account.js");
    mockFetch.mockResolvedValueOnce(mockOk({ data: { Accounts: [{ Amount: 1234.5, Currency: "RUB" }] } }));

    const res = JSON.parse(await handleGetAccountBalance({}));
    expect(res.data.Accounts[0].Amount).toBe(1234.5); // money:false — не конвертируется

    const body = lastBody();
    expect(body.method).toBe("AccountManagement");
    expect(body.param.Action).toBe("Get");
    expect(body.token).toBe("test-token-123");
    expect(mockFetch.mock.calls[0][0]).toContain("/live/v4/json/");
  });
});

// ─── Error handling ───

describe("error handling", () => {
  beforeEach(() => mockFetch.mockReset());

  it("throws on missing token", async () => {
    const saved = process.env.YANDEX_DIRECT_TOKEN;
    delete process.env.YANDEX_DIRECT_TOKEN;

    const { apiPost } = await import("../client.js");
    await expect(apiPost("campaigns", "get")).rejects.toThrow("YANDEX_DIRECT_TOKEN");

    process.env.YANDEX_DIRECT_TOKEN = saved;
  });

  it("throws on HTTP 4xx errors", async () => {
    const { handleListCampaigns } = await import("../tools/campaigns.js");
    mockFetch.mockResolvedValueOnce(mockError(403, "Forbidden"));

    await expect(handleListCampaigns({})).rejects.toThrow("HTTP 403");
  });

  it("throws on API error object inside HTTP 200 body", async () => {
    const { handleListCampaigns } = await import("../tools/campaigns.js");
    mockFetch.mockResolvedValueOnce(mockOk({
      error: { error_code: 53, error_string: "Неверная авторизация", error_detail: "bad token", request_id: "abc" },
    }));

    await expect(handleListCampaigns({})).rejects.toThrow("Неверная авторизация");
  });

  it("surfaces per-item errors in output (partial success)", async () => {
    const { handleAddKeywords } = await import("../tools/keywords.js");
    mockFetch.mockResolvedValueOnce(mockOk({
      result: { AddResults: [{ Id: 1 }, { Errors: [{ Code: 5, Message: "Дубль фразы" }] }] },
    }));

    const res = await handleAddKeywords({ ad_group_id: 1, keywords: ["a", "b"] });
    expect(res).toContain("Дубль фразы");
    expect(res).toContain("❌");
  });
});

// ─── Auth / headers / sandbox ───

describe("headers and config", () => {
  beforeEach(() => mockFetch.mockReset());

  it("sends Bearer token in Authorization header", async () => {
    const { handleListCampaigns } = await import("../tools/campaigns.js");
    mockFetch.mockResolvedValueOnce(mockOk({ result: { Campaigns: [] } }));

    await handleListCampaigns({});
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe("Bearer test-token-123");
  });

  it("sends Client-Login header when YANDEX_DIRECT_LOGIN set", async () => {
    process.env.YANDEX_DIRECT_LOGIN = "client-login";
    const { handleListCampaigns } = await import("../tools/campaigns.js");
    mockFetch.mockResolvedValueOnce(mockOk({ result: { Campaigns: [] } }));

    await handleListCampaigns({});
    expect(mockFetch.mock.calls[0][1].headers["Client-Login"]).toBe("client-login");
    delete process.env.YANDEX_DIRECT_LOGIN;
  });

  it("uses sandbox base URL when YANDEX_DIRECT_SANDBOX=1", async () => {
    vi.resetModules();
    process.env.YANDEX_DIRECT_SANDBOX = "1";
    const { apiPost } = await import("../client.js");
    mockFetch.mockResolvedValueOnce(mockOk({ result: {} }));

    await apiPost("campaigns", "get");
    expect(mockFetch.mock.calls[0][0]).toContain("api-sandbox.direct.yandex.com");

    delete process.env.YANDEX_DIRECT_SANDBOX;
    vi.resetModules();
  });
});
