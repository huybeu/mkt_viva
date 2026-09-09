import { randomUUID } from "crypto";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { safeFileName } from "@/lib/utils";
import { storage } from "./s3-storage.service";

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const videoTypes = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const allowed = new Set([...imageTypes, ...videoTypes]);
export const maxBytes = (mimeType: string) =>
  (mimeType.startsWith("video/")
    ? Number(process.env.MAX_VIDEO_SIZE_MB) || 200
    : Number(process.env.MAX_IMAGE_SIZE_MB) || 10) * 1024 * 1024;
export const maxImages = () => Number(process.env.MAX_IMAGES_PER_POST) || 10;

export function validateMetadata(mimeType: string, fileSize: number) {
  if (!allowed.has(mimeType)) throw new ApiError(415, "INVALID_FILE_TYPE", "Chỉ hỗ trợ JPEG, PNG, WEBP, GIF, MP4, MOV và WEBM");
  const limit = maxBytes(mimeType);
  if (fileSize > limit) throw new ApiError(413, "FILE_TOO_LARGE", `Tệp ${mimeType.startsWith("video/") ? "video" : "ảnh"} tối đa ${limit / 1024 / 1024}MB`);
}
export function storageKey(postId: string, fileName: string, mime: string) {
  const ext: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" };
  return `posts/${postId}/${safeFileName(fileName)}-${randomUUID()}.${ext[mime]}`;
}
export class ImageService {
  list(postId: string) { return db.postImage.findMany({ where: { postId }, orderBy: { position: "asc" } }); }
  async upload(postId: string, files: File[]) {
    const post = await db.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) throw new ApiError(404, "POST_NOT_FOUND", "Không tìm thấy bài đăng");
    const count = await db.postImage.count({ where: { postId } });
    if (!files.length) throw new ApiError(400, "FILES_REQUIRED", "Vui lòng chọn ít nhất một tệp media");
    if (count + files.length > maxImages()) throw new ApiError(400, "TOO_MANY_IMAGES", `Mỗi bài tối đa ${maxImages()} tệp media`);
    const created = [];
    for (let index = 0; index < files.length; index++) {
      const file = files[index]; validateMetadata(file.type, file.size);
      const buffer = Buffer.from(await file.arrayBuffer()); const detected = await fileTypeFromBuffer(buffer);
      if (!detected || !allowed.has(detected.mime) || detected.mime !== file.type) throw new ApiError(415, "INVALID_FILE_TYPE", `Tệp ${file.name} không phải ảnh hoặc video hợp lệ`);
      const key = storageKey(postId, file.name, detected.mime); let uploaded = false;
      try {
        const result = await storage.upload({ key, body: buffer, contentType: detected.mime }); uploaded = true;
        const dimensions = imageTypes.has(detected.mime) ? await sharp(buffer, { animated: true }).metadata() : { width: undefined, height: undefined };
        const image = await db.postImage.create({ data: { postId, storageKey: key, fileName: file.name.slice(0, 255), mimeType: detected.mime, fileSize: file.size, width: dimensions.width, height: dimensions.height, url: result.url, position: count + index, isPrimary: count === 0 && index === 0 } });
        console.info("Image uploaded", { postId, imageId: image.id }); created.push(image);
      } catch (error) { if (uploaded) await storage.delete(key).catch(() => undefined); console.error("Image upload failed", { postId, fileName: file.name, error }); throw error; }
    }
    return created;
  }
  async remove(id: string) {
    const image = await db.postImage.findUnique({ where: { id } }); if (!image) throw new ApiError(404, "IMAGE_NOT_FOUND", "Không tìm thấy ảnh");
    try { await storage.delete(image.storageKey); } catch (error) { console.error("Storage delete failed", { imageId: id, error }); throw new ApiError(502, "STORAGE_DELETE_FAILED", "Không thể xóa ảnh khỏi kho lưu trữ"); }
    await db.$transaction(async tx => { await tx.postImage.delete({ where: { id } }); if (image.isPrimary) { const next = await tx.postImage.findFirst({ where: { postId: image.postId }, orderBy: { position: "asc" } }); if (next) await tx.postImage.update({ where: { id: next.id }, data: { isPrimary: true } }); } });
  }
  async patch(id: string, data: { isPrimary?: boolean; position?: number }) {
    const image = await db.postImage.findUnique({ where: { id } }); if (!image) throw new ApiError(404, "IMAGE_NOT_FOUND", "Không tìm thấy ảnh");
    return db.$transaction(async tx => { if (data.isPrimary) await tx.postImage.updateMany({ where: { postId: image.postId }, data: { isPrimary: false } }); return tx.postImage.update({ where: { id }, data }); });
  }
  async reorder(postId: string, imageIds: string[]) {
    const images = await this.list(postId); if (images.length !== imageIds.length || !images.every(i => imageIds.includes(i.id))) throw new ApiError(400, "INVALID_IMAGE_ORDER", "Danh sách ảnh không khớp với bài đăng");
    await db.$transaction(imageIds.map((id, position) => db.postImage.update({ where: { id }, data: { position } })));
    return this.list(postId);
  }
}
export const images = new ImageService();
