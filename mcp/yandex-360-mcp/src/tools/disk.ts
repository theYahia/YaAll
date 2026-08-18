import { z } from "zod";
import { y360Request } from "../client.js";

export const listDiskResourcesSchema = z.object({
  path: z.string().default("/").describe("Disk path to list (e.g. / or /Documents)"),
  limit: z.number().optional().describe("Max items to return"),
  offset: z.number().optional().describe("Pagination offset"),
});

export async function handleListDiskResources(params: z.infer<typeof listDiskResourcesSchema>): Promise<string> {
  const qp: Record<string, string> = { path: params.path };
  if (params.limit) qp.limit = String(params.limit);
  if (params.offset) qp.offset = String(params.offset);

  const result = await y360Request("GET", "disk/v1/resources", undefined, qp);
  return JSON.stringify(result, null, 2);
}

export const uploadDiskFileSchema = z.object({
  path: z.string().describe("Destination path on disk (e.g. /Documents/report.txt)"),
  content: z.string().describe("File content as text (will be uploaded via PUT)"),
  overwrite: z.boolean().default(false).describe("Overwrite if file exists"),
});

export async function handleUploadDiskFile(params: z.infer<typeof uploadDiskFileSchema>): Promise<string> {
  const qp: Record<string, string> = {
    path: params.path,
    overwrite: String(params.overwrite),
  };

  // Step 1: Get upload URL
  const uploadInfo = await y360Request("GET", "disk/v1/resources/upload", undefined, qp) as { href?: string };
  if (!uploadInfo.href) throw new Error("Failed to get upload URL from Yandex Disk");

  // Step 2: Upload content
  const response = await fetch(uploadInfo.href, {
    method: "PUT",
    headers: { "Content-Type": "text/plain" },
    body: params.content,
  });

  if (!response.ok) {
    throw new Error(`Disk upload failed: HTTP ${response.status}`);
  }

  return JSON.stringify({ success: true, path: params.path }, null, 2);
}
