import { handleError, ok } from "@/lib/api"; import { userUpdateSchema } from "@/lib/validation"; import { users } from "@/services/user.service";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { return ok(await users.update((await params).id, userUpdateSchema.parse(await request.json()))); } catch (e) { return handleError(e); } }
