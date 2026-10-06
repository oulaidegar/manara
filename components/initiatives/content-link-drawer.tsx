"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  X,
  Plus,
  Loader2,
  Search,
} from "lucide-react";
import { useState, useMemo } from "react";

interface ContentLinkDrawerProps {
  organizationId: Id<"organizations">;
  initiativeId: Id<"initiatives">;
  initiativeName: string;
  onClose: () => void;
}

export function ContentLinkDrawer({
  organizationId,
  initiativeId,
  initiativeName,
  onClose,
}: ContentLinkDrawerProps) {
  const [search, setSearch] = useState("");
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const availableContent = useQuery(
    api.initiatives.listAvailableContentForInitiative,
    { organizationId, initiativeId }
  );

  const linkContent = useMutation(api.initiatives.linkContent);

  const filteredContent = useMemo(() => {
    if (!availableContent) return [];
    if (!search.trim()) return availableContent;
    const q = search.toLowerCase().trim();
    return availableContent.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.provider.toLowerCase().includes(q) ||
        c.contentType.toLowerCase().includes(q)
    );
  }, [availableContent, search]);

  const handleLink = async (contentItemId: Id<"contentItems">) => {
    setLinkingId(contentItemId);
    try {
      await linkContent({
        organizationId,
        initiativeId,
        contentItemId,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to link content item");
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[var(--background)] border-l border-[var(--border)] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              Assign Communications Output
            </div>
            <h3 className="text-base font-bold text-[var(--foreground)] mt-0.5">
              Link Content to &quot;{initiativeName}&quot;
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Select published investigative outputs, reports, or social assets to associate with this initiative.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]/20">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search available content outputs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-8 pr-3 py-1.5 text-xs text-[var(--foreground)]"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {availableContent === undefined ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--muted-foreground)] space-y-1">
              <div>No unlinked content items found.</div>
              <div className="text-[11px]">All available content may already be attached to this initiative.</div>
            </div>
          ) : (
            filteredContent.map((item) => (
              <div
                key={item._id}
                className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--accent)]/50 transition-all flex items-start justify-between gap-3"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--muted)] capitalize">
                      {item.provider}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)] capitalize">
                      {item.contentType.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-[var(--foreground)] line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
                  {item.metrics && (
                    <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--muted-foreground)] pt-0.5">
                      <span>{(item.metrics.impressions ?? 0).toLocaleString()} impr</span>
                      <span>·</span>
                      <span>{(item.metrics.shares ?? 0).toLocaleString()} shares</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleLink(item._id)}
                  disabled={linkingId === item._id}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {linkingId === item._id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                  <span>Link</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--background)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs font-medium hover:bg-[var(--muted)] text-[var(--foreground)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
