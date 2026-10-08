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
} from "lucide-react";

interface GA4ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function GA4ConnectModal({
  isOpen,
  onClose,
  onSuccess,
}: GA4ConnectModalProps) {
  const { organization } = useOrganization();
  const [propertyId, setPropertyId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [credentialsType, setCredentialsType] = useState<"demo_sandbox" | "service_account">("demo_sandbox");
  const [serviceAccountEmail, setServiceAccountEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);

  const connectGA4 = useMutation(api.ga4.connectGA4Property);

  if (!isOpen) return null;

  const handleFillDemo = () => {
    setPropertyId("314159265");
    setDisplayName("Daraj Media Investigative Desk");
    setWebsiteUrl("https://daraj.media");
    setCredentialsType("demo_sandbox");
    setServiceAccountEmail("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId.trim()) {
      setError("Please enter a Google Analytics 4 Property ID");
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
                Connect Google Analytics 4 (GA4)
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Close the attribution loop: social reach to investigative web readership & document downloads
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

        {/* 1-Click Demo Preload Banner */}
        <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Instant Demo: Daraj Media Civil Society Dataset</span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                Preloads 3 investigative dossiers with real social-to-web attribution bridges, deep attention dwell times (3m 48s), and leaked PDF downloads.
              </p>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition-colors shadow-xs"
            >
              1-Click Fill
            </button>
          </div>
        </div>

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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--foreground)]">
              GA4 Property ID
            </label>
            <input
              type="text"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              placeholder="e.g. 314159265"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
              required
            />
            <p className="text-[10px] text-[var(--muted-foreground)]">
              Found under GA4 Admin &gt; Property Settings &gt; Property Details.
            </p>
          </div>

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
              Connection Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCredentialsType("demo_sandbox")}
                className={`flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all ${
                  credentialsType === "demo_sandbox"
                    ? "border-blue-500 bg-blue-500/10 text-[var(--foreground)] ring-1 ring-blue-500"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--border-hover)]"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  <span>Demo Sandbox</span>
                </div>
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  Immediate data without Google Cloud keys
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCredentialsType("service_account")}
                className={`flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all ${
                  credentialsType === "service_account"
                    ? "border-blue-500 bg-blue-500/10 text-[var(--foreground)] ring-1 ring-blue-500"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--border-hover)]"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Google Cloud Key</span>
                </div>
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  Live RunReport Data API queries
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
              disabled={isLoading}
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
                  <span>Connect GA4 Property</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
