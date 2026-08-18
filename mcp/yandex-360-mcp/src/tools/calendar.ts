import { z } from "zod";
import { y360Request } from "../client.js";

export const listCalendarEventsSchema = z.object({
  user_id: z.string().describe("User ID or login"),
  from: z.string().describe("Start of range in ISO 8601 format (e.g. 2026-04-01T00:00:00Z)"),
  to: z.string().describe("End of range in ISO 8601 format"),
});

export async function handleListCalendarEvents(params: z.infer<typeof listCalendarEventsSchema>): Promise<string> {
  const result = await y360Request("GET", `calendar/v1/users/${params.user_id}/events`, undefined, {
    from: params.from,
    to: params.to,
  });
  return JSON.stringify(result, null, 2);
}

export const createCalendarEventSchema = z.object({
  user_id: z.string().describe("User ID or login of the organizer"),
  summary: z.string().describe("Event title"),
  start: z.string().describe("Start datetime in ISO 8601 format"),
  end: z.string().describe("End datetime in ISO 8601 format"),
  description: z.string().optional().describe("Event description"),
  attendees: z.array(z.string()).optional().describe("List of attendee email addresses"),
  location: z.string().optional().describe("Event location"),
});

export async function handleCreateCalendarEvent(params: z.infer<typeof createCalendarEventSchema>): Promise<string> {
  const body: Record<string, unknown> = {
    summary: params.summary,
    start: { dateTime: params.start },
    end: { dateTime: params.end },
  };
  if (params.description) body.description = params.description;
  if (params.attendees) body.attendees = params.attendees.map(email => ({ email }));
  if (params.location) body.location = params.location;

  const result = await y360Request("POST", `calendar/v1/users/${params.user_id}/events`, body);
  return JSON.stringify(result, null, 2);
}
