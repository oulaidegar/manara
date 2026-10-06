"use client";

import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, Plus, ArrowRight, Loader2 } from "lucide-react";

export default function SelectOrgPage() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { isAuthenticated, isLoading: isConvexAuthLoading } = useConvexAuth();
  const router = useRouter();

  // Sync user to Convex
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const [userSynced, setUserSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

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

  const organizations = useQuery(
    api.organizations.queries.listUserOrganizations,
    userSynced ? {} : "skip"
  );

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [orgType, setOrgType] = useState<string>("ngo");
  const [creating, setCreating] = useState(false);

  const createOrg = useMutation(api.organizations.mutations.create);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setCreating(true);
    try {
      await createOrg({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        organizationType: orgType as "ngo",
      });
      // Refresh orgs list, then navigate
      setShowCreate(false);
      setName("");
      setSlug("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  if (syncError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/20">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Account Synchronization Error</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{syncError}</p>
          <button
            onClick={() => {
              setSyncError(null);
              setUserSynced(false);
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!isClerkLoaded || isConvexAuthLoading || !userSynced) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  // If user has exactly one org, redirect
  if (organizations && organizations.length === 1 && !showCreate) {
    router.push(`/${organizations[0].slug}`);
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome to Radar</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            {organizations && organizations.length > 0
              ? "Select an organization or create a new one"
              : "Create your first organization to get started"}
          </p>
        </div>

        {/* Existing organizations */}
        {organizations && organizations.length > 0 && (
          <div className="space-y-2">
            {organizations.map((org) => (
              <button
                key={org._id}
                onClick={() => router.push(`/${org.slug}`)}
                className="flex w-full items-center justify-between rounded-lg border border-[var(--border)] p-4 text-left hover:bg-[var(--muted)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-[var(--muted-foreground)]" />
                  <div>
                    <div className="font-medium">{org.name}</div>
                    <div className="text-sm text-[var(--muted-foreground)]">
                      /{org.slug}
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)]" />
              </button>
            ))}
          </div>
        )}

        {/* Create org form */}
        {showCreate ? (
          <form onSubmit={handleCreate} className="space-y-4 rounded-lg border border-[var(--border)] p-6">
            <h2 className="text-lg font-semibold">Create organization</h2>

            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug || slug === generateSlug(name)) {
                    setSlug(generateSlug(e.target.value));
                  }
                }}
                placeholder="My Organization"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">URL slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                placeholder="my-organization"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                required
              />
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                radar.app/{slug || "..."}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                <option value="ngo">NGO</option>
                <option value="independent_media">Independent Media</option>
                <option value="advocacy">Advocacy</option>
                <option value="research">Research</option>
                <option value="watchdog">Watchdog</option>
                <option value="foundation">Foundation</option>
                <option value="community_organization">Community Organization</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create new organization
          </button>
        )}
      </div>
    </div>
  );
}
