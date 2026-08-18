import { z } from "zod";
import { apiGet } from "../client.js";
import { formatParam } from "./common.js";
import { present } from "../format.js";

export const getUserInfoSchema = z.object({
  format: formatParam,
});

export async function handleGetUserInfo(
  params: z.infer<typeof getUserInfoSchema>,
): Promise<string> {
  const data = await apiGet(`/user/`);
  return present(data, params.format);
}
