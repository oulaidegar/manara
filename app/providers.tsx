"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { ReactNode, useCallback, useEffect, useMemo, useRef } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210";
const convex = new ConvexReactClient(convexUrl);

function useResilientClerkAuth() {
  const {
    isLoaded,
    isSignedIn,
    getToken,
    sessionClaims,
  } = useAuth();

  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const isConvexAud = sessionClaims?.aud === "convex";

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        const getTok = getTokenRef.current;
        if (isConvexAud) {
          return await getTok({ skipCache: forceRefreshToken });
        }

        // Try getting token with "convex" template first
        try {
          const templateToken = await getTok({
            template: "convex",
            skipCache: forceRefreshToken,
          });
          if (templateToken) return templateToken;
        } catch {
          // If "convex" template is not configured in Clerk dashboard, fall back to default session token
        }

        return await getTok({ skipCache: forceRefreshToken });
      } catch {
        return null;
      }
    },
    [isConvexAud]
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
