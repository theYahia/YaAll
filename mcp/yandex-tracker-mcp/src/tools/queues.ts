import { z } from "zod";
import { trackerRequest } from "../client.js";

export const listQueuesSchema = z.object({});

export async function handleListQueues(_params: z.infer<typeof listQueuesSchema>): Promise<string> {
  const result = await trackerRequest("GET", "queues");
  return JSON.stringify(result, null, 2);
}

export const getQueueSchema = z.object({
  queue_key: z.string().describe("Queue key (e.g. PROJ)"),
});

export async function handleGetQueue(params: z.infer<typeof getQueueSchema>): Promise<string> {
  const result = await trackerRequest("GET", `queues/${params.queue_key}`);
  return JSON.stringify(result, null, 2);
}

/**
 * Права доступа к очереди.
 *
 * У Трекера ДВА представления прав, и это ловушка:
 *   - `queues/<key>/access`      — то, что показывают Настройки очереди → Доступ.
 *                                  Пишется, читается, работает.
 *   - `queues/<key>/permissions` — ролевое представление. PATCH сюда возвращает
 *                                  200 и молча игнорирует тело.
 * Поэтому оба инструмента ходят в `/access`. Проверено живьём 29.08.2026.
 */

const PERMISSIONS = ["create", "read", "write", "writeNoAssign", "grant"] as const;

export const getQueueAccessSchema = z.object({
  queue_key: z.string().describe("Queue key (e.g. PROJ)"),
});

export async function handleGetQueueAccess(params: z.infer<typeof getQueueAccessSchema>): Promise<string> {
  const result = await trackerRequest("GET", `queues/${params.queue_key}/access`);
  return JSON.stringify(result, null, 2);
}

export const setQueueAccessSchema = z.object({
  queue_key: z.string().describe("Queue key (e.g. PROJ)"),
  permission: z.enum(PERMISSIONS).describe(
    "Which permission to set. read = who sees the queue's issues at all; " +
    "write = who can edit them; create = who can add new ones; " +
    "writeNoAssign = edit without becoming assignee; grant = who can change access.",
  ),
  users: z.array(z.string()).optional().describe("User IDs (uid), e.g. ['8000000000000005']"),
  groups: z.array(z.string()).optional().describe("Group IDs, e.g. ['1'] — group 1 is «Все сотрудники»"),
});

export async function handleSetQueueAccess(params: z.infer<typeof setQueueAccessSchema>): Promise<string> {
  const { queue_key, permission, users, groups } = params;

  // Пустой список не «оставит как было», а снимет право у всех разом.
  // Проверка здесь, а не в .refine(): MCP SDK регистрирует тул по .shape,
  // которого у ZodEffects нет.
  if (!users?.length && !groups?.length) {
    throw new Error(
      `Refusing to set "${permission}" to an empty list — that would strip the permission from everyone. ` +
      `Pass at least one user or group.`,
    );
  }

  const path = `queues/${queue_key}/access`;

  // Список ЗАМЕЩАЕТСЯ целиком, а не дополняется — поэтому снимаем «до» и отдаём
  // обе версии наружу: без этого молчаливая потеря чужого доступа не видна.
  const before = await trackerRequest("GET", path);

  const entry: Record<string, string[]> = {};
  if (users?.length) entry.users = users;
  if (groups?.length) entry.groups = groups;
  await trackerRequest("PATCH", path, { [permission]: entry });

  const after = await trackerRequest("GET", path);
  return JSON.stringify({ permission, before, after }, null, 2);
}
