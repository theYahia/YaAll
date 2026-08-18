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
});
