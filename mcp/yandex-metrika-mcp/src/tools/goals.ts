import { z } from "zod";
import { apiGet, apiPost, apiDelete } from "../client.js";

// --- list_goals ---
export const listGoalsSchema = z.object({
  counter_id: z.number().describe("Counter ID to list goals for"),
});

export async function handleListGoals(params: z.infer<typeof listGoalsSchema>): Promise<string> {
  const data = await apiGet(`/management/v1/counter/${params.counter_id}/goals`);
  return JSON.stringify(data, null, 2);
}

// --- create_goal ---
export const createGoalSchema = z.object({
  counter_id: z.number().describe("Counter ID to create the goal in"),
  name: z.string().describe("Goal display name"),
  type: z.enum(["url", "number", "step", "action"]).describe("Goal type: 'url' (page visit), 'number' (page count), 'step' (multi-step funnel), 'action' (JS event)"),
  conditions: z.array(z.object({
    type: z.enum(["exact", "contain", "regexp", "action"]).describe("Condition match type"),
    url: z.string().optional().describe("URL pattern for url/contain/regexp conditions"),
  })).optional().describe("Conditions array. Required for url, step, action goal types."),
});

export async function handleCreateGoal(params: z.infer<typeof createGoalSchema>): Promise<string> {
  const body: Record<string, unknown> = {
    name: params.name,
    type: params.type,
  };
  if (params.conditions?.length) {
    body.conditions = params.conditions;
  }
  const data = await apiPost(
    `/management/v1/counter/${params.counter_id}/goals`,
    { goal: body },
  );
  return JSON.stringify(data, null, 2);
}

// --- delete_goal ---
export const deleteGoalSchema = z.object({
  counter_id: z.number().describe("Counter ID the goal belongs to"),
  goal_id: z.number().describe("Goal ID to delete"),
});

export async function handleDeleteGoal(params: z.infer<typeof deleteGoalSchema>): Promise<string> {
  const data = await apiDelete(
    `/management/v1/counter/${params.counter_id}/goal/${params.goal_id}`,
  );
  return JSON.stringify(data, null, 2);
}
