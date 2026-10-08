"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/components/organization-context";
import { PlatformIcon } from "@/components/social/platform-icon";
import { PieiBadge } from "@/components/social/insight-pill";
import {
  Sparkles,
  Link2,
  CheckCircle2,
  X,
  Loader2,
  Layers,
} from "lucide-react";

interface CampaignAutoSuggestBannerProps {
  campaignId?: string;
  organizationSlug: string;
}

export function CampaignAutoSuggestBanner({
  campaignId,
  organizationSlug,
}: CampaignAutoSuggestBannerProps) {
  const { organization } = useOrganization();
  const [dismissedCampaignIds, setDismissedCampaignIds] = useState<string[]>([]);
  const [linkingCampaignId, setLinkingCampaignId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const suggestions = useQuery(
    api.campaigns.getCampaignAutoSuggestions,
    organization
      ? {
          organizationId: organization._id,
          campaignId: campaignId ? (campaignId as Id<"campaigns">) : undefined,
        }
      : "skip"
  );

  const batchLink = useMutation(api.campaigns.batchLinkPostsToCampaign);

  if (!organization || !suggestions || suggestions.length === 0) {
    return null;
  }

  const activeSuggestions = suggestions.filter(
    (s) => !dismissedCampaignIds.includes(s.campaignId)
  );

  if (activeSuggestions.length === 0) {
    return null;
  }

  const handleLinkAll = async (
    targetCampaignId: Id<"campaigns">,
    postIds: Id<"socialPosts">[],
    campaignName: string
  ) => {
    try {
      setLinkingCampaignId(targetCampaignId);
      const res = await batchLink({
        organizationId: organization._id,
        campaignId: targetCampaignId,
        postIds,
        associationType: "ai_suggested",
      });

      setSuccessMessage(`Successfully linked ${res.linkedCount} posts to "${campaignName}"!`);
      setDismissedCampaignIds((prev) => [...prev, targetCampaignId]);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Failed to batch link posts to campaign", err);
    } finally {
      setLinkingCampaignId(null);
    }
  };

  const handleDismiss = (targetCampaignId: string) => {
    setDismissedCampaignIds((prev) => [...prev, targetCampaignId]);
  };

  return (
    <div className="space-y-3 mb-6">
      {successMessage && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {activeSuggestions.map((group) => {
        const isLinking = linkingCampaignId === group.campaignId;

        return (
          <div
            key={group.campaignId}
            className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-indigo-500/10 p-5 shadow-sm transition-all dark:border-emerald-500/20"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-emerald-600 text-white shadow-xs">
                    <Sparkles className="w-3 h-3" />
                    Smart Campaign Auto-Suggestion
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {Math.round(group.confidence * 100)}% Match
                  </span>
                  {!campaignId && (
                    <Link
                      href={`/${organizationSlug}/campaigns/${group.campaignId}`}
                      className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Layers className="w-3 h-3" />
                      {group.campaignName}
                    </Link>
                  )}
                </div>

                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">
                  We noticed{" "}
                  <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    {group.posts.length} recent posts
                  </strong>{" "}
                  covering {group.matchedReason}. Would you like to link them to{" "}
                  <strong className="font-semibold text-slate-900 dark:text-white">
                    {group.campaignName}
                  </strong>
                  ?
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    handleLinkAll(
                      group.campaignId,
                      group.posts.map((p) => p._id),
                      group.campaignName
                    )
                  }
                  disabled={isLinking}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isLinking ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3.5 h-3.5" />
                      Link {group.posts.length} {group.posts.length === 1 ? "Post" : "Posts"}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDismiss(group.campaignId)}
                  className="inline-flex items-center justify-center p-2 rounded-xl text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  title="Dismiss suggestion"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Post Preview Chips */}
            <div className="mt-4 pt-3 border-t border-emerald-500/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {group.posts.slice(0, 3).map((post) => (
                <div
                  key={post._id}
                  className="flex items-center justify-between gap-2.5 p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <PlatformIcon platform={post.platform} className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                      {post.title || post.caption || "Untitled post"}
                    </span>
                  </div>
                  {post.pieiScore !== undefined && (
                    <PieiBadge score={post.pieiScore} size="sm" showFormulaTooltip={false} />
                  )}
                </div>
              ))}
              {group.posts.length > 3 && (
                <div className="flex items-center justify-center p-2 rounded-lg bg-white/40 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/40 text-xs text-slate-500 font-medium">
                  +{group.posts.length - 3} more candidate posts
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
