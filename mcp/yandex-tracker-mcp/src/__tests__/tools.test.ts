import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

process.env.YANDEX_TRACKER_TOKEN = "test-oauth-token";
process.env.YANDEX_TRACKER_ORG_ID = "12345";

describe("yandex-tracker-mcp tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
      text: () => Promise.resolve("[]"),
    });
  });

  describe("issues", () => {
    it("handleListIssues calls POST issues/_search", async () => {
      const { handleListIssues } = await import("../tools/issues.js");
      await handleListIssues({ queue: "PROJ" });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("issues/_search");
      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(body.queue).toBe("PROJ");
    });

    it("handleGetIssue calls GET issues/:key", async () => {
      const { handleGetIssue } = await import("../tools/issues.js");
      await handleGetIssue({ issue_key: "PROJ-42" });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/issues/PROJ-42");
    });

    it("handleCreateIssue sends POST with fields", async () => {
      const { handleCreateIssue } = await import("../tools/issues.js");
      await handleCreateIssue({ queue: "PROJ", summary: "Test issue", type: "task" });
      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(body.queue).toBe("PROJ");
      expect(body.summary).toBe("Test issue");
      expect(body.type).toBe("task");
    });

    it("handleUpdateIssue sends PATCH", async () => {
      const { handleUpdateIssue } = await import("../tools/issues.js");
      await handleUpdateIssue({ issue_key: "PROJ-1", summary: "Updated" });
      expect(mockFetch.mock.calls[0][1]?.method).toBe("PATCH");
    });

    it("handleTransitionIssue calls execute endpoint", async () => {
      const { handleTransitionIssue } = await import("../tools/issues.js");
      await handleTransitionIssue({ issue_key: "PROJ-1", transition_id: "close" });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/transitions/close/_execute");
    });

    it("handleSearchIssues sends query", async () => {
      const { handleSearchIssues } = await import("../tools/issues.js");
      await handleSearchIssues({ query: "Queue: PROJ AND Status: open" });
      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(body.query).toContain("Queue: PROJ");
    });
  });

  describe("comments", () => {
    it("handleAddComment sends POST", async () => {
      const { handleAddComment } = await import("../tools/comments.js");
      await handleAddComment({ issue_key: "PROJ-1", text: "A comment" });
      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(body.text).toBe("A comment");
    });
  });

  describe("queues", () => {
    it("handleListQueues calls GET queues", async () => {
      const { handleListQueues } = await import("../tools/queues.js");
      await handleListQueues({});
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/v2/queues");
    });
  });

  describe("worklogs", () => {
    it("handleLogWorklog sends duration", async () => {
      const { handleLogWorklog } = await import("../tools/worklogs.js");
      await handleLogWorklog({ issue_key: "PROJ-1", duration: "PT1H30M" });
      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(body.duration).toBe("PT1H30M");
    });
  });

  describe("auth headers", () => {
    it("sends OAuth token and X-Org-ID", async () => {
      const { handleListQueues } = await import("../tools/queues.js");
      await handleListQueues({});
      const headers = mockFetch.mock.calls[0][1]?.headers;
      expect(headers["Authorization"]).toBe("OAuth test-oauth-token");
      expect(headers["X-Org-ID"]).toBe("12345");
    });
  });

  describe("queue access", () => {
    it("handleGetQueueAccess reads /access", async () => {
      const { handleGetQueueAccess } = await import("../tools/queues.js");
      await handleGetQueueAccess({ queue_key: "PROJ" });
      expect(mockFetch.mock.calls[0][0] as string).toContain("queues/PROJ/access");
    });

    // Ловушка Трекера: PATCH на /permissions отвечает 200 и молча игнорирует тело.
    // Писать надо в /access — этот тест держит адрес.
    it("handleSetQueueAccess patches /access, not /permissions", async () => {
      const { handleSetQueueAccess } = await import("../tools/queues.js");
      await handleSetQueueAccess({ queue_key: "PROJ", permission: "read", groups: ["1"] });
      const patch = mockFetch.mock.calls.find((c) => c[1]?.method === "PATCH");
      expect(patch).toBeDefined();
      expect(patch![0] as string).toContain("queues/PROJ/access");
      expect(patch![0] as string).not.toContain("permissions");
      expect(JSON.parse(patch![1]?.body as string)).toEqual({ read: { groups: ["1"] } });
    });

    it("handleSetQueueAccess snapshots access before and after the write", async () => {
      const { handleSetQueueAccess } = await import("../tools/queues.js");
      const out = JSON.parse(await handleSetQueueAccess({ queue_key: "PROJ", permission: "write", users: ["42"] }));
      expect(out).toHaveProperty("before");
      expect(out).toHaveProperty("after");
      expect(mockFetch.mock.calls.filter((c) => (c[1]?.method ?? "GET") === "GET")).toHaveLength(2);
    });

    // Пустой список не «оставил бы как было», а снял бы право у всех разом.
    it("handleSetQueueAccess refuses an empty users+groups payload without calling the API", async () => {
      const { handleSetQueueAccess } = await import("../tools/queues.js");
      await expect(handleSetQueueAccess({ queue_key: "PROJ", permission: "read" })).rejects.toThrow(/empty list/i);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
