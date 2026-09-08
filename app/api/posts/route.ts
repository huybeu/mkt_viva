import { postCreateSchema } from "@/lib/validation";
import { handleError, ok } from "@/lib/api";
import { posts } from "@/services/post.service";
export async function GET(request: Request) { try { return ok(await posts.list(new URL(request.url).searchParams)); } catch (e) { return handleError(e); } }
export async function POST(request: Request) { try { return ok(await posts.create(postCreateSchema.parse(await request.json())), 201); } catch (e) { return handleError(e); } }
