import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export function ok<T>(data: T, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
export function handleError(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
  if (error instanceof ZodError) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "Dữ liệu không hợp lệ" } }, { status: 400 });
  console.error("API error", error);
  return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Đã có lỗi xảy ra" } }, { status: 500 });
}
