import { z } from "zod";
import { y360Request, orgPath } from "../client.js";

export const listUsersSchema = z.object({
  page: z.number().optional().describe("Page number (starts from 1)"),
  per_page: z.number().optional().describe("Results per page (max 1000)"),
});

export async function handleListUsers(params: z.infer<typeof listUsersSchema>): Promise<string> {
  const qp: Record<string, string> = {};
  if (params.page) qp.page = String(params.page);
  if (params.per_page) qp.perPage = String(params.per_page);

  const result = await y360Request("GET", orgPath("users"), undefined, qp);
  return JSON.stringify(result, null, 2);
}

export const getUserSchema = z.object({
  user_id: z.string().describe("User ID"),
});

export async function handleGetUser(params: z.infer<typeof getUserSchema>): Promise<string> {
  const result = await y360Request("GET", orgPath(`users/${params.user_id}`));
  return JSON.stringify(result, null, 2);
}

export const createUserSchema = z.object({
  login: z.string().describe("User login (before @domain)"),
  name_first: z.string().describe("First name"),
  name_last: z.string().describe("Last name"),
  password: z.string().describe("Initial password"),
  department_id: z.number().optional().describe("Department ID"),
});

export async function handleCreateUser(params: z.infer<typeof createUserSchema>): Promise<string> {
  const body: Record<string, unknown> = {
    nickname: params.login,
    name: { first: params.name_first, last: params.name_last },
    password: params.password,
  };
  if (params.department_id !== undefined) body.departmentId = params.department_id;

  const result = await y360Request("POST", orgPath("users"), body);
  return JSON.stringify(result, null, 2);
}
