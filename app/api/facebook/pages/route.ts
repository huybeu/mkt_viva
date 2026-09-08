import { ApiError, handleError, ok } from "@/lib/api"; import { currentUser } from "@/lib/auth"; import { facebookPageSchema } from "@/lib/validation"; import { facebook } from "@/services/facebook.service";
async function actor() { const user = await currentUser(); if (!user) throw new ApiError(401, "UNAUTHORIZED", "Vui lòng đăng nhập"); return user; }
export async function GET() { try { const user = await actor(); return ok(await facebook.list(user)); } catch (e) { return handleError(e); } }
export async function POST(request: Request) { try { const user = await actor(); return ok(await facebook.connect(facebookPageSchema.parse(await request.json()), user.id), 201); } catch (e) { return handleError(e); } }
