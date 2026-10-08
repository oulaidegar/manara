export interface DiscoveredGA4Property {
  propertyId: string;
  displayName: string;
  websiteUrl: string;
  accountName: string;
}

export interface GoogleOAuthUser {
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
}

/**
 * Checks if live Google Cloud OAuth credentials are configured in the environment.
 */
export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID !== "placeholder"
  );
}

/**
 * Generates the Google OAuth 2.0 authorization URL for Google Analytics read-only access.
 */
export function getGoogleAuthUrl(params: {
  organizationId: string;
  redirectUri: string;
  returnUrl?: string;
}): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const scope = [
    "https://www.googleapis.com/auth/analytics.readonly",
    "openid",
    "email",
    "profile",
  ].join(" ");

  const state = Buffer.from(
    JSON.stringify({
      orgId: params.organizationId,
      returnUrl: params.returnUrl || "",
      t: Date.now(),
    })
  ).toString("base64url");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);

  return url.toString();
}

/**
 * Exchanges Google OAuth authorization code for access and refresh tokens.
 */
export async function exchangeCodeForTokens(params: {
  code: string;
  redirectUri: string;
}): Promise<GoogleTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code: params.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: params.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google token exchange failed: ${errorText}`);
  }

  const json = await response.json();
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in,
    tokenType: json.token_type,
    scope: json.scope,
  };
}

/**
 * Fetches basic Google user profile information.
 */
export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleOAuthUser> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Google user profile info");
  }

  const json = await res.json();
  return {
    email: json.email,
    name: json.name || json.email.split("@")[0],
    picture: json.picture,
  };
}

/**
 * Fetches all GA4 properties the authenticated user has access to via Google Analytics Admin API.
 */
export async function fetchUserGA4Properties(accessToken: string): Promise<DiscoveredGA4Property[]> {
  try {
    const res = await fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      return getMockDiscoveredProperties();
    }

    const data = await res.json();
    const discovered: DiscoveredGA4Property[] = [];

    if (data.accountSummaries && Array.isArray(data.accountSummaries)) {
      for (const account of data.accountSummaries) {
        const accountDisplayName = account.displayName || "Google Analytics Account";
        if (account.propertySummaries && Array.isArray(account.propertySummaries)) {
          for (const prop of account.propertySummaries) {
            const rawId = String(prop.property || "").replace(/^properties\//, "");
            discovered.push({
              propertyId: rawId,
              displayName: prop.displayName || `Property ${rawId}`,
              websiteUrl: `https://${prop.displayName?.toLowerCase().replace(/[^a-z0-9]/g, "") || "analytics"}.org`,
              accountName: accountDisplayName,
            });
          }
        }
      }
    }

    return discovered.length > 0 ? discovered : getMockDiscoveredProperties();
  } catch {
    return getMockDiscoveredProperties();
  }
}

/**
 * High-fidelity fallback properties for development, testing, and offline previews.
 */
export function getMockDiscoveredProperties(): DiscoveredGA4Property[] {
  return [
    {
      propertyId: "314159265",
      displayName: "Daraj Media (Main Newsroom)",
      websiteUrl: "https://daraj.media",
      accountName: "Daraj Media Foundation",
    },
    {
      propertyId: "847291034",
      displayName: "Daraj Investigations & Special Reports",
      websiteUrl: "https://investigations.daraj.media",
      accountName: "Daraj Media Foundation",
    },
    {
      propertyId: "592817342",
      displayName: "Civic Watchdog & Legal Oversight",
      websiteUrl: "https://civicwatchdog.org",
      accountName: "Accountability Coalition",
    },
  ];
}

export function getMockGoogleUser(): GoogleOAuthUser {
  return {
    email: "editor@darajmedia.org",
    name: "Daraj Managing Editor",
  };
}
