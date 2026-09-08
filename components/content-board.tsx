"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  FileText,
  Image as ImageIcon,
  LayoutList,
  Lightbulb,
  Link2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { ContentPost, Status, statusMeta, User } from "@/types/content";
import { StatusSelect } from "./status-select";
import { PostDetail } from "./post-detail";

export interface ConnectedFacebookPage {
  id: string;
  pageId: string;
  name: string;
  isActive: boolean;
}

const fallbackUsers: User[] = [
  { id: "person-a", name: "Người A" },
  { id: "person-b", name: "Người B" },
];
const today = new Date();
const iso = (offset: number) =>
  new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + offset,
    9,
  ).toISOString();
const fallbackPosts: ContentPost[] = [
  {
    id: "demo-1",
    title: "5 mẹo chuẩn bị eSIM trước chuyến đi",
    topicType: "Tour lẻ",
    content:
      "Một chuyến đi nhẹ nhàng bắt đầu từ việc chuẩn bị kết nối trước khi cất cánh.\n\nLưu ngay 5 mẹo nhỏ này nhé!",
    scheduledAt: iso(1),
    status: "READY_TO_PUBLISH",
    assigneeId: "person-a",
    assignee: fallbackUsers[0],
    externalImageUrl: null,
    publishedUrl: null,
    notes: "Ưu tiên ảnh lifestyle",
    images: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    title: "Checklist du lịch mùa thu",
    topicType: "Tour MICE",
    content: "Lưu ngay checklist nhỏ để hành lý gọn mà vẫn đủ.",
    scheduledAt: iso(3),
    status: "IN_PROGRESS",
    assigneeId: "person-b",
    assignee: fallbackUsers[1],
    externalImageUrl: null,
    publishedUrl: null,
    notes: null,
    images: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-3",
    title: "Khách hàng nói gì về dịch vụ?",
    topicType: "Thương hiệu",
    content: "Cảm ơn những chia sẻ đáng yêu từ khách hàng.",
    scheduledAt: iso(6),
    status: "DRAFT",
    assigneeId: "person-a",
    assignee: fallbackUsers[0],
    externalImageUrl: null,
    publishedUrl: null,
    notes: null,
    images: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-4",
    title: "Ưu đãi data cuối tuần",
    topicType: "Khuyến mãi",
    content: "Đừng bỏ lỡ ưu đãi data dành riêng cho cuối tuần này.",
    scheduledAt: iso(-2),
    status: "PUBLISHED",
    assigneeId: "person-b",
    assignee: fallbackUsers[1],
    externalImageUrl: null,
    publishedUrl: "https://facebook.com",
    notes: null,
    images: [],
    updatedAt: new Date().toISOString(),
  },
];

