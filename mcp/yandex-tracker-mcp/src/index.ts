#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { listIssuesSchema, handleListIssues, getIssueSchema, handleGetIssue, createIssueSchema, handleCreateIssue, updateIssueSchema, handleUpdateIssue, transitionIssueSchema, handleTransitionIssue, searchIssuesSchema, handleSearchIssues } from "./tools/issues.js";
import { listCommentsSchema, handleListComments, addCommentSchema, handleAddComment } from "./tools/comments.js";
import { listQueuesSchema, handleListQueues, getQueueSchema, handleGetQueue, getQueueAccessSchema, handleGetQueueAccess, setQueueAccessSchema, handleSetQueueAccess } from "./tools/queues.js";
import { listWorklogsSchema, handleListWorklogs, logWorklogSchema, handleLogWorklog } from "./tools/worklogs.js";

const server = new McpServer({
  name: "yandex-tracker-mcp",
  version: "1.0.0",
});

server.tool(
  "list_issues",
  "Search/list issues in Yandex Tracker with optional queue, keys, and filter.",
  listIssuesSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleListIssues(params) }] }),
);

server.tool(
  "get_issue",
  "Get a single issue by key with all fields.",
  getIssueSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleGetIssue(params) }] }),
);

server.tool(
  "create_issue",
  "Create a new issue in Yandex Tracker with queue, summary, type, priority, and assignee.",
  createIssueSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleCreateIssue(params) }] }),
);

server.tool(
  "update_issue",
  "Update issue fields: summary, description, priority, assignee.",
  updateIssueSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleUpdateIssue(params) }] }),
);

server.tool(
  "list_issue_comments",
  "List all comments on an issue.",
  listCommentsSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleListComments(params) }] }),
);

server.tool(
  "add_comment",
  "Add a comment to an issue (supports wiki markup).",
  addCommentSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleAddComment(params) }] }),
);

server.tool(
  "transition_issue",
  "Execute a workflow transition on an issue (e.g. open, close, resolve).",
  transitionIssueSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleTransitionIssue(params) }] }),
);

server.tool(
  "list_queues",
  "List all available queues in Yandex Tracker.",
  listQueuesSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleListQueues(params) }] }),
);

server.tool(
  "get_queue",
  "Get queue details by key.",
  getQueueSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleGetQueue(params) }] }),
);

server.tool(
  "search_issues",
  "Search issues using Yandex Tracker query language (e.g. 'Queue: PROJ AND Status: open').",
  searchIssuesSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleSearchIssues(params) }] }),
);

server.tool(
  "log_worklog",
  "Log time spent on an issue with duration and optional comment.",
  logWorklogSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleLogWorklog(params) }] }),
);

server.tool(
  "list_worklogs",
  "List all worklog entries for an issue.",
  listWorklogsSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleListWorklogs(params) }] }),
);

server.tool(
  "get_queue_access",
  "Read who can create, read, write and grant access in a queue. Reads queues/<key>/access — the same thing the queue's Access settings show.",
  getQueueAccessSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleGetQueueAccess(params) }] }),
);

server.tool(
  "set_queue_access",
  "Set one queue permission (create/read/write/writeNoAssign/grant) to the given users and/or groups. The list REPLACES the current one, so pass everyone who should keep the permission; the reply returns the access object before and after so the change is auditable. Note: the sibling queues/<key>/permissions endpoint answers 200 and silently ignores writes — this tool uses /access, which actually applies.",
  setQueueAccessSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleSetQueueAccess(params) }] }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[yandex-tracker-mcp] Server started. 14 tools available.");
}

main().catch((error) => {
  console.error("[yandex-tracker-mcp] Error:", error);
  process.exit(1);
});
