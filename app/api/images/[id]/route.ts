import { handleError, ok } from "@/lib/api"; import { imagePatchSchema } from "@/lib/validation"; import { images } from "@/services/image.service";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { return ok(await images.patch((await params).id, imagePatchSchema.parse(await request.json()))); } catch (e) { return handleError(e); } }
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) { try { await images.remove((await params).id); return ok({ deleted: true }); } catch (e) { return handleError(e); } }
