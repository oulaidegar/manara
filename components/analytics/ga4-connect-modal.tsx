"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/components/organization-context";
import {
  X,
  Globe,
  Loader2,
  AlertCircle,
  Sparkles,
  Shield,
  BarChart,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

interface DiscoveredProperty {
  propertyId: string;
  displayName: string;
  websiteUrl: string;
  accountName?: string;
}

interface GA4ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function getInitialOAuthSession(): {
  user: { email: string; name: string } | null;
  properties: DiscoveredProperty[];
} {
  if (typeof document === "undefined") return { user: null, properties: [] };
  try {
    const match = document.cookie.match(/ga4_oauth_session=([^;]+)/);
    if (match) {
      const session = JSON.parse(decodeURIComponent(match[1]));
      if (session.email) {
        return {
          user: { email: session.email, name: session.name || session.email },
          properties: Array.isArray(session.properties) ? session.properties : [],
        };
      }
    }
  } catch {
    // ignore
  }
  return { user: null, properties: [] };
}

function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function GA4ConnectModal({
  isOpen,
  onClose,
  onSuccess,
}: GA4ConnectModalProps) {
  const { organization } = useOrganization();
  const initialSession = getInitialOAuthSession();
  const [propertyId, setPropertyId] = useState(initialSession.properties[0]?.propertyId || "");
  const [displayName, setDisplayName] = useState(initialSession.properties[0]?.displayName || "");
  const [websiteUrl, setWebsiteUrl] = useState(initialSession.properties[0]?.websiteUrl || "");
  const [credentialsType, setCredentialsType] = useState<
    "oauth_google" | "demo_sandbox" | "service_account"
  >("oauth_google");
  const [serviceAccountEmail, setServiceAccountEmail] = useState("");
  const [googleUser, setGoogleUser] = useState<{ email: string; name: string } | null>(initialSession.user);
  const [discoveredProperties, setDiscoveredProperties] = useState<DiscoveredProperty[]>(initialSession.properties);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const connectGA4 = useMutation(api.ga4.connectGA4Property);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSigningInGoogle(true);
    setError(null);
    setStatusText("Initiating Google Sign-In...");

    try {
      const res = await fetch(`/api/auth/google/start?organizationId=${organization._id}&returnUrl=${encodeURIComponent(window.location.pathname)}`);
      const data = await res.json();

      if (data.isLive && data.authUrl) {
        // Redirect to Google's official OAuth consent screen
        setStatusText("Redirecting to Google Account Selection...");
        window.location.href = data.authUrl;
        return;
      }

      // Local sandbox / mock OAuth flow (works immediately without live GCP keys)
      setGoogleUser(data.mockUser);
      setDiscoveredProperties(data.discoveredProperties || []);
      if (data.discoveredProperties && data.discoveredProperties.length > 0) {
        const first = data.discoveredProperties[0];
        setPropertyId(first.propertyId);
        setDisplayName(first.displayName);
        setWebsiteUrl(first.websiteUrl);
      }
      setCredentialsType("oauth_google");
      setAuthNotice(
        "Signed in with Google. (Discovered accessible GA4 properties for your account)"
      );
      setStatusText(null);
      setIsSigningInGoogle(false);
    } catch (err: unknown) {
      setIsSigningInGoogle(false);
      setStatusText(null);
      setError(err instanceof Error ? err.message : "Failed to initiate Google Sign-In");
    }
  };

  const handleSelectDiscoveredProperty = (propId: string) => {
    const found = discoveredProperties.find((p) => p.propertyId === propId);
    if (found) {
      setPropertyId(found.propertyId);
      setDisplayName(found.displayName);
      setWebsiteUrl(found.websiteUrl);
    }
  };

  const handleFillDemo = () => {
    setPropertyId("314159265");
    setDisplayName("Daraj Media Investigative Desk");
    setWebsiteUrl("https://daraj.media");
    setCredentialsType("demo_sandbox");
    setServiceAccountEmail("");
    setGoogleUser(null);
    setError(null);
    setAuthNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId.trim()) {
      setError("Please select or enter a Google Analytics 4 Property ID");
      return;
    }
    if (!displayName.trim()) {
      setError("Please enter a display name for this site");
      return;
    }
    if (!websiteUrl.trim()) {
      setError("Please enter the website URL");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatusText("Connecting GA4 property & mapping investigative dossiers...");

    try {
      await connectGA4({
        organizationId: organization._id,
        propertyId: propertyId.trim().replace(/^properties\//, ""),
        displayName: displayName.trim(),
        websiteUrl: websiteUrl.trim(),
        credentialsType,
        googleUserEmail: googleUser?.email,
        googleAccountName: googleUser?.name,
        serviceAccountEmail: credentialsType === "service_account" ? serviceAccountEmail.trim() : undefined,
      });

      setStatusText("Synthesizing Social-to-Web attribution bridges...");
      setTimeout(() => {
        setIsLoading(false);
        setStatusText(null);
        onSuccess?.();
        onClose();
      }, 400);
    } catch (err: unknown) {
      setIsLoading(false);
      setStatusText(null);
      setError(err instanceof Error ? err.message : "Failed to connect GA4 property");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <BarChart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
                Connect Google Analytics 4
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Import readership, reading dwell depth, and evidence downloads
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* PRIMARY ACTION: Sign in with Google (OAuth 2.0) */}
        {!googleUser ? (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-gradient-to-b from-[var(--card)] to-[var(--background)] p-4 text-center space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Fastest Setup: 1-Click Google Sign-In
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed max-w-md mx-auto">
                Sign in with the Google account that manages your website. Radar automatically detects your GA4 properties and syncs your readership data.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningInGoogle}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--border)] bg-white dark:bg-zinc-900 py-2.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSigningInGoogle ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span>Connecting with Google...</span>
                </>
              ) : (
                <>
                  <GoogleIcon className="h-4 w-4" />
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">
                  Signed in as {googleUser.email}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setGoogleUser(null)}
                className="text-[11px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors underline"
              >
                Switch Account
              </button>
            </div>

            {discoveredProperties.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-medium text-[var(--foreground)] flex items-center justify-between">
                  <span>Discovered GA4 Properties</span>
                  <span className="text-[10px] text-emerald-500 font-mono">
                    {discoveredProperties.length} available
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={propertyId}
                    onChange={(e) => handleSelectDiscoveredProperty(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 pr-8 text-xs text-[var(--foreground)] focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    {discoveredProperties.map((p) => (
                      <option key={p.propertyId} value={p.propertyId}>
                        {p.displayName} (ID: {p.propertyId})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 pointer-events-none text-[var(--muted-foreground)]" />
                </div>
              </div>
            )}
          </div>
        )}

        {authNotice && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-[11px] text-blue-400">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>{authNotice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {statusText && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-400 animate-pulse">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              <span>{statusText}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground)]">
                Site Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Daraj Media Main Site"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground)]">
                Website URL
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://daraj.media"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--foreground)]">
              GA4 Property ID
            </label>
            <input
              type="text"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              placeholder="e.g. 314159265"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono text-xs"
              required
            />
          </div>

          {/* Alternative Connection Modes */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-medium text-[var(--muted-foreground)]">
              Other Options
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleFillDemo}
                className={`flex flex-col items-start gap-1 rounded-lg border p-2 text-left transition-all ${
                  credentialsType === "demo_sandbox"
                    ? "border-blue-500 bg-blue-500/10 text-[var(--foreground)] ring-1 ring-blue-500"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--border-hover)]"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Sparkles className="h-3 w-3 text-blue-400" />
                  <span>Demo Sandbox</span>
                </div>
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  Load pre-filled civil society dataset
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCredentialsType("service_account");
                  setGoogleUser(null);
                }}
                className={`flex flex-col items-start gap-1 rounded-lg border p-2 text-left transition-all ${
                  credentialsType === "service_account"
                    ? "border-blue-500 bg-blue-500/10 text-[var(--foreground)] ring-1 ring-blue-500"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--border-hover)]"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Shield className="h-3 w-3 text-emerald-400" />
                  <span>Service Account</span>
                </div>
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  Google Cloud robot email key
                </span>
              </button>
            </div>
          </div>

          {credentialsType === "service_account" && (
            <div className="space-y-1.5 animate-in fade-in">
              <label className="text-xs font-medium text-[var(--foreground)]">
                Service Account Email
              </label>
              <input
                type="email"
                value={serviceAccountEmail}
                onChange={(e) => setServiceAccountEmail(e.target.value)}
                placeholder="ga4-reader@project.iam.gserviceaccount.com"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] font-mono text-xs"
              />
              <p className="text-[10px] text-[var(--muted-foreground)]">
                Grant &ldquo;Viewer&rdquo; permissions to this email address in your GA4 property.
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !propertyId}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Globe className="h-3.5 w-3.5" />
                  <span>Confirm & Sync Readership</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
