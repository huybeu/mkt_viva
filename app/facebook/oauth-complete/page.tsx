"use client";

import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function FacebookOAuthComplete() {
  const [message, setMessage] = useState("Đang hoàn tất kết nối...");
  const [success, setSuccess] = useState<boolean | null>(null);
  const [hasOpener, setHasOpener] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search), error = params.get("error"), connected = Number(params.get("connected") || 0);
    const payload = error ? { type: "facebook-oauth", success: false, error } : { type: "facebook-oauth", success: true, connected };
    setHasOpener(Boolean(window.opener)); setSuccess(!error); setMessage(error === "facebook_not_configured" ? "Ứng dụng Facebook chưa được cấu hình." : error === "invalid_app_secret" ? "FACEBOOK_APP_SECRET không đúng hoặc đang để trống." : error ? "Kết nối Facebook không thành công." : `Đã liên kết ${connected} Page thành công.`);
    if (window.opener) { window.opener.postMessage(payload, window.location.origin); window.setTimeout(() => window.close(), 900); }
  }, []);
  return <main className="grid min-h-screen place-items-center bg-canvas p-6"><div className="w-full max-w-sm rounded-2xl border border-line bg-white p-7 text-center shadow-card">{success === null ? <Loader2 className="mx-auto mb-4 size-9 animate-spin text-[#1877F2]"/> : success ? <CheckCircle2 className="mx-auto mb-4 size-10 text-emerald-600"/> : <CircleAlert className="mx-auto mb-4 size-10 text-rose-500"/>}<h1 className="text-lg font-bold">{message}</h1><p className="mt-2 text-xs text-muted">{hasOpener ? "Cửa sổ này sẽ tự đóng." : "Bạn có thể quay lại ứng dụng."}</p>{!hasOpener && <a href="/?tab=facebook" className="btn-primary mt-5">Quay lại ứng dụng</a>}</div></main>;
}
