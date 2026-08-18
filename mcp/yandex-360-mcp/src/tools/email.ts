import { z } from "zod";
import { y360Request } from "../client.js";

export const sendEmailSchema = z.object({
  from: z.string().describe("Sender email address (must be in org domain)"),
  to: z.string().describe("Recipient email address"),
  subject: z.string().describe("Email subject"),
  body: z.string().describe("Email body (plain text)"),
});

export async function handleSendEmail(params: z.infer<typeof sendEmailSchema>): Promise<string> {
  // Yandex 360 uses the mail sending API
  const result = await y360Request("POST", "mail/v1/send", {
    from: params.from,
    to: params.to,
    subject: params.subject,
    body: params.body,
  });
  return JSON.stringify(result, null, 2);
}
