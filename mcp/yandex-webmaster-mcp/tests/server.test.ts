import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/index.js";

const EXPECTED_TOOLS = [
  "get_hosts",
  "get_user_info",
  "get_popular_search_queries",
  "get_query_analytics",
  "get_search_queries",
  "get_indexing",
  "get_indexing_history",
  "submit_url",
  "get_recrawl_quota",
  "get_recrawl_task",
  "get_sitemaps",
  "get_diagnostics",
  "get_important_urls",
].sort();

async function connectedClient() {
  const server = createServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { server, client };
}

describe("createServer", () => {
  beforeEach(() => {
    process.env.YANDEX_WEBMASTER_TOKEN = "test-token";
    process.env.YANDEX_WEBMASTER_USER_ID = "99";
  });

  it("registers exactly the expected tools", async () => {
    const { server, client } = await connectedClient();
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(EXPECTED_TOOLS);
    await client.close();
    await server.close();
  });

  it("marks reads as readOnly and submit_url as a non-read action", async () => {
    const { server, client } = await connectedClient();
    const { tools } = await client.listTools();
    const hosts = tools.find((t) => t.name === "get_hosts");
    const submit = tools.find((t) => t.name === "submit_url");
    expect(hosts?.annotations?.readOnlyHint).toBe(true);
    expect(submit?.annotations?.readOnlyHint).toBe(false);
    await client.close();
    await server.close();
  });

  it("flags the deprecated tool in its description", async () => {
    const { server, client } = await connectedClient();
    const { tools } = await client.listTools();
    const dep = tools.find((t) => t.name === "get_search_queries");
    expect(dep?.description).toMatch(/DEPRECATED/i);
    await client.close();
    await server.close();
  });
});
