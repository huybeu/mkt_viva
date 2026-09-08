import { NextResponse } from "next/server";
import { currentUser, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ username: z.string().trim().min(3).max(50), password: z.string().min(6).max(100), name: z.string().trim().min(1).max(100), role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER") });
async function admin() { const user = await currentUser(); if (!user || user.role !== "ADMIN") return null; return user; }
export async function GET() { if (!await admin()) return NextResponse.json({ error: "Không có quyền" }, { status: 403 }); const users = await db.user.findMany({ select: { id: true, username: true, name: true, role: true, createdAt: true, _count: { select: { facebookPages: true } } }, orderBy: { createdAt: "asc" } }); return NextResponse.json({ users }); }
export async function POST(request: Request) {
  if (!await admin()) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Thông tin tài khoản không hợp lệ" }, { status: 400 });
  const input = parsed.data;
  const exists = await db.user.findUnique({ where: { username: input.username } });
  if (exists) return NextResponse.json({ error: "Tên đăng nhập đã tồn tại" }, { status: 409 });
  const user = await db.user.create({ data: { username: input.username, passwordHash: hashPassword(input.password), name: input.name, role: input.role }, select: { id: true, username: true, name: true, role: true } });
  return NextResponse.json({ user }, { status: 201 });
}
