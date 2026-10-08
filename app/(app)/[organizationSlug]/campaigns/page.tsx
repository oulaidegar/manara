"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/components/organization-context";
import {
  Target,
  Plus,
  Calendar,
  X,
  ChevronRight,
} from "lucide-react";

export default function CampaignsPage() {
  const { organization } = useOrganization();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"planning" | "active" | "completed">("active");

  const campaigns = useQuery(api.campaigns.listCampaigns, {
    organizationId: organization._id,
  });

  const createCampaign = useMutation(api.campaigns.createCampaign);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createCampaign({
      organizationId: organization._id,
      name: name.trim(),
      description: description.trim() || undefined,
      status,
      startDate: Date.now(),
    });

    setName("");
    setDescription("");
    setIsCreateOpen(false);
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Campaigns
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Connect content across platforms to thematic campaigns and track aggregate public interest reach and actions.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-3.5 py-2 text-xs font-medium text-[var(--primary-foreground)] shadow-xs hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      {campaigns === undefined ? (
        <div className="flex h-64 items-center justify-center text-xs text-[var(--muted-foreground)]">
          Loading campaigns portfolio...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] mb-3">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-[var(--foreground)]">No campaigns created</h3>
          <p className="mt-1 max-w-sm text-xs text-[var(--muted-foreground)]">
            Group your social content into thematic campaigns to monitor cross-platform communications momentum.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-medium text-[var(--primary-foreground)] shadow-xs hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((camp) => (
            <Link
              key={camp._id}
              href={`/${organization.slug}/campaigns/${camp._id}`}
              className="group flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xs transition-all hover:border-[var(--primary)]/50 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      camp.status === "active"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : camp.status === "planning"
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-gray-500/10 text-gray-500"
                    }`}
                  >
                    {camp.status}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(camp.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors mb-1">
                    {camp.name}
                  </h3>
                  <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mb-4">
                  {camp.description || "No description provided."}
                </p>
              </div>

              {/* Aggregated Analytics (Section 36) */}
              <div className="border-t border-[var(--border)] pt-3 space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">Posts</div>
                    <div className="font-semibold font-mono text-[var(--foreground)]">
                      {camp.postCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">Total Views</div>
                    <div className="font-semibold font-mono text-[var(--foreground)]">
                      {formatNumber(camp.totalViews)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-500">Shares</div>
                    <div className="font-semibold font-mono text-emerald-500">
                      {formatNumber(camp.totalShares)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] pt-1">
                  <span>Avg. Engagement:</span>
                  <span className="font-semibold font-mono text-[var(--foreground)]">
                    {(camp.avgEngagementRate * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-2xl">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute right-4 top-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-1">
              Create New Campaign
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">
              Organize related investigations, explainers, and calls-to-action under a shared strategic campaign.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Housing Affordability Inquiry"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-hidden"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Description & Strategic Intent
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe campaign goals, target institutional reforms, or audience mobilization goals."
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-hidden h-24"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "planning" | "active" | "completed")}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-sm text-[var(--foreground)] focus:outline-hidden"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-medium text-[var(--primary-foreground)] shadow-xs hover:opacity-90"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
