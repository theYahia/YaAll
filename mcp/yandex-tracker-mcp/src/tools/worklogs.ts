import { z } from "zod";
import { trackerRequest } from "../client.js";

export const listWorklogsSchema = z.object({
  issue_key: z.string().describe("Issue key (e.g. PROJ-123)"),
});

export async function handleListWorklogs(params: z.infer<typeof listWorklogsSchema>): Promise<string> {
  const result = await trackerRequest("GET", `issues/${params.issue_key}/worklog`);
  return JSON.stringify(result, null, 2);
}

export const logWorklogSchema = z.object({
  issue_key: z.string().describe("Issue key (e.g. PROJ-123)"),
  duration: z.string().describe("Duration in ISO 8601 format (e.g. PT1H30M for 1h30m)"),
  comment: z.string().optional().describe("Worklog comment"),
  start: z.string().optional().describe("Work start datetime in ISO format"),
});

export async function handleLogWorklog(params: z.infer<typeof logWorklogSchema>): Promise<string> {
  const body: Record<string, unknown> = {
    duration: params.duration,
  };
  if (params.comment) body.comment = params.comment;
  if (params.start) body.start = params.start;

  const result = await trackerRequest("POST", `issues/${params.issue_key}/worklog`, body);
  return JSON.stringify(result, null, 2);
}
