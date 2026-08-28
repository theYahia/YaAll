import { z } from "zod";
import { apiPost } from "../client.js";
import { formatResult } from "../format.js";
import { buildPage, pageFields } from "../pagination.js";

const imageItem = z.object({
  image_data: z.string().min(1).describe("Бинарные данные изображения в base64"),
  name: z.string().min(1).max(255),
  type: z.enum(["REGULAR", "WIDE", "FIXED_IMAGE", "AUTO"]).optional(),
});

export const manageAdImagesSchema = z.object({
  action: z.enum(["add", "get", "delete"]),
  images: z.array(imageItem).min(1).max(100).optional(),
  ad_image_hashes: z.array(z.string().min(1)).min(1).max(10000).optional(),
  associated: z.enum(["YES", "NO"]).optional(),
  ...pageFields,
});

export async function handleManageAdImages(
  params: z.infer<typeof manageAdImagesSchema>,
): Promise<string> {
  if (params.action === "add") {
    if (!params.images?.length) throw new Error("Для action=add передайте images.");
    return formatResult(await apiPost("adimages", "add", {
      AdImages: params.images.map(image => {
        const item: Record<string, unknown> = {
          ImageData: image.image_data,
          Name: image.name,
        };
        if (image.type) item.Type = image.type;
        return item;
      }),
    }), { money: false });
  }

  if (params.action === "delete") {
    if (!params.ad_image_hashes?.length) {
      throw new Error("Для action=delete передайте ad_image_hashes.");
    }
    return formatResult(await apiPost("adimages", "delete", {
      SelectionCriteria: { AdImageHashes: params.ad_image_hashes },
    }), { money: false });
  }

  const selection: Record<string, unknown> = {};
  if (params.ad_image_hashes?.length) selection.AdImageHashes = params.ad_image_hashes;
  if (params.associated) selection.Associated = params.associated;
  const request: Record<string, unknown> = {
    FieldNames: ["AdImageHash", "OriginalUrl", "PreviewUrl", "Name", "Type", "Subtype", "Associated"],
  };
  if (Object.keys(selection).length) request.SelectionCriteria = selection;
  const page = buildPage(params);
  if (page) request.Page = page;
  return formatResult(await apiPost("adimages", "get", request), { money: false });
}
