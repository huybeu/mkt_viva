import { ContentBoard } from "@/components/content-board";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return <>
    <ContentBoard />
    {user.role === "ADMIN" && <a href="/admin" className="fixed bottom-5 right-5 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg">Quản trị</a>}
  </>;
}
