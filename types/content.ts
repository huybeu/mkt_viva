export type Status = "DRAFT" | "IN_PROGRESS" | "READY_TO_PUBLISH" | "PUBLISHED" | "PAUSED";
export type FacebookFormat = "TEXT" | "PHOTO" | "ALBUM" | "LINK" | "VIDEO" | "REEL";
export interface User { id: string; name: string; email?: string | null; avatarUrl?: string | null; }
export interface PostImage { id: string; url: string; fileName: string; mimeType: string; fileSize: number; position: number; isPrimary: boolean; }
export interface ContentPost { id: string; title: string; topicType: string | null; facebookFormat?: FacebookFormat; content: string; scheduledAt: string | null; status: Status; assigneeId: string | null; assignee: User | null; externalImageUrl: string | null; publishedUrl: string | null; notes: string | null; images: PostImage[]; updatedAt: string; }
export const statusMeta: Record<Status, { label: string; className: string; dot: string }> = {
  DRAFT: { label: "Chưa làm", className: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  IN_PROGRESS: { label: "Đang làm", className: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  READY_TO_PUBLISH: { label: "Chờ đăng", className: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  PUBLISHED: { label: "Đã đăng", className: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  PAUSED: { label: "Hoãn", className: "bg-rose-50 text-rose-700", dot: "bg-rose-400" },
};
