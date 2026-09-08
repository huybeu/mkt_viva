import { handleError, ok } from "@/lib/api"; import { facebookPageSchema } from "@/lib/validation"; import { facebook } from "@/services/facebook.service";
export async function GET() { try { return ok(await facebook.list()); } catch (e) { return handleError(e); } }
export async function POST(request: Request) { try { return ok(await facebook.connect(facebookPageSchema.parse(await request.json())), 201); } catch (e) { return handleError(e); } }
