import { z } from "zod";
import { trackerRequest } from "../client.js";

export const listCommentsSchema = z.object({
  issue_key: z.string().describe("Issue key (e.g. PROJ-123)"),
});

export async function handleListComments(params: z.infer<typeof listCommentsSchema>): Promise<string> {
  const result = await trackerRequest("GET", `issues/${params.issue_key}/comments`);
  return JSON.stringify(result, null, 2);
}

export const addCommentSchema = z.object({
  issue_key: z.string().describe("Issue key (e.g. PROJ-123)"),
  text: z.string().describe("Comment text (supports wiki markup)"),
});

export async function handleAddComment(params: z.infer<typeof addCommentSchema>): Promise<string> {
  const result = await trackerRequest("POST", `issues/${params.issue_key}/comments`, {
    text: params.text,
  });
  return JSON.stringify(result, null, 2);
}
