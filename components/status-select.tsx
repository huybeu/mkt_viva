"use client";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Status, statusMeta } from "@/types/content";
export function StatusSelect({ value, onChange, compact = false }: { value: Status; onChange: (value: Status) => void; compact?: boolean }) {
  const meta = statusMeta[value];
  return <div className={cn("relative inline-flex items-center rounded-full", meta.className)}><span className={cn("pointer-events-none absolute left-2.5 size-1.5 rounded-full", meta.dot)} /><select aria-label="Trạng thái" value={value} onChange={e => onChange(e.target.value as Status)} className={cn("appearance-none bg-transparent pl-5 font-semibold outline-none", compact ? "py-1 pr-6 text-[11px]" : "py-2 pl-6 pr-8 text-xs")} >{Object.entries(statusMeta).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 size-3" /></div>;
}
