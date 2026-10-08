import { NextRequest, NextResponse } from "next/server";
import {
  isGoogleOAuthConfigured,
  getGoogleAuthUrl,
  getMockDiscoveredProperties,
  getMockGoogleUser,
} from "@/lib/analytics/google-oauth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organizationId");
  const returnUrl = searchParams.get("returnUrl") || "/";

  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  const isConfigured = isGoogleOAuthConfigured();

  // If live credentials are not set, return simulated Google consent payload
  if (!isConfigured) {
    return NextResponse.json({
      isLive: false,
      message: "Running in local development / demo mode without Google Cloud OAuth credentials.",
      mockUser: getMockGoogleUser(),
      discoveredProperties: getMockDiscoveredProperties(),
    });
  }

  // Live Google OAuth redirect URI
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  const authUrl = getGoogleAuthUrl({
    organizationId,
    redirectUri,
    returnUrl,
  });

  return NextResponse.json({
    isLive: true,
    authUrl,
  });
}
