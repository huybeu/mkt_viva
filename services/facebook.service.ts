import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { decrypt, encrypt } from "@/lib/crypto";

type GraphError = { error?: { message?: string; code?: number }; id?: string; name?: string; permalink_url?: string };
const version = () => process.env.FACEBOOK_GRAPH_VERSION || "v26.0";

async function graph(path: string, token: string, init?: RequestInit): Promise<GraphError> {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`https://graph.facebook.com/${version()}/${path}${separator}access_token=${encodeURIComponent(token)}`, { ...init, cache: "no-store" });
  const data = await response.json() as GraphError;
  if (!response.ok || data.error) throw new ApiError(502, data.error?.code === 190 ? "FACEBOOK_TOKEN_INVALID" : "FACEBOOK_API_ERROR", data.error?.message || "Facebook không thể xử lý yêu cầu");
  return data;
}

export class FacebookService {
  list(actor: { id: string; role: string }) { return db.facebookPage.findMany({ where: actor.role === "ADMIN" ? {} : { ownerId: actor.id }, select: { id: true, pageId: true, name: true, isActive: true, ownerId: true, owner: { select: { id: true, name: true, username: true } }, createdAt: true, updatedAt: true }, orderBy: { name: "asc" } }); }
  async connect(input: { pageId: string; name: string; accessToken: string }, ownerId: string) {
    const verified = await graph(`${encodeURIComponent(input.pageId)}?fields=id,name`, input.accessToken);
    if (!verified.id) throw new ApiError(400, "FACEBOOK_PAGE_INVALID", "Không xác minh được Facebook Page");
    const page = await db.facebookPage.upsert({ where: { ownerId_pageId: { ownerId, pageId: verified.id } }, create: { ownerId, pageId: verified.id, name: verified.name || input.name, accessTokenEncrypted: encrypt(input.accessToken) }, update: { name: verified.name || input.name, accessTokenEncrypted: encrypt(input.accessToken), isActive: true } });
    return { id: page.id, pageId: page.pageId, name: page.name, isActive: page.isActive, createdAt: page.createdAt, updatedAt: page.updatedAt };
  }
  async connectFromUserToken(userToken: string, ownerId: string) {
    const response = await fetch(`https://graph.facebook.com/${version()}/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(userToken)}`, { cache: "no-store" });
    const payload = await response.json() as { data?: { id: string; name: string; access_token: string }[]; error?: { message?: string; code?: number } };
    if (!response.ok || payload.error) throw new ApiError(502, payload.error?.code === 190 ? "FACEBOOK_TOKEN_INVALID" : "FACEBOOK_API_ERROR", payload.error?.message || "Không thể lấy danh sách Facebook Page");
    const connected = [];
    for (const item of payload.data ?? []) connected.push(await this.connect({ pageId: item.id, name: item.name, accessToken: item.access_token }, ownerId));
    return connected;
  }
  async remove(id: string, actor: { id: string; role: string }) { const page = await db.facebookPage.findFirst({ where: { id, ...(actor.role === "ADMIN" ? {} : { ownerId: actor.id }) } }); if (!page) throw new ApiError(404, "FACEBOOK_PAGE_NOT_FOUND", "Không tìm thấy Facebook Page"); await db.facebookPage.delete({ where: { id } }); }
  async publish(postId: string, facebookPageId: string, actor: { id: string; role: string }) {
    const [post, page] = await Promise.all([db.post.findUnique({ where: { id: postId }, include: { images: { orderBy: { position: "asc" } } } }), db.facebookPage.findUnique({ where: { id: facebookPageId } })]);
    if (!post) throw new ApiError(404, "POST_NOT_FOUND", "Không tìm thấy bài đăng");
    if (!page || !page.isActive || (actor.role !== "ADMIN" && page.ownerId !== actor.id)) throw new ApiError(404, "FACEBOOK_PAGE_NOT_FOUND", "Facebook Page chưa được liên kết với tài khoản này");
    if (!post.content.trim() && !post.images.length) throw new ApiError(400, "EMPTY_FACEBOOK_POST", "Bài đăng cần có nội dung hoặc hình ảnh");
    const token = decrypt(page.accessTokenEncrypted); let result: GraphError;
    const format = post.facebookFormat || (post.images.length > 1 ? "ALBUM" : post.images.length ? "PHOTO" : "TEXT");
    if ((format === "VIDEO" || format === "REEL") && !post.images.some((image) => image.mimeType.startsWith("video/"))) {
      throw new ApiError(400, "VIDEO_REQUIRED", "Dạng Video/Reel cần tải lên một tệp video");
    }
    if (format === "LINK" && post.externalImageUrl) {
      result = await graph(`${page.pageId}/feed`, token, { method: "POST", body: new URLSearchParams({ message: post.content, link: post.externalImageUrl }) });
      if (!result.id) throw new ApiError(502, "FACEBOOK_PUBLISH_FAILED", "Facebook không trả về mã bài đăng");
      const details = await graph(`${result.id}?fields=permalink_url`, token).catch(() => null);
      const publishedUrl = details?.permalink_url || `https://www.facebook.com/${result.id.replace("_", "/posts/")}`;
      const updated = await db.post.update({ where: { id: post.id }, data: { publishedUrl, status: "PUBLISHED" }, include: { assignee: true, images: { orderBy: { position: "asc" } } } });
      return { post: updated, facebookPostId: result.id, publishedUrl };
    }
    // Send image bytes directly to Graph API. Storage URLs are often localhost
    // in development and are not reachable from Facebook's servers.
    const uploadImage = async (image: (typeof post.images)[number], published = true) => {
      let response: Response;
      try { response = await fetch(image.url, { cache: "no-store" }); }
      catch { throw new ApiError(502, "IMAGE_FETCH_FAILED", "Không thể đọc hình ảnh để đăng Facebook"); }
      if (!response.ok) throw new ApiError(502, "IMAGE_FETCH_FAILED", "Không thể đọc hình ảnh để đăng Facebook");
      const form = new FormData();
      form.append("source", await response.blob(), image.fileName || "image");
      if (post.content) form.append("message", post.content);
      if (!published) form.append("published", "false");
      return graph(`${page.pageId}/photos`, token, { method: "POST", body: form });
    };
    if (post.images.length === 1) {
      result = await uploadImage(post.images[0]);
    } else if (post.images.length > 1) {
      const photoIds: string[] = [];
      for (const image of post.images) { const uploaded = await uploadImage(image, false); if (uploaded.id) photoIds.push(uploaded.id); }
      const body = new URLSearchParams({ message: post.content }); photoIds.forEach((id, index) => body.set(`attached_media[${index}]`, JSON.stringify({ media_fbid: id })));
      result = await graph(`${page.pageId}/feed`, token, { method: "POST", body });
    } else result = await graph(`${page.pageId}/feed`, token, { method: "POST", body: new URLSearchParams({ message: post.content }) });
    if (!result.id) throw new ApiError(502, "FACEBOOK_PUBLISH_FAILED", "Facebook không trả về mã bài đăng");
    const details = await graph(`${result.id}?fields=permalink_url`, token).catch(() => null);
    const publishedUrl = details?.permalink_url || `https://www.facebook.com/${result.id.replace("_", "/posts/")}`;
    const updated = await db.post.update({ where: { id: post.id }, data: { publishedUrl, status: "PUBLISHED" }, include: { assignee: true, images: { orderBy: { position: "asc" } } } });
    console.info("Facebook post published", { postId, pageId: page.pageId, facebookPostId: result.id });
    return { post: updated, facebookPostId: result.id, publishedUrl };
  }
}
export const facebook = new FacebookService();
