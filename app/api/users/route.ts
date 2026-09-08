import { handleError, ok } from "@/lib/api"; import { userCreateSchema } from "@/lib/validation"; import { users } from "@/services/user.service";
export async function GET() { try { return ok(await users.list()); } catch (e) { return handleError(e); } }
export async function POST(request: Request) { try { return ok(await users.create(userCreateSchema.parse(await request.json())), 201); } catch (e) { return handleError(e); } }
