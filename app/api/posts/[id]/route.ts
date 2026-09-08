import { handleError, ok } from "@/lib/api"; import { postUpdateSchema } from "@/lib/validation"; import { posts } from "@/services/post.service";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { try { return ok(await posts.get((await params).id)); } catch (e) { return handleError(e); } }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { return ok(await posts.update((await params).id, postUpdateSchema.parse(await request.json()))); } catch (e) { return handleError(e); } }
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) { try { await posts.delete((await params).id); return ok({ deleted: true }); } catch (e) { return handleError(e); } }
