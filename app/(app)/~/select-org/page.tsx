"use client";

import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Building2,
  Plus,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Terminal,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function SelectOrgPage() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { isAuthenticated, isLoading: isConvexAuthLoading } = useConvexAuth();
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Sync user to Convex
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const [userSynced, setUserSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [connectionTimedOut, setConnectionTimedOut] = useState(false);

  // Quick slug jump
  const [jumpSlug, setJumpSlug] = useState("");

  // Timeout guard: if sync/auth takes longer than 3.5s, reveal connection diagnostics
  useEffect(() => {
    const timer = setTimeout(() => {
      setConnectionTimedOut(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Redirect to sign-in if Clerk has loaded and user is unauthenticated
  useEffect(() => {
    if (isClerkLoaded && !clerkUser) {
      router.push("/sign-in");
    }
  }, [isClerkLoaded, clerkUser, router]);

  // Sync user when authenticated
  useEffect(() => {
    if (isClerkLoaded && clerkUser && isAuthenticated && !userSynced) {
      getOrCreateUser({
        clerkUserId: clerkUser.id,
        name: clerkUser.fullName ?? clerkUser.firstName ?? "User",
        email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
        avatarUrl: clerkUser.imageUrl ?? undefined,
      })
        .then(() => {
          setUserSynced(true);
          setSyncError(null);
        })
        .catch((err) => {
          console.error("Failed to sync user to Convex:", err);
          setSyncError(err instanceof Error ? err.message : "Authentication error");
        });
    }
  }, [isClerkLoaded, clerkUser, isAuthenticated, userSynced, getOrCreateUser]);

  // Query organizations once authenticated or synced
  const organizations = useQuery(
    api.organizations.queries.listUserOrganizations,
    isAuthenticated ? {} : "skip"
  );

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [orgType, setOrgType] = useState<string>("ngo");
  const [creating, setCreating] = useState(false);

  const createOrg = useMutation(api.organizations.mutations.create);
  const bootstrapAll = useMutation(api.seed.bootstrapAll);
  const [bootstrapping, setBootstrapping] = useState(false);

  const handleBootstrap = async () => {
    if (!clerkUser) return;
    setBootstrapping(true);
    try {
      await bootstrapAll({
        clerkUserId: clerkUser.id,
        userEmail: clerkUser.primaryEmailAddress?.emailAddress,
        userName: clerkUser.fullName ?? clerkUser.firstName ?? "User",
      });
      startTransition(() => {
        router.push("/daraj-media");
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to bootstrap workspace");
      setBootstrapping(false);
    }
  };

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanSlug = slug.trim().toLowerCase();
    if (!cleanName || !cleanSlug) return;

    setCreating(true);
    try {
      await createOrg({
        name: cleanName,
        slug: cleanSlug,
        organizationType: orgType as
          | "ngo"
          | "independent_media"
          | "advocacy"
          | "research"
          | "watchdog"
          | "foundation"
          | "community_organization"
          | "other",
      });
      // Direct navigation to the created workspace
      startTransition(() => {
        router.push(`/${cleanSlug}`);
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create organization");
      setCreating(false);
    }
  };

  // If user has exactly one org, redirect automatically to their workspace
  useEffect(() => {
    if (organizations && organizations.length === 1 && !showCreate) {
      router.push(`/${organizations[0].slug}`);
    }
  }, [organizations, showCreate, router]);

  // 1. Clerk session still initializing
  if (!isClerkLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
          <p className="text-sm text-[var(--muted-foreground)]">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // 2. User is not signed in
  if (!clerkUser) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
          <p className="text-sm text-[var(--muted-foreground)]">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // 3. Explicit sync error occurred
  if (syncError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-[var(--background)]">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50/50 p-6 text-center shadow-xs dark:border-red-900/50 dark:bg-red-950/20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-red-900 dark:text-red-200">
            Account Synchronization Error
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{syncError}</p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => {
                setSyncError(null);
                setUserSynced(false);
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Connection
            </button>
            <button
              onClick={() => router.push("/")}
              className="inline-flex w-full items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Loading state with connection timeout diagnostic
  const isStillConnecting = isConvexAuthLoading || (!userSynced && !isAuthenticated);

  if (isStillConnecting) {
    if (connectionTimedOut) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6 bg-[var(--background)]">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Connecting to Database Backend
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Signed in as {clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.fullName}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 p-4 text-xs text-[var(--muted-foreground)] leading-relaxed">
              <p className="font-medium text-[var(--foreground)]">Local Backend Notice:</p>
              <p>
                Radar is configured to connect to Convex at{" "}
                <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-[var(--foreground)]">
                  {process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210"}
                </code>
                .
              </p>
              <div className="flex items-center gap-2 font-mono rounded bg-black/90 p-2 text-emerald-400 dark:bg-black">
                <Terminal className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>npx convex dev</span>
              </div>
              <p>
                If running locally, ensure the Convex development server is running in a terminal alongside Next.js.
              </p>
            </div>

            {/* Direct workspace jump */}
            <div className="mt-6 pt-6 border-t border-[var(--border)]">
              <label className="block text-xs font-medium text-[var(--foreground)] mb-2">
                Already know your workspace slug? Jump directly:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. civic-watchdog"
                  value={jumpSlug}
                  onChange={(e) => setJumpSlug(generateSlug(e.target.value))}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <button
                  type="button"
                  disabled={!jumpSlug.trim()}
                  onClick={() => router.push(`/${jumpSlug.trim()}`)}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  Open
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setConnectionTimedOut(false);
                  setUserSynced(false);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Connection
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                Create Workspace
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
          <p className="text-sm text-[var(--muted-foreground)]">Connecting to workspace...</p>
        </div>
      </div>
    );
  }

  // 5. Main organization selection & creation view
  return (
    <div className="flex min-h-screen items-center justify-center p-6 sm:p-8 bg-[var(--background)]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Welcome to Radar
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {organizations && organizations.length > 0
              ? "Select an organization to open your workspace"
              : "Create your organization workspace to get started"}
          </p>
        </div>

        {/* Existing organizations */}
        {organizations && organizations.length > 0 && !showCreate && (
          <div className="space-y-2.5">
            {organizations.map((org) => (
              <button
                key={org._id}
                onClick={() => router.push(`/${org.slug}`)}
                className="group flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-left hover:border-[var(--accent)] hover:shadow-xs transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] group-hover:bg-[var(--accent)]/10 group-hover:text-[var(--accent)] transition-colors">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-[var(--foreground)]">{org.name}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      radar.app/{org.slug}
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        )}

        {/* Create org form */}
        {showCreate ? (
          <form
            onSubmit={handleCreate}
            className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xs"
          >
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Create organization
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Set up a new workspace for your NGO or media organization
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
                Organization Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug || slug === generateSlug(name)) {
                    setSlug(generateSlug(e.target.value));
                  }
                }}
                placeholder="e.g. Civic Accountability Institute"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
                Workspace URL slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                placeholder="civic-accountability"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                required
              />
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Access URL: radar.app/{slug || "workspace-slug"}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
                Organization Type
              </label>
              <select
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="ngo">NGO / Non-Profit</option>
                <option value="independent_media">Independent Media</option>
                <option value="advocacy">Advocacy Group</option>
                <option value="research">Research / Think Tank</option>
                <option value="watchdog">Civic Watchdog</option>
                <option value="foundation">Philanthropic Foundation</option>
                <option value="community_organization">Community Organization</option>
                <option value="other">Other Public-Interest Entity</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating workspace...
                  </>
                ) : (
                  "Create and Open"
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] p-4 text-sm font-medium text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-all"
          >
            <Plus className="h-4 w-4" />
            Create new organization
          </button>
        )}

        {/* One-click demo workspace setup */}
        {!showCreate && (!organizations || organizations.length === 0) && (
          <button
            onClick={handleBootstrap}
            disabled={bootstrapping}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-3.5 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
          >
            {bootstrapping ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Setting up Daraj Media & tables...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Seed Demo Organization (Daraj Media)
              </>
            )}
          </button>
        )}

        {/* Quick jump fallback if user knows their slug */}
        {!showCreate && (
          <div className="pt-2 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
              <span>Have an existing workspace link?</span>
              <button
                type="button"
                onClick={() => {
                  const s = prompt("Enter organization slug (e.g. civic-watchdog):");
                  if (s) router.push(`/${s.trim().toLowerCase()}`);
                }}
                className="inline-flex items-center gap-0.5 text-[var(--accent)] hover:underline font-medium"
              >
                Enter slug
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
