"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Tag,
  Plus,
  Trash2,
  X,
  Loader2,
  FileText,
} from "lucide-react";

interface TagsTabProps {
  organizationId: Id<"organizations">;
  isAdmin: boolean;
}

type TagCategory = "all" | "topic" | "format" | "audience" | "purpose" | "region" | "general";

const COLOR_PRESETS = [
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Emerald", value: "#10b981" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Indigo", value: "#6366f1" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Pink", value: "#ec4899" },
];

export function TagsTab({ organizationId, isAdmin }: TagsTabProps) {
  const tags = useQuery(api.tags.listTags, { organizationId });
  const createTag = useMutation(api.tags.createTag);
  const deleteTag = useMutation(api.tags.deleteTag);

  const [selectedCategory, setSelectedCategory] = useState<TagCategory>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Tag State
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"topic" | "format" | "audience" | "purpose" | "region" | "general">("topic");
  const [color, setColor] = useState(COLOR_PRESETS[4].value);
  const [description, setDescription] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSubmitting(true);
    try {
      await createTag({
        organizationId,
        name: name.trim(),
        category,
        color,
        description: description.trim() || undefined,
      });
      setIsAddOpen(false);
      setName("");
      setDescription("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create tag");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tagId: Id<"organizationTags">) => {
    if (!confirm("Are you sure you want to delete this taxonomy tag? Any assignments will be unlinked.")) return;
    try {
      await deleteTag({ organizationId, tagId });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete tag");
    }
  };

  const filteredTags = tags?.filter((t) => {
    if (selectedCategory === "all") return true;
    return t.category === selectedCategory;
  });

  return (
    <div className="max-w-5xl space-y-6">
      {/* Architecture Disclaimer */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-4 text-xs text-[var(--muted-foreground)]">
        <span className="font-semibold text-[var(--foreground)]">Taxonomy Architecture (Section 15):</span> Content
        and strategic initiatives support multi-dimensional classification across topics, storytelling formats,
        intended audiences, and geographic boundaries. System and organization-specific tags are preserved without
        hardcoding schema columns.
      </div>

      {/* Control Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {(["all", "topic", "format", "audience", "purpose", "region"] as TagCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 font-medium capitalize transition-colors ${
                selectedCategory === cat
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--muted)]/40 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {cat === "all" ? "All Categories" : `${cat}s`}
            </button>
          ))}
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Taxonomy Tag</span>
          </button>
        )}
      </div>

      {/* Tags Grid */}
      {tags === undefined ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : filteredTags?.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-12 text-center text-xs text-[var(--muted-foreground)]">
          No tags found in this category. Click &ldquo;Create Taxonomy Tag&rdquo; to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredTags?.map((t) => (
            <div
              key={t._id}
              className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-3 relative flex flex-col justify-between hover:border-[var(--muted-foreground)]/30 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: t.color || "#3b82f6" }}
                    />
                    <span className="font-semibold text-sm text-[var(--foreground)]">
                      {t.name}
                    </span>
                  </div>

                  <span className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-[10px] font-mono text-[var(--muted-foreground)] capitalize">
                    {t.category}
                  </span>
                </div>

                <div className="font-mono text-[11px] text-[var(--muted-foreground)] mt-1">
                  #{t.slug}
                </div>

                {t.description && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-2 line-clamp-2">
                    {t.description}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>{t.usageCount} {t.usageCount === 1 ? "output" : "outputs"}</span>
                </span>

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(t._id)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-md"
                    title="Delete tag"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Tag Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Tag className="h-4 w-4 text-[var(--accent)]" />
                <span>Create Taxonomy Tag (Section 15)</span>
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[var(--foreground)] mb-1">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Procurement Whistleblower"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--foreground)] mb-1">
                  Taxonomy Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value as
                        | "topic"
                        | "format"
                        | "audience"
                        | "purpose"
                        | "region"
                        | "general"
                    )
                  }
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-2 text-xs"
                >
                  <option value="topic">Topic / Thematic Focus</option>
                  <option value="format">Storytelling Format</option>
                  <option value="audience">Intended Audience</option>
                  <option value="purpose">Strategic Purpose</option>
                  <option value="region">Geographic Focus</option>
                  <option value="general">General Tag</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[var(--foreground)] mb-1.5">
                  Color Chip
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setColor(p.value)}
                      className={`h-6 w-6 rounded-full transition-transform ${
                        color === p.value ? "scale-125 ring-2 ring-offset-2 ring-[var(--primary)]" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: p.value }}
                      title={p.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--foreground)] mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief note on when this tag should be applied..."
                  rows={2}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Save Tag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
