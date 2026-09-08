"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { format } from "date-fns";
import {
  Check,
  Clipboard,
  Download,
  Eye,
  GripVertical,
  ImagePlus,
  Link2,
  Loader2,
  Send,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { ContentPost, PostImage, Status, User } from "@/types/content";
import { StatusSelect } from "./status-select";

type SaveState = "idle" | "saving" | "saved" | "error";
export function PostDetail({
  post,
  users,
  facebookPages,
  open,
  offline,
  onOpenChange,
  onUpdate,
  onDelete,
}: {
  post: ContentPost | null;
  users: User[];
  facebookPages: { id: string; pageId: string; name: string; isActive: boolean }[];
  open: boolean;
  offline: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdate: (p: ContentPost) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState<ContentPost | null>(post),
    [save, setSave] = useState<SaveState>("idle"),
    [uploading, setUploading] = useState(false),
    [uploadError, setUploadError] = useState(""),
    [facebookPageIds, setFacebookPageIds] = useState<string[]>([]),
    [publishing, setPublishing] = useState(false),
    [publishError, setPublishError] = useState(""),
    [preview, setPreview] = useState<PostImage | null>(null);
  const fileRef = useRef<HTMLInputElement>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setDraft(post);
    setSave("idle");
  }, [post]);
  const persist = useCallback(
    async (current: ContentPost, changes: Partial<ContentPost>) => {
      setSave("saving");
      if (offline || current.id.startsWith("demo-") || current.id.length < 20) {
        await new Promise((r) => setTimeout(r, 350));
        const next = {
          ...current,
          ...changes,
          updatedAt: new Date().toISOString(),
        };
        setDraft(next);
        onUpdate(next);
        setSave("saved");
        return;
      }
      try {
        const saved = await api<ContentPost>(`/api/posts/${current.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            ...changes,
            lastKnownUpdatedAt: current.updatedAt,
          }),
        });
        setDraft(saved);
        onUpdate(saved);
        setSave("saved");
      } catch {
        setSave("error");
      }
    },
    [offline, onUpdate],
  );
  function change<K extends keyof ContentPost>(key: K, value: ContentPost[K]) {
    if (!draft) return;
    const next = { ...draft, [key]: value };
    if (key === "assigneeId")
      next.assignee = users.find((u) => u.id === value) ?? null;
    setDraft(next);
    onUpdate(next);
    setSave("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(next, { [key]: value }), 700);
  }
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  async function upload(files: File[]) {
    if (!draft || !files.length || offline) return;
    setUploading(true);
    setUploadError("");
    const form = new FormData();
    files.forEach((f) => form.append("files[]", f));
    try {
      const added = await api<PostImage[]>(`/api/posts/${draft.id}/images`, {
        method: "POST",
        body: form,
      });
      const next = { ...draft, images: [...draft.images, ...added] };
      setDraft(next);
      onUpdate(next);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload thất bại");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  useEffect(() => {
    if (!open) return;
    const paste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (files.length) {
        e.preventDefault();
        void upload(files);
      }
    };
    window.addEventListener("paste", paste);
    return () => window.removeEventListener("paste", paste);
  });
  async function imageAction(image: PostImage, action: "delete" | "primary") {
    if (!draft) return;
    try {
      if (!offline)
        await api(`/api/images/${image.id}`, {
          method: action === "delete" ? "DELETE" : "PATCH",
          ...(action === "primary"
            ? { body: JSON.stringify({ isPrimary: true }) }
            : {}),
        });
      let list =
        action === "delete"
          ? draft.images.filter((i) => i.id !== image.id)
          : draft.images.map((i) => ({ ...i, isPrimary: i.id === image.id }));
      if (action === "delete" && image.isPrimary && list[0])
        list = list.map((i, n) => ({ ...i, isPrimary: n === 0 }));
      const next = { ...draft, images: list };
      setDraft(next);
      onUpdate(next);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Không thể cập nhật ảnh");
    }
  }
  async function removePost() {
    if (!draft || !confirm("Xóa bài đăng này và toàn bộ ảnh?")) return;
    try {
      if (!offline && !draft.id.startsWith("demo-"))
        await api(`/api/posts/${draft.id}`, { method: "DELETE" });
      onDelete(draft.id);
    } catch {
      setSave("error");
    }
  }
  async function publishFacebook() {
    if (!draft || !facebookPageIds.length) return;
    if (!confirm("Đăng nội dung và hình ảnh hiện tại lên Facebook ngay?")) return;
    setPublishing(true); setPublishError("");
    try {
      const result = await api<{ results: { success: boolean; error?: string; post?: ContentPost }[] }>("/api/facebook/publish", { method: "POST", body: JSON.stringify({ postId: draft.id, facebookPageIds }) });
      const failed = result.results.filter((r) => !r.success);
      const published = result.results.find((r) => r.success && r.post)?.post;
      if (published) { setDraft(published); onUpdate(published); setSave("saved"); }
      if (failed.length) setPublishError(`Đăng lỗi ${failed.length}/${result.results.length} Page: ${failed.map((r) => r.error).join("; ")}`);
    } catch (e) { setPublishError(e instanceof Error ? e.message : "Không thể đăng lên Facebook"); }
    finally { setPublishing(false); }
  }
  if (!draft) return null;
  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[1px]" />
          <Dialog.Content
            aria-describedby={undefined}
            className="scrollbar fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white shadow-2xl sm:max-w-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/95 px-5 py-3 backdrop-blur">
              <div className="flex items-center gap-2 text-xs text-muted">
                {save === "saving" && (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Đang lưu...
                  </>
                )}
                {save === "saved" && (
                  <>
                    <Check className="size-3.5 text-brand" /> Đã lưu
                  </>
                )}
                {save === "error" && (
                  <span className="text-rose-600">Lưu thất bại</span>
                )}
                {save === "idle" && (
                  <>Cập nhật {format(new Date(draft.updatedAt), "HH:mm")}</>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={removePost}
                  className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="size-4" />
                </button>
                <Dialog.Close className="rounded-lg p-2 hover:bg-canvas">
                  <X className="size-5" />
                </Dialog.Close>
              </div>
            </div>
            <div className="p-5 sm:p-7">
              <Dialog.Title asChild>
                <input
                  value={draft.title}
                  onChange={(e) => change("title", e.target.value)}
                  className="mb-6 w-full border-0 bg-transparent text-2xl font-bold tracking-tight outline-none placeholder:text-slate-300 sm:text-3xl"
                  placeholder="Chủ đề bài đăng"
                />
              </Dialog.Title>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Ngày đăng">
                  <input
                    type="date"
                    className="input"
                    value={draft.scheduledAt?.slice(0, 10) ?? ""}
                    onChange={(e) =>
                      change(
                        "scheduledAt",
                        e.target.value
                          ? new Date(e.target.value + "T09:00:00").toISOString()
                          : null,
                      )
                    }
                  />
                </Field>
                <Field label="Người phụ trách">
                  <select
                    className="input"
                    value={draft.assigneeId ?? ""}
                    onChange={(e) =>
                      change("assigneeId", e.target.value || null)
                    }
                  >
                    <option value="">Chưa giao</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="my-6 border-t border-line" />
              <div className="mb-2 flex items-end justify-between">
                <label className="label mb-0">Nội dung bài đăng</label>
                <span className="text-[11px] text-muted">
                  {draft.content.length.toLocaleString("vi-VN")} ký tự
                </span>
              </div>
              <textarea
                className="input min-h-56 resize-y leading-6"
                value={draft.content}
                onChange={(e) => change("content", e.target.value)}
                placeholder="Viết nội dung bài đăng..."
              />
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(draft.content);
                }}
                className="btn-ghost mt-2 px-3 py-2 text-xs"
              >
                <Clipboard className="size-3.5" /> Copy nội dung
              </button>
              <div className="my-7 border-t border-line" />
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Hình ảnh</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Tối đa 10 ảnh · 10MB/ảnh
                  </p>
                </div>
                <span className="text-xs text-muted">
                  {draft.images.length}/10
                </span>
              </div>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void upload(Array.from(e.dataTransfer.files));
                }}
                onClick={() => !offline && fileRef.current?.click()}
                className={cn(
                  "group grid min-h-28 cursor-pointer place-items-center rounded-2xl border border-dashed border-slate-300 bg-canvas/60 p-4 text-center transition hover:border-brand hover:bg-brand-soft/40",
                  (uploading || offline) && "pointer-events-none opacity-60",
                )}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  hidden
                  onChange={(e) =>
                    void upload(Array.from(e.target.files ?? []))
                  }
                />
                {uploading ? (
                  <div>
                    <Loader2 className="mx-auto mb-2 size-6 animate-spin text-brand" />
                    <p className="text-xs font-semibold">Đang tải ảnh lên...</p>
                  </div>
                ) : (
                  <div>
                    <UploadCloud className="mx-auto mb-2 size-6 text-muted group-hover:text-brand" />
                    <p className="text-xs font-semibold">
                      Kéo thả, chọn hoặc dán ảnh
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      JPEG, PNG, WEBP, GIF
                    </p>
                    {offline && (
                      <p className="mt-1 text-[11px] text-amber-700">
                        Cần kết nối storage để upload
                      </p>
                    )}
                  </div>
                )}
              </div>
              {uploadError && (
                <p className="mt-2 text-xs text-rose-600">{uploadError}</p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {draft.images.map((image) => (
                  <div
                    key={image.id}
                    className="group overflow-hidden rounded-xl border border-line bg-white"
                  >
                    <div className="relative aspect-square bg-canvas">
                      <img
                        src={image.url}
                        alt={image.fileName}
                        className="size-full object-cover"
                      />
                      {image.isPrimary && (
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[9px] font-bold text-brand shadow">
                          <Star className="size-2.5 fill-current" /> Ảnh chính
                        </span>
                      )}
                      <div className="absolute inset-x-2 bottom-2 flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => setPreview(image)}
                          className="rounded-lg bg-white p-1.5 shadow"
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <a
                          href={image.url}
                          download
                          target="_blank"
                          className="rounded-lg bg-white p-1.5 shadow"
                        >
                          <Download className="size-3.5" />
                        </a>
                        <button
                          onClick={() => void imageAction(image, "delete")}
                          className="rounded-lg bg-white p-1.5 text-rose-600 shadow"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-2">
                      <GripVertical className="size-3 shrink-0 text-slate-300" />
                      <p className="min-w-0 flex-1 truncate text-[10px] text-muted">
                        {image.fileName}
                      </p>
                      {!image.isPrimary && (
                        <button
                          title="Chọn làm ảnh chính"
                          onClick={() => void imageAction(image, "primary")}
                        >
                          <Star className="size-3 text-muted" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <Field label="Link ảnh / nguồn tham khảo">
                  <div className="relative">
                    <ImagePlus className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                    <input
                      className="input pl-9"
                      type="url"
                      value={draft.externalImageUrl ?? ""}
                      onChange={(e) =>
                        change("externalImageUrl", e.target.value)
                      }
                      placeholder="https://..."
                    />
                  </div>
                </Field>
              </div>
              <div className="my-7 border-t border-line" />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Trạng thái">
                  <StatusSelect
                    value={draft.status}
                    onChange={(value: Status) => change("status", value)}
                  />
                </Field>
                <Field label="Link bài đã đăng">
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                    <input
                      className="input pl-9"
                      type="url"
                      value={draft.publishedUrl ?? ""}
                      onChange={(e) => change("publishedUrl", e.target.value)}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  {draft.status === "PUBLISHED" && !draft.publishedUrl && (
                    <p className="mt-1.5 text-[11px] text-amber-700">
                      Bạn chưa thêm link bài đã đăng.
                    </p>
                  )}
                </Field>
              </div>
              <div className="mt-5">
                <Field label="Ghi chú">
                  <textarea
                    className="input min-h-24 resize-y"
                    value={draft.notes ?? ""}
                    onChange={(e) => change("notes", e.target.value)}
                    placeholder="Thông tin cần nhớ, góp ý cho team..."
                  />
                </Field>
              </div>
              <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="mb-3"><p className="text-sm font-bold text-blue-950">Đăng lên Facebook</p><p className="mt-1 text-[11px] text-blue-700">Bài sẽ được đăng ngay với nội dung và toàn bộ ảnh hiện tại.</p></div>
                {facebookPages.length ? <div className="space-y-3"><div className="grid gap-2 sm:grid-cols-2">{facebookPages.map(page => <label key={page.id} className="flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm"><input type="checkbox" checked={facebookPageIds.includes(page.id)} onChange={e => setFacebookPageIds(v => e.target.checked ? [...v, page.id] : v.filter(id => id !== page.id))} />{page.name}</label>)}</div><button onClick={() => void publishFacebook()} disabled={!facebookPageIds.length || publishing || offline} className="btn bg-[#1877F2] text-white hover:bg-[#1468d4]">{publishing ? <Loader2 className="size-4 animate-spin"/> : <Send className="size-4"/>} Đăng lên {facebookPageIds.length || ""} Page</button></div> : <p className="text-xs text-blue-800">Chưa có Page nào. Hãy liên kết tại tab Facebook Pages.</p>}
                {publishError && <p className="mt-2 text-xs text-rose-600">{publishError}</p>}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root
        open={Boolean(preview)}
        onOpenChange={(v) => !v && setPreview(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/75" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-4 z-[70] grid place-items-center outline-none"
          >
            <Dialog.Title className="sr-only">Xem ảnh</Dialog.Title>
            {preview && (
              <img
                src={preview.url}
                alt={preview.fileName}
                className="max-h-full max-w-full rounded-xl object-contain"
              />
            )}
            <Dialog.Close className="fixed right-6 top-6 rounded-full bg-white/90 p-2">
              <X className="size-5" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
