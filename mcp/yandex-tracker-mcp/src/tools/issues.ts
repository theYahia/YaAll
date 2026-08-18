import { z } from "zod";
import { trackerRequest } from "../client.js";

export const listIssuesSchema = z.object({
  queue: z.string().optional().describe("Queue key to filter (e.g. PROJ)"),
  keys: z.array(z.string()).optional().describe("List of issue keys to retrieve"),
  filter: z.record(z.unknown()).optional().describe("Filter object, e.g. {assignee: 'me', status: 'open'}"),
  order: z.string().optional().describe("Sort order, e.g. '+updated' or '-created'"),
});

export async function handleListIssues(params: z.infer<typeof listIssuesSchema>): Promise<string> {
  const body: Record<string, unknown> = {};
  if (params.queue) body.queue = params.queue;
  if (params.keys) body.keys = params.keys;
  if (params.filter) body.filter = params.filter;
  if (params.order) body.order = params.order;

  const result = await trackerRequest("POST", "issues/_search", body);
  return JSON.stringify(result, null, 2);
}

export const getIssueSchema = z.object({
  issue_key: z.string().describe("Issue key (e.g. PROJ-123)"),
});

export async function handleGetIssue(params: z.infer<typeof getIssueSchema>): Promise<string> {
  const result = await trackerRequest("GET", `issues/${params.issue_key}`);
  return JSON.stringify(result, null, 2);
}

export const createIssueSchema = z.object({
  queue: z.string().describe("Queue key (e.g. PROJ)"),
  summary: z.string().describe("Issue title/summary"),
  description: z.string().optional().describe("Issue description (supports wiki markup)"),
  type: z.string().optional().describe("Issue type key (e.g. task, bug, story)"),
  priority: z.string().optional().describe("Priority key (e.g. critical, normal, low)"),
  assignee: z.string().optional().describe("Assignee login"),
  parent: z.string().optional().describe("Parent issue key for subtasks"),
});

export async function handleCreateIssue(params: z.infer<typeof createIssueSchema>): Promise<string> {
  const body: Record<string, unknown> = {
    queue: params.queue,
    summary: params.summary,
  };
  if (params.description) body.description = params.description;
  if (params.type) body.type = params.type;
  if (params.priority) body.priority = params.priority;
  if (params.assignee) body.assignee = params.assignee;
  if (params.parent) body.parent = params.parent;

  const result = await trackerRequest("POST", "issues", body);
  return JSON.stringify(result, null, 2);
}

export const updateIssueSchema = z.object({
  issue_key: z.string().describe("Issue key to update (e.g. PROJ-123)"),
  summary: z.string().optional().describe("New summary"),
  description: z.string().optional().describe("New description"),
  priority: z.string().optional().describe("New priority key"),
  assignee: z.string().optional().describe("New assignee login"),
});

export async function handleUpdateIssue(params: z.infer<typeof updateIssueSchema>): Promise<string> {
  const body: Record<string, unknown> = {};
  if (params.summary !== undefined) body.summary = params.summary;
  if (params.description !== undefined) body.description = params.description;
  if (params.priority !== undefined) body.priority = params.priority;
  if (params.assignee !== undefined) body.assignee = params.assignee;

  const result = await trackerRequest("PATCH", `issues/${params.issue_key}`, body);
  return JSON.stringify(result, null, 2);
}

export const transitionIssueSchema = z.object({
  issue_key: z.string().describe("Issue key (e.g. PROJ-123)"),
  transition_id: z.string().describe("Transition ID to execute"),
  comment: z.string().optional().describe("Comment for the transition"),
});

export async function handleTransitionIssue(params: z.infer<typeof transitionIssueSchema>): Promise<string> {
  const body: Record<string, unknown> = {};
  if (params.comment) body.comment = params.comment;

  const result = await trackerRequest("POST", `issues/${params.issue_key}/transitions/${params.transition_id}/_execute`, body);
  return JSON.stringify(result, null, 2);
}

export const searchIssuesSchema = z.object({
  query: z.string().describe("Yandex Tracker query language string (e.g. 'Queue: PROJ AND Status: open')"),
  order: z.string().optional().describe("Sort order, e.g. 'Updated DESC'"),
});

export async function handleSearchIssues(params: z.infer<typeof searchIssuesSchema>): Promise<string> {
  const body: Record<string, unknown> = { query: params.query };
  if (params.order) body.order = params.order;

  const result = await trackerRequest("POST", "issues/_search", body);
  return JSON.stringify(result, null, 2);
}
