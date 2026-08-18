import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

process.env.YANDEX_360_TOKEN = "test-oauth-token";
process.env.YANDEX_360_ORG_ID = "org-123";

describe("yandex-360-mcp tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ users: [] }),
      text: () => Promise.resolve(JSON.stringify({ users: [] })),
    });
  });

  describe("users", () => {
    it("handleListUsers calls directory API", async () => {
      const { handleListUsers } = await import("../tools/users.js");
      await handleListUsers({});
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("api360.yandex.net");
      expect(url).toContain("/users");
    });

    it("handleGetUser calls user by ID", async () => {
      const { handleGetUser } = await import("../tools/users.js");
      await handleGetUser({ user_id: "abc123" });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/users/abc123");
    });

    it("handleCreateUser sends POST with body", async () => {
      const { handleCreateUser } = await import("../tools/users.js");
      await handleCreateUser({ login: "john", name_first: "John", name_last: "Doe", password: "pass123" });
      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(body.nickname).toBe("john");
      expect(body.name.first).toBe("John");
    });
  });

  describe("departments", () => {
    it("handleListDepartments calls directory API", async () => {
      const { handleListDepartments } = await import("../tools/departments.js");
      await handleListDepartments({});
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/departments");
    });
  });

  describe("groups", () => {
    it("handleListGroups calls directory API", async () => {
      const { handleListGroups } = await import("../tools/groups.js");
      await handleListGroups({});
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/groups");
    });
  });

  describe("disk", () => {
    it("handleListDiskResources calls disk API", async () => {
      const { handleListDiskResources } = await import("../tools/disk.js");
      await handleListDiskResources({ path: "/" });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("disk/v1/resources");
    });

    it("handleUploadDiskFile gets upload URL then uploads", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ href: "https://upload.example.com/put" })),
        })
        .mockResolvedValueOnce({ ok: true });

      const { handleUploadDiskFile } = await import("../tools/disk.js");
      const result = await handleUploadDiskFile({ path: "/test.txt", content: "hello", overwrite: false });
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(JSON.parse(result).success).toBe(true);
    });
  });

  describe("calendar", () => {
    it("handleListCalendarEvents calls calendar API", async () => {
      const { handleListCalendarEvents } = await import("../tools/calendar.js");
      await handleListCalendarEvents({ user_id: "user1", from: "2026-04-01T00:00:00Z", to: "2026-04-02T00:00:00Z" });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("calendar/v1/users/user1/events");
    });

    it("handleCreateCalendarEvent sends event body", async () => {
      const { handleCreateCalendarEvent } = await import("../tools/calendar.js");
      await handleCreateCalendarEvent({
        user_id: "user1",
        summary: "Meeting",
        start: "2026-04-01T10:00:00Z",
        end: "2026-04-01T11:00:00Z",
        attendees: ["a@test.com"],
      });
      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(body.summary).toBe("Meeting");
      expect(body.attendees[0].email).toBe("a@test.com");
    });
  });

  describe("error handling", () => {
    it("throws on missing YANDEX_360_TOKEN", async () => {
      const orig = process.env.YANDEX_360_TOKEN;
      delete process.env.YANDEX_360_TOKEN;
      const { y360Request } = await import("../client.js");
      await expect(y360Request("GET", "test")).rejects.toThrow("YANDEX_360_TOKEN");
      process.env.YANDEX_360_TOKEN = orig;
    });
  });
});
