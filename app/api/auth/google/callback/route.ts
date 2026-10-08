import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  fetchGoogleUserInfo,
  fetchUserGA4Properties,
} from "@/lib/analytics/google-oauth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  let stateData: { orgId?: string; returnUrl?: string } = {};
  if (stateRaw) {
    try {
      stateData = JSON.parse(Buffer.from(stateRaw, "base64url").toString());
    } catch {
      // ignore
    }
  }

  const baseReturnUrl = stateData.returnUrl || "/";

  if (error || !code) {
    const errorMsg = error || "No authorization code provided";
    return NextResponse.redirect(new URL(`${baseReturnUrl}?googleAuthError=${encodeURIComponent(errorMsg)}`, req.url));
  }

  try {
    const tokens = await exchangeCodeForTokens({ code, redirectUri });
    const userInfo = await fetchGoogleUserInfo(tokens.accessToken);
    const properties = await fetchUserGA4Properties(tokens.accessToken);

    const redirectTarget = new URL(baseReturnUrl, req.url);
    redirectTarget.searchParams.set("googleAuthSuccess", "true");
    redirectTarget.searchParams.set("googleEmail", userInfo.email);
    redirectTarget.searchParams.set("googleName", userInfo.name);
    redirectTarget.searchParams.set("propertyCount", String(properties.length));

    // Store tokens & discovered properties in secure cookie for immediate modal pickup
    const response = NextResponse.redirect(redirectTarget);
    response.cookies.set("ga4_oauth_session", JSON.stringify({
      email: userInfo.email,
      name: userInfo.name,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      properties,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 300, // 5 minutes validity
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Google OAuth callback error";
    return NextResponse.redirect(new URL(`${baseReturnUrl}?googleAuthError=${encodeURIComponent(message)}`, req.url));
  }
}
