"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { ReactNode, useCallback, useMemo } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function useResilientClerkAuth() {
  const {
    isLoaded,
    isSignedIn,
    getToken,
    orgId,
    orgRole,
    sessionId,
    sessionClaims,
  } = useAuth();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        if (sessionClaims?.aud === "convex") {
          return await getToken({ skipCache: forceRefreshToken });
        }

        // Try getting token with "convex" template first
        try {
          const templateToken = await getToken({
            template: "convex",
            skipCache: forceRefreshToken,
          });
          if (templateToken) return templateToken;
        } catch {
          // If "convex" template is not configured in Clerk dashboard, fall back to default session token
        }

        return await getToken({ skipCache: forceRefreshToken });
      } catch {
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orgId, orgRole, sessionId]
  );

  return useMemo(
    () => ({
      isLoading: !isLoaded,
      isAuthenticated: isSignedIn ?? false,
      fetchAccessToken,
    }),
    [isLoaded, isSignedIn, fetchAccessToken]
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useResilientClerkAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
