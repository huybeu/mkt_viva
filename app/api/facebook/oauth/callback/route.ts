import { NextRequest, NextResponse } from "next/server";
import { facebook } from "@/services/facebook.service";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export async function GET(request: NextRequest) {
  const url = new URL(request.url),
    code = url.searchParams.get("code"),
    state = url.searchParams.get("state"),
    expected = request.cookies.get("facebook_oauth_state")?.value;
  if (!code || !state || !expected || state !== expected)
    return NextResponse.redirect(
      new URL("/facebook/oauth-complete?error=invalid_oauth_state", appUrl()),
    );
  try {
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID || "",
      client_secret: process.env.FACEBOOK_APP_SECRET || "",
      redirect_uri: process.env.FACEBOOK_REDIRECT_URI || "",
      code,
    });
    const tokenResponse = await fetch(
      `https://graph.facebook.com/${process.env.FACEBOOK_GRAPH_VERSION || "v26.0"}/oauth/access_token?${params}`,
      { cache: "no-store" },
    );
    const token = (await tokenResponse.json()) as {
      access_token?: string;
      error?: { message?: string };
    };
    if (!tokenResponse.ok || !token.access_token)
      throw new Error(
        token.error?.message || "Không lấy được Facebook access token",
      );
    const pages = await facebook.connectFromUserToken(token.access_token);
    const response = NextResponse.redirect(
      new URL(`/facebook/oauth-complete?connected=${pages.length}`, appUrl()),
    );
    response.cookies.delete("facebook_oauth_state");
    return response;
  } catch (error) {
    console.error("Facebook OAuth failed", error);
    const code = error instanceof Error && error.message.toLowerCase().includes("client secret") ? "invalid_app_secret" : "oauth_failed";
    return NextResponse.redirect(
      new URL(`/facebook/oauth-complete?error=${code}`, appUrl()),
    );
  }
}
