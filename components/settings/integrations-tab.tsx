"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Play,
  Settings2,
  X,
  Loader2,
  Share2,
  Video,
} from "lucide-react";

function YoutubeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function LinkedinIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.53 1.53 0 1 0 0-3.06 1.53 1.53 0 0 0 0 3.06m1.39 9.74v-8.37H5.07v8.37h2.78z" />
    </svg>
  );
}

interface IntegrationsTabProps {
  organizationId: Id<"organizations">;
  isAdmin: boolean;
  onNavigateToImports: () => void;
}

export function IntegrationsTab({
  organizationId,
  isAdmin,
  onNavigateToImports,
}: IntegrationsTabProps) {
  const accounts = useQuery(api.connectors.accounts.listAccounts, { organizationId });
  const syncRuns = useQuery(api.connectors.sync.listSyncRuns, { organizationId, limit: 10 });
  const connectAccount = useMutation(api.connectors.accounts.connectAccount);
  const disconnectAccount = useMutation(api.connectors.accounts.disconnectAccount);
  const runSync = useMutation(api.connectors.sync.runAccountSync);

  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Connect Dialog State
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"youtube" | "linkedin" | "meta" | "tiktok">("youtube");
  const [connectName, setConnectName] = useState("");
  const [connectHandle, setConnectHandle] = useState("");
  const [connectExternalId, setConnectExternalId] = useState("");
  const [connectApiKey, setConnectApiKey] = useState("");
  const [connecting, setConnecting] = useState(false);

  const handleOpenConnect = (provider: "youtube" | "linkedin" | "meta" | "tiktok") => {
    setSelectedProvider(provider);
    if (provider === "youtube") {
      setConnectName("Public Interest Watch");
      setConnectHandle("@publicinterestwatch");
      setConnectExternalId("UC_civic_watch_01");
    } else if (provider === "linkedin") {
      setConnectName("Public Interest Watchdog Organization");
      setConnectHandle("public-interest-watch");
      setConnectExternalId("urn:li:organization:12345678");
    } else if (provider === "meta") {
      setConnectName("Public Interest Watch Meta");
      setConnectHandle("@public_interest_watch");
      setConnectExternalId("meta_page_98765");
    } else {
      setConnectName("Public Interest Watch TikTok");
      setConnectHandle("@public_interest_watch");
      setConnectExternalId("tiktok_creator_54321");
    }
    setConnectApiKey("");
    setIsConnectOpen(true);
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setConnecting(true);
    try {
      await connectAccount({
        organizationId,
        provider: selectedProvider,
        externalAccountId: connectExternalId.trim(),
        name: connectName.trim(),
        handle: connectHandle.trim(),
        accountType: selectedProvider === "youtube" ? "channel" : "organization",
      });
      setIsConnectOpen(false);
      setSyncMessage(`Connected ${selectedProvider.toUpperCase()} successfully.`);
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to connect account");
    } finally {
      setConnecting(false);
    }
  };

  const handleTriggerSync = async (accountId: Id<"socialAccounts">) => {
    if (!isAdmin) return;
    setSyncingAccountId(accountId);
    try {
      const res = await runSync({
        organizationId,
        accountId,
        syncType: "manual",
      });
      if (res.status === "success") {
        setSyncMessage(`Sync completed: ${res.recordsCreated} new outputs imported, ${res.recordsUpdated} updated.`);
      } else {
        setSyncMessage(`Sync encountered an issue: ${res.errorMessage}`);
      }
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to run sync");
    } finally {
      setSyncingAccountId(null);
    }
  };

  const handleDisconnect = async (accountId: Id<"socialAccounts">) => {
    if (!confirm("Are you sure you want to disconnect this platform integration?")) return;
    try {
      await disconnectAccount({ organizationId, accountId });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to disconnect account");
    }
  };

  const getAccountForProvider = (provider: string) => {
    return accounts?.find((a) => a.provider === provider && a.active);
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Architecture Disclaimer */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-4 text-xs text-[var(--muted-foreground)]">
        <span className="font-semibold text-[var(--foreground)]">Architecture Note (Section 22 & 23):</span>{" "}
        Radar treats platforms as data sources, not primary organizational units. External tokens and credentials are
        handled with strict tenant isolation. Ingestion normalizes diverse metrics into canonical structures.
      </div>

      {syncMessage && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Grid of Platform Connectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Connector 1: YouTube (Priority #1 per Section 23) */}
        {(() => {
          const yt = getAccountForProvider("youtube");
          const isSyncing = yt && syncingAccountId === yt._id;
          return (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 space-y-4 relative flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600">
                      <YoutubeIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[var(--foreground)]">YouTube Channel</div>
                      <div className="text-xs text-[var(--muted-foreground)]">Priority Connector #1</div>
                    </div>
                  </div>
                  {yt ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Connected</span>
                    </span>
                  ) : (
                    <span className="rounded-full bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-300">
                      Ready to Connect
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
                  Sync videos, watch time seconds, view counts, and video engagement to track long-form investigation reach.
                </p>

                {yt && (
                  <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-3 text-xs space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-[var(--foreground)]">{yt.name}</span>
                      <span className="font-mono text-[var(--muted-foreground)]">{yt.handle}</span>
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)] font-mono">
                      ID: {yt.externalAccountId}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center gap-2">
                {yt ? (
                  <>
                    <button
                      onClick={() => handleTriggerSync(yt._id)}
                      disabled={isSyncing || !isAdmin}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)] py-2 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                    >
                      {isSyncing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Syncing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          <span>Sync Now</span>
                        </>
                      )}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDisconnect(yt._id)}
                        className="rounded-lg border border-[var(--border)] p-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-red-600 hover:border-red-300 transition-colors"
                        title="Disconnect YouTube"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => handleOpenConnect("youtube")}
                    disabled={!isAdmin}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)] py-2 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Configure YouTube Connector</span>
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Connector 2: LinkedIn (Professional Updates) */}
        {(() => {
          const li = getAccountForProvider("linkedin");
          const isSyncing = li && syncingAccountId === li._id;
          return (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 space-y-4 relative flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600">
                      <LinkedinIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[var(--foreground)]">LinkedIn Page</div>
                      <div className="text-xs text-[var(--muted-foreground)]">Priority Connector #2</div>
                    </div>
                  </div>
                  {li ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Connected</span>
                    </span>
                  ) : (
                    <span className="rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--muted-foreground)]">
                      Ready to Connect
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
                  Sync organization posts, impressions, shares, and policymaker interactions to analyze institutional attention.
                </p>

                {li && (
                  <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-3 text-xs space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-[var(--foreground)]">{li.name}</span>
                      <span className="font-mono text-[var(--muted-foreground)]">{li.handle}</span>
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)] font-mono">
                      ID: {li.externalAccountId}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center gap-2">
                {li ? (
                  <>
                    <button
                      onClick={() => handleTriggerSync(li._id)}
                      disabled={isSyncing || !isAdmin}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)] py-2 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                    >
                      {isSyncing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Syncing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          <span>Sync Now</span>
                        </>
                      )}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDisconnect(li._id)}
                        className="rounded-lg border border-[var(--border)] p-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-red-600 hover:border-red-300 transition-colors"
                        title="Disconnect LinkedIn"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => handleOpenConnect("linkedin")}
                    disabled={!isAdmin}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)] py-2 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Connect LinkedIn Page</span>
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Connector 3: Meta */}
        {(() => {
          const meta = getAccountForProvider("meta");
          return (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 space-y-4 relative flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600">
                      <Share2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[var(--foreground)]">Meta (Instagram & Facebook)</div>
                      <div className="text-xs text-[var(--muted-foreground)]">Social Reach</div>
                    </div>
                  </div>
                  {meta ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Connected</span>
                    </span>
                  ) : (
                    <span className="rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--muted-foreground)]">
                      Configurable
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
                  Ingest reels, carousel posts, saves, and reach metrics via Meta Graph API endpoints.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleOpenConnect("meta")}
                  disabled={!isAdmin}
                  className="w-full rounded-lg border border-[var(--border)] py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-colors disabled:opacity-50"
                >
                  {meta ? "Configure Meta" : "Set Up Meta Integration"}
                </button>
              </div>
            </div>
          );
        })()}

        {/* Connector 4: CSV File Pipeline */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 space-y-4 relative flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-[var(--foreground)]">CSV File Ingestion Engine</div>
                  <div className="text-xs text-[var(--muted-foreground)]">All Platforms & Formats</div>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                Active (Phase 4)
              </span>
            </div>

            <p className="mt-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
              Import 16 canonical metrics from TikTok, Twitter/X, Substack, podcasts, or spreadsheets with 3-tier deduplication.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onNavigateToImports}
              className="w-full rounded-lg bg-[var(--primary)] py-2 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90"
            >
              Open CSV Manager →
            </button>
          </div>
        </div>
      </div>

      {/* Sync Activity & History Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[var(--muted-foreground)]" />
              <span>Platform Synchronization History (Section 24)</span>
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Audited log of platform connector synchronization runs, error tracking, and record mutations.
            </p>
          </div>
        </div>

        {syncRuns === undefined ? (
          <div className="py-6 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : syncRuns.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--muted-foreground)]">
            No synchronization runs logged yet. Connect a channel or click &ldquo;Sync Now&rdquo; to start.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-4 font-semibold">Provider / Account</th>
                  <th className="py-2 pr-4 font-semibold">Type</th>
                  <th className="py-2 pr-4 font-semibold">Processed</th>
                  <th className="py-2 pr-4 font-semibold">New / Updated</th>
                  <th className="py-2 font-semibold">Executed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {syncRuns.map((run) => (
                  <tr key={run._id} className="hover:bg-[var(--muted)]/20 transition-colors">
                    <td className="py-2.5 pr-4">
                      {run.status === "success" && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Success</span>
                        </span>
                      )}
                      {run.status === "running" && (
                        <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium text-[11px]">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Running</span>
                        </span>
                      )}
                      {run.status === "failed" && (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium text-[11px]">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Failed</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="font-medium text-[var(--foreground)] capitalize">
                        {run.provider}
                      </div>
                      {run.accountHandle && (
                        <div className="text-[11px] text-[var(--muted-foreground)] font-mono">
                          {run.accountHandle}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 capitalize text-[var(--muted-foreground)]">
                      {run.syncType}
                    </td>
                    <td className="py-2.5 pr-4 font-mono">
                      {run.recordsProcessed}
                    </td>
                    <td className="py-2.5 pr-4 font-mono">
                      <span className="text-emerald-600 font-semibold">+{run.recordsCreated}</span>
                      <span className="text-[var(--muted-foreground)] ml-1">/ ~{run.recordsUpdated}</span>
                    </td>
                    <td className="py-2.5 font-mono text-[11px] text-[var(--muted-foreground)]">
                      {new Date(run.startedAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {isConnectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-[var(--accent)]" />
                <span>Configure {selectedProvider.toUpperCase()} Connector</span>
              </h3>
              <button
                onClick={() => setIsConnectOpen(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConnectSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[var(--foreground)] mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={connectName}
                  onChange={(e) => setConnectName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--foreground)] mb-1">
                  Public Handle
                </label>
                <input
                  type="text"
                  value={connectHandle}
                  onChange={(e) => setConnectHandle(e.target.value)}
                  placeholder="@handle"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--foreground)] mb-1">
                  External Channel / Page ID
                </label>
                <input
                  type="text"
                  value={connectExternalId}
                  onChange={(e) => setConnectExternalId(e.target.value)}
                  placeholder="e.g. UC_..."
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--foreground)] mb-1">
                  API Key / Access Token (Optional)
                </label>
                <input
                  type="password"
                  value={connectApiKey}
                  onChange={(e) => setConnectApiKey(e.target.value)}
                  placeholder="Leave blank for local demo sandbox"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-mono"
                />
                <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                  Tokens are stored encrypted server-side and never exposed to browser bundles.
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConnectOpen(false)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connecting}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                >
                  {connecting ? "Connecting..." : "Save & Activate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
