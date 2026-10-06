"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/components/organization-context";
import {
  X,
  Users,
  Plus,
  Trash2,
  ExternalLink,
  Globe,
  Building2,
  Newspaper,
  Landmark,
  User,
  GraduationCap,
  Briefcase,
  Loader2,
  Check,
} from "lucide-react";
import { useState } from "react";

interface ActorRegistryModalProps {
  onClose: () => void;
}

type ActorType =
  | "institution"
  | "government"
  | "politician"
  | "media"
  | "ngo"
  | "company"
  | "community"
  | "researcher"
  | "funder"
  | "person"
  | "other";

export function ActorRegistryModal({ onClose }: ActorRegistryModalProps) {
  const { organizationId, userRole } = useOrganization();
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<ActorType>("institution");
  const [country, setCountry] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actors = useQuery(api.impact.listActors, { organizationId });
  const createActor = useMutation(api.impact.createActor);
  const deleteActor = useMutation(api.impact.deleteActor);

  const canEdit = userRole === "owner" || userRole === "admin" || userRole === "analyst";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    try {
      await createActor({
        organizationId,
        name: name.trim(),
        type,
        country: country.trim() || undefined,
        website: website.trim() || undefined,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setName("");
      setCountry("");
      setWebsite("");
      setDescription("");
      setNotes("");
      setShowAddForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create actor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (actorId: Id<"actors">) => {
    if (!confirm("Are you sure you want to remove this actor?")) return;
    try {
      await deleteActor({
        organizationId,
        actorId,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete actor");
    }
  };

  const getActorTypeIcon = (actorType: string) => {
    switch (actorType) {
      case "government":
      case "institution":
        return <Landmark className="h-4 w-4 text-blue-500" />;
      case "media":
        return <Newspaper className="h-4 w-4 text-emerald-500" />;
      case "politician":
      case "person":
        return <User className="h-4 w-4 text-purple-500" />;
      case "researcher":
        return <GraduationCap className="h-4 w-4 text-amber-500" />;
      case "company":
        return <Briefcase className="h-4 w-4 text-sky-500" />;
      default:
        return <Building2 className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--accent)]" />
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)]">
                Societal Actors & Stakeholders
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Registry of institutions, parliamentary committees, regulators, and media referenced in outcomes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action bar */}
        {canEdit && (
          <div className="flex justify-end shrink-0">
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{showAddForm ? "Cancel" : "Add Actor"}</span>
            </button>
          </div>
        )}

        {/* Add Actor Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreate}
            className="p-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 space-y-3 shrink-0"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                  Actor / Institution Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Public Accounts Committee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                  Actor Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ActorType)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                >
                  <option value="institution">Institutional Body / Committee</option>
                  <option value="government">Government Ministry / Department</option>
                  <option value="politician">Elected Official / Politician</option>
                  <option value="media">Media Outlet / Publisher</option>
                  <option value="ngo">Civil Society / NGO Partner</option>
                  <option value="company">Corporation / Industry Entity</option>
                  <option value="researcher">Academic / Researcher</option>
                  <option value="funder">Foundation / Funder</option>
                  <option value="person">Citizen / Key Individual</option>
                  <option value="other">Other Entity</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                  Country / Jurisdiction
                </label>
                <input
                  type="text"
                  placeholder="e.g. United Kingdom"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                  Website / Official Link
                </label>
                <input
                  type="url"
                  placeholder="https://parliament.example.org"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--foreground)] mb-1">
                Description / Role
              </label>
              <input
                type="text"
                placeholder="Key mandate or relationship to organization..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Saving..." : "Save Actor"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Actors List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {actors === undefined ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
            </div>
          ) : actors.length === 0 ? (
            <div className="py-10 text-center space-y-2 border border-dashed border-[var(--border)] rounded-xl">
              <Users className="h-8 w-8 text-[var(--muted-foreground)] mx-auto opacity-50" />
              <p className="text-xs font-medium text-[var(--foreground)]">No actors registered yet</p>
              <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
                Add government agencies, parliamentary inquiries, broadcasters, and regulatory bodies your work engages with.
              </p>
            </div>
          ) : (
            actors.map((actor) => (
              <div
                key={actor._id}
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5 flex items-start justify-between gap-3 shadow-2xs hover:border-[var(--accent)] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-[var(--muted)]">
                    {getActorTypeIcon(actor.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[var(--foreground)]">{actor.name}</h4>
                      <span className="capitalize px-1.5 py-0.5 rounded-md bg-[var(--muted)] text-[10px] text-[var(--muted-foreground)]">
                        {actor.type.replace("_", " ")}
                      </span>
                      {actor.country && (
                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          • {actor.country}
                        </span>
                      )}
                    </div>

                    {actor.description && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        {actor.description}
                      </p>
                    )}

                    {actor.website && (
                      <a
                        href={actor.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline mt-1.5"
                      >
                        <Globe className="h-3 w-3" />
                        <span>{actor.website.replace(/^https?:\/\//, "")}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleDelete(actor._id)}
                    className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-rose-600 transition-colors"
                    title="Delete actor"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[var(--border)] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
