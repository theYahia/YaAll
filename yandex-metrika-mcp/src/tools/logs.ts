import { z } from "zod";
import { apiGet } from "../client.js";

export const exportLogsSchema = z.object({
  counter_id: z.number().describe("ID счётчика Яндекс.Метрики"),
  date1: z.string().describe("Дата начала в формате YYYY-MM-DD"),
  date2: z.string().describe("Дата окончания в формате YYYY-MM-DD"),
  source: z
    .enum(["visits", "hits"])
    .default("visits")
    .describe("Тип данных: visits (визиты) или hits (просмотры)"),
  fields: z
    .string()
    .optional()
    .describe(
      "Поля через запятую. По умолчанию для visits: ym:s:date,ym:s:clientID,ym:s:lastTrafficSource,ym:s:visitDuration",
    ),
});

const DEFAULT_VISIT_FIELDS =
  "ym:s:date,ym:s:clientID,ym:s:lastTrafficSource,ym:s:visitDuration,ym:s:goalsID";
const DEFAULT_HIT_FIELDS =
  "ym:pv:date,ym:pv:clientID,ym:pv:URL,ym:pv:title";

export async function handleExportLogs(
  params: z.infer<typeof exportLogsSchema>,
): Promise<string> {
  const fields =
    params.fields ||
    (params.source === "visits" ? DEFAULT_VISIT_FIELDS : DEFAULT_HIT_FIELDS);

  // Step 1: create log request
  const createResult = await apiGet(
    `/management/v1/counter/${params.counter_id}/logrequests`,
    {
      date1: params.date1,
      date2: params.date2,
      source: params.source,
      fields: fields,
    },
  );

  // Step 2: evaluate feasibility
  const evalResult = await apiGet(
    `/management/v1/counter/${params.counter_id}/logrequests/evaluate`,
    {
      date1: params.date1,
      date2: params.date2,
      source: params.source,
      fields: fields,
    },
  );

  return JSON.stringify({ log_request: createResult, evaluation: evalResult }, null, 2);
}
