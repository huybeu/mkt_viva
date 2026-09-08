import { cookies } from "next/headers";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
export function hashPassword(password: string) { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(password, salt, 32).toString("hex")}`; }
export function verifyPassword(password: string, stored: string | null) { if (!stored) return false; const [salt, hash] = stored.split(":"); if (!salt || !hash) return false; const actual = scryptSync(password, salt, 32); return timingSafeEqual(actual, Buffer.from(hash, "hex")); }
export async function currentUser() { const token = (await cookies()).get("session")?.value; if (!token) return null; const session = await db.session.findUnique({ where: { id: token }, include: { user: true } }); return session && session.expiresAt > new Date() ? session.user : null; }
export async function createSession(userId: string) { const id = randomBytes(32).toString("hex"); await db.session.create({ data: { id, userId, expiresAt: new Date(Date.now() + 30 * 86400000) } }); return id; }
export const sessionCookie = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 30 * 86400, path: "/" };
