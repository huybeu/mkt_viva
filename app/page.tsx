import { ContentBoard } from "@/components/content-board";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function Page() { if (!(await currentUser())) redirect("/login"); return <ContentBoard />; }
