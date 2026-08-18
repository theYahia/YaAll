import { z } from "zod";
import { apiV4 } from "../client.js";
import { formatResult } from "../format.js";

// Баланс аккаунта доступен ТОЛЬКО через Live API v4 (AccountManagement.Get), не в v5.
// Возвращает Amount, AmountAvailableForTransfer, Currency, AccountID, Login.
export const getAccountBalanceSchema = z.object({
  logins: z.array(z.string()).optional().describe("Логины аккаунтов (для агентств). По умолчанию — аккаунт токена (или YANDEX_DIRECT_LOGIN)."),
});

export async function handleGetAccountBalance(params: z.infer<typeof getAccountBalanceSchema> = {}): Promise<string> {
  const param: Record<string, unknown> = { Action: "Get" };
  const logins = params.logins
    ?? (process.env.YANDEX_DIRECT_LOGIN ? [process.env.YANDEX_DIRECT_LOGIN] : undefined);
  if (logins && logins.length > 0) {
    param.SelectionCriteria = { Logins: logins };
  }

  const data = await apiV4("AccountManagement", param);
  // money:false — в Live v4 Amount уже в валюте аккаунта, конверсия микро→рубли НЕ нужна.
  return formatResult(data, { money: false });
}
