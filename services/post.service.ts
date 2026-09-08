import { Prisma, PostStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { storage } from "./s3-storage.service";

export class PostService {
  async list(query: URLSearchParams) {
    const page = Math.max(1, Number(query.get("page")) || 1), limit = Math.min(100, Math.max(1, Number(query.get("limit")) || 50));
    const search = query.get("search")?.trim(), assigneeId = query.get("assigneeId"), status = query.get("status") as PostStatus | null;
    const where: Prisma.PostWhereInput = {
      ...(assigneeId ? { assigneeId } : {}), ...(status && Object.values(PostStatus).includes(status) ? { status } : {}),
      ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" } }, { content: { contains: search, mode: "insensitive" } }] } : {}),
      ...(query.get("fromDate") || query.get("toDate") ? { scheduledAt: { ...(query.get("fromDate") ? { gte: new Date(query.get("fromDate")!) } : {}), ...(query.get("toDate") ? { lte: new Date(query.get("toDate")! + "T23:59:59.999Z") } : {}) } } : {})
    };
    const sort = query.get("sort") === "oldest" ? "asc" : "desc";
    const [data, total] = await db.$transaction([
      db.post.findMany({ where, include: { assignee: true, images: { orderBy: { position: "asc" } } }, orderBy: { scheduledAt: sort }, skip: (page - 1) * limit, take: limit }),
      db.post.count({ where })
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
  async get(id: string) { const post = await db.post.findUnique({ where: { id }, include: { assignee: true, images: { orderBy: { position: "asc" } } } }); if (!post) throw new ApiError(404, "POST_NOT_FOUND", "Không tìm thấy bài đăng"); return post; }
  create(data: Prisma.PostUncheckedCreateInput) { return db.post.create({ data, include: { assignee: true, images: true } }); }
  async update(id: string, data: Prisma.PostUncheckedUpdateInput & { lastKnownUpdatedAt?: string }) {
    const current = await this.get(id); const { lastKnownUpdatedAt, ...update } = data;
    if (lastKnownUpdatedAt && current.updatedAt > new Date(lastKnownUpdatedAt)) throw new ApiError(409, "POST_CONFLICT", "Bài đăng vừa được cập nhật ở nơi khác");
    return db.post.update({ where: { id }, data: update, include: { assignee: true, images: { orderBy: { position: "asc" } } } });
  }
  async delete(id: string) {
    const post = await this.get(id);
    const failures: string[] = [];
    for (const image of post.images) { try { await storage.delete(image.storageKey); } catch (e) { console.error("Storage delete failed", { imageId: image.id, error: e }); failures.push(image.id); } }
    if (failures.length) throw new ApiError(502, "STORAGE_DELETE_FAILED", "Không thể xóa một số ảnh khỏi kho lưu trữ; bài đăng chưa bị xóa");
    await db.post.delete({ where: { id } });
  }
}
export const posts = new PostService();
