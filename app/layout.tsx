import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Content Team", description: "Quản lý lịch nội dung cho team nhỏ" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="vi"><body>{children}</body></html>; }