export function ContentBoard() {
  const [posts, setPosts] = useState<ContentPost[]>([]),
    [users, setUsers] = useState<User[]>([]),
    [facebookPages, setFacebookPages] = useState<ConnectedFacebookPage[]>([]),
    [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false),
    [view, setView] = useState<"table" | "calendar">("table"),
    [selected, setSelected] = useState<ContentPost | null>(null),
    [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "topics" | "overview" | "facebook"
  >("topics");
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [assignee, setAssignee] = useState(""),
    [date, setDate] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [postResult, userResult, pageResult] = await Promise.all([
        api<{ data: ContentPost[] }>("/api/posts?limit=100"),
        api<User[]>("/api/users"),
        api<ConnectedFacebookPage[]>("/api/facebook/pages"),
      ]);
      setPosts(postResult.data);
      setUsers(userResult);
      setFacebookPages(pageResult);
      setOffline(false);
    } catch {
      setPosts(fallbackPosts);
      setUsers(fallbackUsers);
      setFacebookPages([]);
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "facebook")
      setActiveTab("facebook");
  }, []);
  const filtered = useMemo(
    () =>
      posts.filter(
        (p) =>
          (!search ||
            `${p.title} ${p.content}`
              .toLowerCase()
              .includes(search.toLowerCase())) &&
          (!status || p.status === status) &&
          (!assignee || p.assigneeId === assignee) &&
          (!date || p.scheduledAt?.slice(0, 10) === date),
      ),
    [posts, search, status, assignee, date],
  );
  const counts = {
    total: posts.length,
    doing: posts.filter((p) => p.status === "IN_PROGRESS").length,
    ready: posts.filter((p) => p.status === "READY_TO_PUBLISH").length,
    published: posts.filter((p) => p.status === "PUBLISHED").length,
  };
  const metrics = [
    {
      label: "Tổng bài",
      value: counts.total,
      icon: FileText,
      color: "bg-slate-100 text-slate-600",
    },
    {
      label: "Đang làm",
      value: counts.doing,
      icon: Clock3,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Chờ đăng",
      value: counts.ready,
      icon: Send,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Đã đăng",
      value: counts.published,
      icon: Link2,
      color: "bg-emerald-50 text-emerald-600",
    },
  ];
  const updatePost = (next: ContentPost) => {
    setPosts((old) => old.map((p) => (p.id === next.id ? next : p)));
    setSelected(next);
  };
  async function quickStatus(post: ContentPost, nextStatus: Status) {
    const optimistic = { ...post, status: nextStatus };
    setPosts((old) => old.map((p) => (p.id === post.id ? optimistic : p)));
    if (!offline)
      try {
        const saved = await api<ContentPost>(`/api/posts/${post.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        });
        setPosts((old) => old.map((p) => (p.id === post.id ? saved : p)));
      } catch {
        setPosts((old) => old.map((p) => (p.id === post.id ? post : p)));
      }
  }
  async function createPost(data: Partial<ContentPost>) {
    if (offline) {
      setPosts((old) => [
        {
          ...data,
          id: crypto.randomUUID(),
          content: data.content ?? "",
          status: data.status ?? "DRAFT",
          assignee: users.find((u) => u.id === data.assigneeId) ?? null,
          images: [],
          externalImageUrl: null,
          publishedUrl: null,
          notes: data.notes ?? null,
          updatedAt: new Date().toISOString(),
        } as ContentPost,
        ...old,
      ]);
    } else {
      const created = await api<ContentPost>("/api/posts", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setPosts((old) => [created, ...old]);
    }
    setCreating(false);
    setActiveTab("overview");
    setSearch("");
    setStatus("");
    setAssignee("");
    setDate("");
  }
  async function deletePost(post: ContentPost) {
    if (!confirm(`Xóa chủ đề “${post.title}”?`)) return;
    if (!offline && !post.id.startsWith("demo-"))
      await api(`/api/posts/${post.id}`, { method: "DELETE" });
    setPosts((old) => old.filter((item) => item.id !== post.id));
    if (selected?.id === post.id) setSelected(null);
  }
  async function importTopics(items: Partial<ContentPost>[]) {
    const created: ContentPost[] = [];
    for (const item of items) {
      if (offline)
        created.push({
          ...item,
          id: crypto.randomUUID(),
          topicType: item.topicType ?? null,
          content: item.content ?? "",
          status: "DRAFT",
          assigneeId: item.assigneeId ?? null,
          assignee: users.find((u) => u.id === item.assigneeId) ?? null,
          scheduledAt: item.scheduledAt ?? null,
          images: [],
          externalImageUrl: null,
          publishedUrl: null,
          notes: item.notes ?? null,
          updatedAt: new Date().toISOString(),
        } as ContentPost);
      else
        created.push(
          await api<ContentPost>("/api/posts", {
            method: "POST",
            body: JSON.stringify(item),
          }),
        );
    }
    setPosts((old) => [...created, ...old]);
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-brand text-white">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">
                Content Team
              </h1>
              <p className="text-[11px] text-muted">
                Lịch nội dung của team mình
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden -space-x-2 sm:flex">
              {users.slice(0, 2).map((u, i) => (
                <div
                  key={u.id}
                  title={u.name}
                  className={cn(
                    "grid size-8 place-items-center rounded-full border-2 border-white text-[10px] font-bold",
                    i
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700",
                  )}
                >
                  {u.name.slice(-1)}
                </div>
              ))}
            </div>
            <button onClick={() => setCreating(true)} className="btn-primary">
              <Plus className="size-4" /> Tạo bài
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1500px] gap-6 px-4 sm:px-7">
          <button
            onClick={() => setActiveTab("topics")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-1 pb-3 pt-1 text-sm font-semibold transition",
              activeTab === "topics"
                ? "border-brand text-brand"
                : "border-transparent text-muted hover:text-ink",
            )}
          >
            <Lightbulb className="size-4" /> Chủ đề
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-1 pb-3 pt-1 text-sm font-semibold transition",
              activeTab === "overview"
                ? "border-brand text-brand"
                : "border-transparent text-muted hover:text-ink",
            )}
          >
            <LayoutList className="size-4" /> Tổng quan nội dung{" "}
            <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px]">
              {posts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("facebook")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-1 pb-3 pt-1 text-sm font-semibold transition",
              activeTab === "facebook"
                ? "border-brand text-brand"
                : "border-transparent text-muted hover:text-ink",
            )}
          >
            <Share2 className="size-4" /> Facebook Pages
            {facebookPages.length > 0 && (
              <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] text-brand">
                {facebookPages.length}
              </span>
            )}
          </button>
        </nav>
      </header>
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7">
        {activeTab === "topics" ? (
          <TopicWorkspace
            posts={posts}
            users={users}
            onCreate={createPost}
            onOpen={setSelected}
            onDelete={deletePost}
            onImport={importTopics}
            offline={offline}
          />
        ) : activeTab === "facebook" ? (
          <FacebookSettings
            pages={facebookPages}
            offline={offline}
            onChange={setFacebookPages}
          />
        ) : (
          <>
            <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Tổng quan nội dung
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Theo dõi và hoàn thành bài đăng, không bỏ sót lịch.
                </p>
              </div>
              {offline && !loading && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <CircleAlert className="size-4" /> Dữ liệu mẫu · Kết nối
                  PostgreSQL để lưu thật
                </div>
              )}
            </div>
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {metrics.map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted">{label}</p>
                      <p className="mt-2 text-3xl font-bold tracking-tight">
                        {value}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "grid size-9 place-items-center rounded-xl",
                        color,
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              <div className="flex flex-col gap-3 border-b border-line p-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative min-w-0 flex-1 xl:max-w-sm">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input pl-9"
                    placeholder="Tìm theo chủ đề, nội dung..."
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SlidersHorizontal className="hidden size-4 text-muted sm:block" />
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="input w-auto min-w-32"
                  >
                    <option value="">Tất cả người</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input w-auto min-w-32"
                  >
                    <option value="">Mọi trạng thái</option>
                    {Object.entries(statusMeta).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input w-auto"
                  />
                  <div className="ml-auto flex rounded-xl bg-canvas p-1">
                    <button
                      aria-label="Dạng bảng"
                      onClick={() => setView("table")}
                      className={cn(
                        "rounded-lg p-2",
                        view === "table" && "bg-white shadow-sm",
                      )}
                    >
                      <LayoutList className="size-4" />
                    </button>
                    <button
                      aria-label="Dạng lịch"
                      onClick={() => setView("calendar")}
                      className={cn(
                        "rounded-lg p-2",
                        view === "calendar" && "bg-white shadow-sm",
                      )}
                    >
                      <CalendarDays className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="grid h-64 place-items-center">
                  <Loader2 className="size-6 animate-spin text-brand" />
                </div>
              ) : view === "table" ? (
                <PostTable
                  posts={filtered}
                  onOpen={setSelected}
                  onStatus={quickStatus}
                />
              ) : (
                <CalendarView posts={filtered} onOpen={setSelected} />
              )}
            </section>
          </>
        )}
      </div>
      <CreatePost
        open={creating}
        onOpenChange={setCreating}
        users={users}
        onCreate={createPost}
      />
      <PostDetail
        post={selected}
        users={users}
        facebookPages={facebookPages}
        open={Boolean(selected)}
        offline={offline}
        onOpenChange={(open) => !open && setSelected(null)}
        onUpdate={updatePost}
        onDelete={(id) => {
          setPosts((old) => old.filter((p) => p.id !== id));
          setSelected(null);
        }}
      />
    </main>
  );
}

function FacebookSettings({
  pages,
  offline,
  onChange,
}: {
  pages: ConnectedFacebookPage[];
  offline: boolean;
  onChange: (pages: ConnectedFacebookPage[]) => void;
}) {
  const [connecting, setConnecting] = useState(false),
    [error, setError] = useState("");
  const popupRef = useRef<Window | null>(null);
  useEffect(() => {
    const receive = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== popupRef.current || event.data?.type !== "facebook-oauth") return;
      setConnecting(false); popupRef.current = null;
      if (!event.data.success) { setError(event.data.error === "facebook_not_configured" ? "Chưa cấu hình Facebook App ID và App Secret." : event.data.error === "invalid_app_secret" ? "FACEBOOK_APP_SECRET không đúng hoặc đang để trống." : "Không thể kết nối Facebook. Vui lòng thử lại."); return; }
      try { onChange(await api<ConnectedFacebookPage[]>("/api/facebook/pages")); } catch (e) { setError(e instanceof Error ? e.message : "Không thể tải danh sách Page"); }
    };
    window.addEventListener("message", receive); return () => window.removeEventListener("message", receive);
  }, [onChange]);
  function openFacebookLogin() {
    setError(""); setConnecting(true);
    const width = 620, height = 720, left = Math.max(0, window.screenX + (window.outerWidth - width) / 2), top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
    popupRef.current = window.open("/api/facebook/oauth/start", "facebook-connect", `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
    if (!popupRef.current) { setConnecting(false); setError("Trình duyệt đang chặn cửa sổ đăng nhập. Hãy cho phép popup cho trang này."); }
  }
  async function connect(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setConnecting(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const page = await api<ConnectedFacebookPage>("/api/facebook/pages", {
        method: "POST",
        body: JSON.stringify({
          name: String(form.get("name")),
          pageId: String(form.get("pageId")),
          accessToken: String(form.get("accessToken")),
        }),
      });
      onChange([...pages.filter((item) => item.id !== page.id), page]);
      e.currentTarget.reset();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Không thể liên kết Facebook Page",
      );
    } finally {
      setConnecting(false);
    }
  }
  async function remove(page: ConnectedFacebookPage) {
    if (!confirm(`Ngắt liên kết với “${page.name}”?`)) return;
    try {
      await api(`/api/facebook/pages/${page.id}`, { method: "DELETE" });
      onChange(pages.filter((item) => item.id !== page.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể ngắt liên kết");
    }
  }
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Facebook Pages</h2>
        <p className="mt-1 text-sm text-muted">
          Liên kết các fanpage để đăng nội dung trực tiếp từ ứng dụng.
        </p>
      </div>
      {offline ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          <p className="font-bold">Cần kết nối PostgreSQL trước</p>
          <p className="mt-1 text-xs leading-5">
            Token Facebook phải được mã hóa và lưu an toàn ở backend, nên tính
            năng này không hoạt động trong chế độ dữ liệu mẫu.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:flex sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-blue-950">Liên kết tự động</h3>
              <p className="mt-1 text-xs text-blue-700">
                Đăng nhập Facebook một lần, app sẽ tự lấy tất cả Page bạn quản
                lý.
              </p>
            </div>
            <button
              type="button"
              onClick={openFacebookLogin}
              disabled={connecting}
              className="btn mt-4 bg-[#1877F2] text-white hover:bg-[#1468d4] sm:mt-0"
            >
              {connecting ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />} Tiếp tục với Facebook
            </button>
          </div>
          {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
          <form
            onSubmit={connect}
            className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"
          >
            <div className="mb-5">
              <h3 className="font-bold">Hoặc liên kết thủ công</h3>
              <p className="mt-1 text-xs text-muted">
                Dùng Page ID và Page Access Token khi Meta App chưa bật OAuth.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Tên Page</label>
                <input
                  name="name"
                  required
                  className="input"
                  placeholder="Ví dụ: Simdulich.vn"
                />
              </div>
              <div>
                <label className="label">Page ID</label>
                <input
                  name="pageId"
                  required
                  className="input"
                  placeholder="Facebook Page ID"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="label">Page Access Token</label>
              <input
                name="accessToken"
                required
                type="password"
                autoComplete="off"
                className="input"
                placeholder="EAAB..."
              />
            </div>
            {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
            <div className="mt-5 flex justify-end">
              <button disabled={connecting} className="btn-primary">
                {connecting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Link2 className="size-4" />
                )}{" "}
                Kiểm tra và liên kết
              </button>
            </div>
          </form>
          <section className="mt-5 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
            <div className="border-b border-line bg-canvas/60 px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted">
              Đã liên kết ({pages.length})
            </div>
            {pages.length ? (
              pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between border-b border-line px-5 py-4 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-[#1877F2] text-sm font-black text-white">
                      f
                    </div>
                    <div>
                      <p className="text-sm font-bold">{page.name}</p>
                      <p className="text-[11px] text-muted">
                        Page ID: {page.pageId}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => void remove(page)}
                    className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted">
                Chưa có Facebook Page nào được liên kết.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function TopicWorkspace({
  posts,
  users,
  onCreate,
  onOpen,
  onDelete,
  onImport,
  offline,
}: {
  posts: ContentPost[];
  users: User[];
  onCreate: (v: Partial<ContentPost>) => Promise<void>;
  onOpen: (p: ContentPost) => void;
  onDelete: (p: ContentPost) => Promise<void>;
  onImport: (items: Partial<ContentPost>[]) => Promise<void>;
  offline: boolean;
}) {
  const topicTypes = [
    "Tour MICE",
    "Tour lẻ",
    "Combo",
    "Visa",
    "Khuyến mãi",
    "Thương hiệu",
    "Khác",
  ];
  const [saving, setSaving] = useState(false),
    [importing, setImporting] = useState(false),
    [error, setError] = useState(""),
    [showForm, setShowForm] = useState(false),
    [filterType, setFilterType] = useState("");
  const visiblePosts = filterType
    ? posts.filter((post) => post.topicType === filterType)
    : posts;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await onCreate({
        title: String(form.get("title")),
        topicType: String(form.get("topicType")) || null,
        content: String(form.get("content")),
        scheduledAt: form.get("scheduledAt")
          ? new Date(
              String(form.get("scheduledAt")) + "T09:00:00",
            ).toISOString()
          : null,
        assigneeId: String(form.get("assigneeId")) || null,
        notes: String(form.get("angle")) || null,
        status: "DRAFT",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tạo chủ đề");
    } finally {
      setSaving(false);
    }
  }
  async function importFile(file: File) {
    setImporting(true);
    setError("");
    try {
      const rows = file.name.toLowerCase().endsWith(".xlsx")
        ? await readExcelRows(file)
        : parseDelimited(await file.text());
      const items = rowsToTopics(rows, users);
      if (!items.length)
        throw new Error("Không tìm thấy chủ đề hợp lệ trong file");
      await onImport(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể đọc file");
    } finally {
      setImporting(false);
    }
  }
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Chủ đề</h2>
          <p className="mt-1 text-sm text-muted">
            Danh sách ý tưởng nội dung của team.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input w-auto"
          >
            <option value="">Tất cả loại</option>
            {topicTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <a
            href="/mau-chu-de.csv"
            download="mau-chu-de.csv"
            className="btn-ghost"
          >
            <Download className="size-4" /> Tải file mẫu
          </a>
          <label className="btn-ghost cursor-pointer">
            {importing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}{" "}
            Nhập file
            <input
              type="file"
              className="hidden"
              accept=".csv,.tsv,.xlsx"
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importFile(file);
                e.target.value = "";
              }}
            />
          </label>
          <button
            onClick={() => setShowForm((value) => !value)}
            className="btn-primary"
          >
            <Plus className="size-4" /> Thêm chủ đề
          </button>
        </div>
      </div>
      {offline && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <CircleAlert className="size-4" /> Đang dùng dữ liệu mẫu
        </div>
      )}
      {error && !showForm && (
        <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
          {error}
        </p>
      )}
      {showForm && (
        <form
          onSubmit={submit}
          className="mb-5 rounded-2xl border border-line bg-white p-5 shadow-card"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_190px]">
            <div>
              <label className="label">Chủ đề *</label>
              <input
                name="title"
                required
                autoFocus
                className="input"
                placeholder="Nhập tên chủ đề..."
              />
            </div>
            <div>
              <label className="label">Loại chủ đề *</label>
              <select name="topicType" required className="input">
                <option value="">Chọn loại</option>
                {topicTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Ngày dự kiến đăng</label>
              <input name="scheduledAt" type="date" className="input" />
            </div>
            <div>
              <label className="label">Người phụ trách</label>
              <select name="assigneeId" className="input">
                <option value="">Chọn sau</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <input type="hidden" name="content" value="" />
          <input type="hidden" name="angle" value="" />
          {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-ghost"
            >
              Hủy
            </button>
            <button disabled={saving} className="btn-primary">
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}{" "}
              Tạo và sang tổng quan
            </button>
          </div>
        </form>
      )}
      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-line bg-canvas/60 px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted">
          <span>
            Chủ đề{" "}
            <span className="ml-1 font-medium">({visiblePosts.length})</span>
          </span>
          <span className="hidden normal-case font-normal sm:block">
            File: Chủ đề · Loại chủ đề · Ngày đăng · Người phụ trách
          </span>
        </div>
        {visiblePosts.length ? (
          <div>
            {visiblePosts.map((post) => (
              <div
                key={post.id}
                className="group flex items-center justify-between gap-4 border-b border-line px-5 py-5 transition last:border-0 hover:bg-canvas/70 sm:px-6"
              >
                <button
                  onClick={() => onOpen(post)}
                  className="min-w-0 flex-1 text-left"
                >
                  <h3 className="truncate text-base font-bold sm:text-lg">
                    {post.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold text-brand">
                      {post.topicType || "Chưa phân loại"}
                    </span>
                    {post.assignee && (
                      <span className="text-[11px] text-muted">
                        {post.assignee.name}
                      </span>
                    )}
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    title="Sửa chủ đề"
                    onClick={() => onOpen(post)}
                    className="rounded-lg p-2 text-muted hover:bg-white hover:text-brand hover:shadow-sm"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    title="Xóa chủ đề"
                    onClick={() => void onDelete(post)}
                    className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </section>
    </div>
  );
}

function parseDelimited(text: string): unknown[][] {
  const delimiter = text.includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
async function readExcelRows(file: File): Promise<unknown[][]> {
  const readXlsxFile = (await import("read-excel-file")).default;
  return readXlsxFile(file);
}
function rowsToTopics(
  rows: unknown[][],
  users: User[],
): Partial<ContentPost>[] {
  if (rows.length < 2) return [];
  const normalized = (value: unknown) =>
    String(value ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  const headers = rows[0].map(normalized);
  const find = (...names: string[]) =>
    headers.findIndex((header) =>
      names.some((name) => header === normalized(name)),
    );
  const titleIndex = find("Chủ đề", "Chu de", "title"),
    typeIndex = find("Loại chủ đề", "Loai chu de", "topicType"),
    dateIndex = find("Ngày đăng", "Ngay dang", "scheduledAt"),
    userIndex = find("Người phụ trách", "Nguoi phu trach", "assignee");
  if (titleIndex < 0) throw new Error("File cần có cột “Chủ đề”");
  return rows
    .slice(1)
    .map((row) => {
      const title = String(row[titleIndex] ?? "").trim();
      const rawDate = dateIndex >= 0 ? row[dateIndex] : null;
      const parsedDate =
        rawDate instanceof Date
          ? rawDate
          : rawDate
            ? new Date(String(rawDate))
            : null;
      const assigneeName =
        userIndex >= 0
          ? String(row[userIndex] ?? "")
              .trim()
              .toLowerCase()
          : "";
      return {
        title,
        topicType:
          typeIndex >= 0 ? String(row[typeIndex] ?? "").trim() || null : null,
        scheduledAt:
          parsedDate && !Number.isNaN(parsedDate.valueOf())
            ? parsedDate.toISOString()
            : null,
        assigneeId:
          users.find((user) => user.name.toLowerCase() === assigneeName)?.id ??
          null,
        content: "",
        status: "DRAFT" as Status,
      };
    })
    .filter((item) => item.title);
}

function PostTable({
  posts,
  onOpen,
  onStatus,
}: {
  posts: ContentPost[];
  onOpen: (p: ContentPost) => void;
  onStatus: (p: ContentPost, s: Status) => void;
}) {
  if (!posts.length) return <Empty />;
  return (
    <div className="scrollbar overflow-x-auto">
      <table className="w-full min-w-[1050px] text-left">
        <thead>
          <tr className="border-b border-line bg-canvas/60 text-[10px] font-semibold uppercase tracking-wider text-muted">
            {[
              "Ngày đăng",
              "Chủ đề",
              "Phụ trách",
              "Nội dung",
              "Hình ảnh",
              "Trạng thái",
              "Link đã đăng",
              "Ghi chú",
              "",
            ].map((x) => (
              <th key={x} className="px-4 py-3">
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr
              key={post.id}
              onClick={() => onOpen(post)}
              className="group cursor-pointer border-b border-line/80 text-xs transition last:border-0 hover:bg-canvas/70"
            >
              <td className="whitespace-nowrap px-4 py-4">
                <span className="font-semibold">
                  {post.scheduledAt
                    ? format(new Date(post.scheduledAt), "dd/MM")
                    : "—"}
                </span>
                <span className="ml-1 text-muted">
                  {post.scheduledAt
                    ? format(new Date(post.scheduledAt), "yyyy")
                    : ""}
                </span>
              </td>
              <td className="max-w-[240px] px-4 py-4">
                <p className="truncate font-semibold text-ink">{post.title}</p>
              </td>
              <td className="px-4 py-4">
                <Assignee user={post.assignee} />
              </td>
              <td className="max-w-[210px] px-4 py-4">
                <p className="line-clamp-2 leading-relaxed text-muted">
                  {post.content || "Chưa có nội dung"}
                </p>
              </td>
              <td className="px-4 py-4">
                {post.images.length ? (
                  <div className="flex items-center gap-1">
                    <div className="size-8 overflow-hidden rounded-lg bg-slate-100">
                      <img
                        src={
                          post.images.find((x) => x.isPrimary)?.url ??
                          post.images[0].url
                        }
                        alt=""
                        className="size-full object-cover"
                      />
                    </div>
                    <span className="text-muted">+{post.images.length}</span>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-muted">
                    <ImageIcon className="size-3.5" /> 0
                  </span>
                )}
              </td>
              <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                <StatusSelect
                  value={post.status}
                  compact
                  onChange={(s) => onStatus(post, s)}
                />
              </td>
              <td className="px-4 py-4">
                {post.publishedUrl ? (
                  <a
                    href={post.publishedUrl}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
                  >
                    <Link2 className="size-3" /> Mở link
                  </a>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td className="max-w-[150px] px-4 py-4">
                <p className="truncate text-muted">{post.notes || "—"}</p>
              </td>
              <td className="px-4 py-4">
                <MoreHorizontal className="size-4 text-muted opacity-0 transition group-hover:opacity-100" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Assignee({ user }: { user: User | null }) {
  return user ? (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className="grid size-6 place-items-center rounded-full bg-brand-soft text-[9px] font-bold text-brand">
        {user.name.slice(-1)}
      </span>
      {user.name}
    </span>
  ) : (
    <span className="text-muted">Chưa giao</span>
  );
}
function Empty() {
  return (
    <div className="grid h-64 place-items-center text-center">
      <div>
        <div className="mx-auto mb-3 grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand">
          <FileText className="size-5" />
        </div>
        <p className="font-semibold">Không tìm thấy bài đăng</p>
        <p className="mt-1 text-xs text-muted">
          Thử thay đổi bộ lọc hoặc tạo bài mới.
        </p>
      </div>
    </div>
  );
}

function CalendarView({
  posts,
  onOpen,
}: {
  posts: ContentPost[];
  onOpen: (p: ContentPost) => void;
}) {
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
  return (
    <div className="p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold capitalize">
            {format(month, "MMMM yyyy", { locale: vi })}
          </h3>
          <p className="text-xs text-muted">
            {posts.length} bài trong lịch hiện tại
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonth(subMonths(month, 1))}
            className="btn-ghost p-2"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setMonth(startOfMonth(new Date()))}
            className="btn-ghost px-3 py-2 text-xs"
          >
            Hôm nay
          </button>
          <button
            onClick={() => setMonth(addMonths(month, 1))}
            className="btn-ghost p-2"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-l border-t border-line">
        <>
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
            <div
              key={d}
              className="border-b border-r border-line bg-canvas py-2 text-center text-[10px] font-semibold text-muted"
            >
              {d}
            </div>
          ))}
        </>
        {days.map((day) => {
          const dayPosts = posts.filter(
            (p) => p.scheduledAt && isSameDay(new Date(p.scheduledAt), day),
          );
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-24 border-b border-r border-line p-1.5 sm:min-h-28",
                !isSameMonth(day, month) && "bg-canvas/60 text-slate-400",
              )}
            >
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full text-[11px]",
                  isSameDay(day, new Date()) && "bg-brand text-white",
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-1">
                {dayPosts.slice(0, 3).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onOpen(p)}
                    className={cn(
                      "block w-full truncate rounded-md px-1.5 py-1 text-left text-[9px] font-semibold sm:text-[10px]",
                      statusMeta[p.status].className,
                    )}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CreatePost({
  open,
  onOpenChange,
  users,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  users: User[];
  onCreate: (v: Partial<ContentPost>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await onCreate({
        title: String(form.get("title")),
        scheduledAt: form.get("scheduledAt")
          ? new Date(
              String(form.get("scheduledAt")) + "T09:00:00",
            ).toISOString()
          : null,
        assigneeId: String(form.get("assigneeId")) || null,
        content: String(form.get("content")),
        notes: String(form.get("notes")) || null,
        status: form.get("status") as Status,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tạo bài");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-x-3 top-1/2 z-50 mx-auto w-auto max-w-xl -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-xl font-bold">
                Tạo bài mới
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted">
                Thêm ý tưởng vào lịch nội dung của team.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-2 hover:bg-canvas">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Chủ đề *</label>
              <input
                name="title"
                className="input"
                autoFocus
                required
                placeholder="Ví dụ: 5 mẹo du lịch mùa thu"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Ngày dự kiến đăng</label>
                <input name="scheduledAt" type="date" className="input" />
              </div>
              <div>
                <label className="label">Người phụ trách</label>
                <select name="assigneeId" className="input">
                  <option value="">Chưa giao</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Nội dung</label>
              <textarea
                name="content"
                className="input min-h-24 resize-none"
                placeholder="Viết nội dung nháp..."
              />
            </div>
            <div>
              <label className="label">Dạng bài đăng Facebook</label>
              <select name="facebookFormat" defaultValue="TEXT" className="input">
                <option value="TEXT">Bài chữ</option>
                <option value="PHOTO">Ảnh đơn</option>
                <option value="ALBUM">Album nhiều ảnh</option>
                <option value="LINK">Link</option>
                <option value="VIDEO">Video</option>
                <option value="REEL">Reel</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Trạng thái</label>
                <select name="status" defaultValue="DRAFT" className="input">
                  {Object.entries(statusMeta).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Ghi chú</label>
                <input
                  name="notes"
                  className="input"
                  placeholder="Ghi chú cho team"
                />
              </div>
            </div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close className="btn-ghost">Hủy</Dialog.Close>
              <button disabled={saving} className="btn-primary">
                {saving && <Loader2 className="size-4 animate-spin" />} Tạo bài
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
