#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { listUsersSchema, handleListUsers, getUserSchema, handleGetUser, createUserSchema, handleCreateUser } from "./tools/users.js";
import { listDepartmentsSchema, handleListDepartments } from "./tools/departments.js";
import { listGroupsSchema, handleListGroups } from "./tools/groups.js";
import { listDiskResourcesSchema, handleListDiskResources, uploadDiskFileSchema, handleUploadDiskFile } from "./tools/disk.js";
import { listCalendarEventsSchema, handleListCalendarEvents, createCalendarEventSchema, handleCreateCalendarEvent } from "./tools/calendar.js";
import { sendEmailSchema, handleSendEmail } from "./tools/email.js";

const server = new McpServer({
  name: "yandex-360-mcp",
  version: "1.0.0",
});

server.tool(
  "list_users",
  "List organization users in Yandex 360.",
  listUsersSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleListUsers(params) }] }),
);

server.tool(
  "get_user",
  "Get a single user profile by ID.",
  getUserSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleGetUser(params) }] }),
);

server.tool(
  "create_user",
  "Create a new user in the Yandex 360 organization.",
  createUserSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleCreateUser(params) }] }),
);

server.tool(
  "list_departments",
  "List all departments in the organization.",
  listDepartmentsSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleListDepartments(params) }] }),
);

server.tool(
  "list_groups",
  "List all groups in the organization.",
  listGroupsSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleListGroups(params) }] }),
);

server.tool(
  "list_disk_resources",
  "List files and folders on Yandex Disk at a given path.",
  listDiskResourcesSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleListDiskResources(params) }] }),
);

server.tool(
  "upload_disk_file",
  "Upload a text file to Yandex Disk at a given path.",
  uploadDiskFileSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleUploadDiskFile(params) }] }),
);

server.tool(
  "list_calendar_events",
  "List calendar events for a user within a date range.",
  listCalendarEventsSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleListCalendarEvents(params) }] }),
);

server.tool(
  "create_calendar_event",
  "Create a calendar event with title, time, attendees, and location.",
  createCalendarEventSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleCreateCalendarEvent(params) }] }),
);

server.tool(
  "send_email",
  "Send an email from an org user to any recipient.",
  sendEmailSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleSendEmail(params) }] }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[yandex-360-mcp] Server started. 10 tools available.");
}

main().catch((error) => {
  console.error("[yandex-360-mcp] Error:", error);
  process.exit(1);
});
