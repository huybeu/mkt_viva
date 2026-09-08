import { handleError, ok } from "@/lib/api"; import { facebook } from "@/services/facebook.service";
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) { try { await facebook.remove((await params).id); return ok({ deleted: true }); } catch (e) { return handleError(e); } }
