import { PostStatus } from "@prisma/client";
import { z } from "zod";

const optionalUrl = z.union([z.url(), z.literal(""), z.null()]).optional();
export const postCreateSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập chủ đề").max(200),
  topicType: z.string().trim().max(100).nullable().optional(),
  content: z.string().max(100000).default(""),
  facebookFormat: z.enum(["TEXT", "PHOTO", "ALBUM", "LINK", "VIDEO", "REEL"]).default("TEXT"),
  scheduledAt: z.iso.datetime().nullable().optional(), assigneeId: z.string().nullable().optional(),
  status: z.enum(PostStatus).default(PostStatus.DRAFT), externalImageUrl: optionalUrl, publishedUrl: optionalUrl,
  notes: z.string().max(10000).nullable().optional()
});
export const postUpdateSchema = postCreateSchema.partial().extend({ lastKnownUpdatedAt: z.iso.datetime().optional() });
export const userCreateSchema = z.object({ name: z.string().trim().min(1).max(100), email: z.union([z.email(), z.literal(""), z.null()]).optional(), avatarUrl: optionalUrl });
export const userUpdateSchema = userCreateSchema.partial();
export const imagePatchSchema = z.object({ isPrimary: z.boolean().optional(), position: z.number().int().min(0).optional() }).refine(v => Object.keys(v).length > 0);
export const orderSchema = z.object({ imageIds: z.array(z.string()).max(100) });
export const presignSchema = z.object({ postId: z.string(), fileName: z.string().min(1), mimeType: z.string(), fileSize: z.number().int().positive() });
export const completeSchema = presignSchema.extend({ storageKey: z.string(), width: z.number().int().positive().nullable().optional(), height: z.number().int().positive().nullable().optional() });
export const facebookPageSchema = z.object({ pageId: z.string().trim().min(1).max(100), name: z.string().trim().min(1).max(150), accessToken: z.string().trim().min(20) });
export const facebookPublishSchema = z.object({ postId: z.string(), facebookPageId: z.string().optional(), facebookPageIds: z.array(z.string()).min(1).optional() }).refine(v => v.facebookPageId || v.facebookPageIds?.length, "Vui lòng chọn Facebook Page");
