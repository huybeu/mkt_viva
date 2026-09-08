import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  const appId = process.env.FACEBOOK_APP_ID, redirectUri = process.env.FACEBOOK_REDIRECT_URI;
  if (!appId || !redirectUri) return NextResponse.redirect(new URL("/facebook/oauth-complete?error=facebook_not_configured", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  const state = randomBytes(24).toString("base64url");
  const params = new URLSearchParams({ client_id: appId, redirect_uri: redirectUri, state, response_type: "code", scope: "pages_show_list,pages_read_engagement,pages_manage_posts" });
  const response = NextResponse.redirect(`https://www.facebook.com/${process.env.FACEBOOK_GRAPH_VERSION || "v26.0"}/dialog/oauth?${params}`);
  response.cookies.set("facebook_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  return response;
}
