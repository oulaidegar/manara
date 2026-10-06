"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/components/organization-context";
import {
  Building2,
  Users,
  Radio,
  FileSpreadsheet,
  BookOpen,
  Shield,
  Loader2,
  UserPlus,
  Trash2,
  Save,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { CsvImporter } from "@/components/imports/csv-importer";
import { IntegrationsTab } from "@/components/settings/integrations-tab";
import { MetricDefinitionsTab } from "@/components/settings/metric-definitions-tab";
import { TagsTab } from "@/components/settings/tags-tab";

type RoleType = "owner" | "admin" | "analyst" | "contributor" | "viewer";
type OrgType =
  | "ngo"
  | "independent_media"
  | "advocacy"
  | "research"
  | "watchdog"
  | "foundation"
  | "community_organization"
  | "other";

type SettingsTab =
  | "organization"
  | "members"
  | "integrations"
  | "imports"
  | "metrics"
  | "tags"
  | "audit";

export default function SettingsPage() {
  const { organization, organizationId, userRole } = useOrganization();
  const [activeTab, setActiveTab] = useState<SettingsTab>("organization");

  // Organization Form State
  const [orgName, setOrgName] = useState(organization.name);
  const [orgType, setOrgType] = useState(organization.organizationType);
  const [country, setCountry] = useState(organization.country ?? "");
  const [timezone, setTimezone] = useState(organization.timezone ?? "UTC");
  const [website, setWebsite] = useState(organization.website ?? "");
  const [description, setDescription] = useState(organization.description ?? "");
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [orgSaveSuccess, setOrgSaveSuccess] = useState(false);

  const updateOrg = useMutation(api.organizations.mutations.update);

  // Members state & mutations
  const members = useQuery(api.organizations.members.listMembers, { organizationId });
  const auditEvents = useQuery(api.organizations.queries.listAuditEvents, { organizationId });
  const inviteMember = useMutation(api.organizations.members.inviteMember);
  const updateMemberRole = useMutation(api.organizations.members.updateMemberRole);
  const removeMember = useMutation(api.organizations.members.removeMember);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<RoleType>("viewer");
  const [inviting, setInviting] = useState(false);

  const isAdmin = userRole === "admin" || userRole === "owner";

  const handleOrgUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSavingOrg(true);
    setOrgSaveSuccess(false);
    try {
      await updateOrg({
        organizationId,
        name: orgName.trim(),
        organizationType: orgType,
        country: country.trim() || undefined,
        timezone: timezone.trim() || undefined,
        website: website.trim() || undefined,
        description: description.trim() || undefined,
      });
      setOrgSaveSuccess(true);
      setTimeout(() => setOrgSaveSuccess(false), 3000);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update organization");
    } finally {
      setIsSavingOrg(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await inviteMember({
        organizationId,
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteEmail("");
      alert("Invitation created. Invitation token logged for local development sharing.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to invite member");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberUserId: Id<"users">, newRole: RoleType) => {
    try {
      await updateMemberRole({
        organizationId,
        memberUserId,
        newRole,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update role");
    }
  };

  const handleRemoveMember = async (memberUserId: Id<"users">) => {
    if (!confirm("Are you sure you want to remove this member from the organization?")) return;
    try {
      await removeMember({
        organizationId,
        memberUserId,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to remove member");
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Settings Header */}
      <div className="border-b border-[var(--border)] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Manage organization profile, team permissions, integrations, metric definitions, and security.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-[var(--border)] gap-6 overflow-x-auto text-sm font-medium">
        <button
          onClick={() => setActiveTab("organization")}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "organization"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Organization</span>
        </button>

        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "members"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Members & Roles</span>
        </button>

        <button
          onClick={() => setActiveTab("integrations")}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "integrations"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <Radio className="h-4 w-4" />
          <span>Integrations</span>
        </button>

        <button
          onClick={() => setActiveTab("imports")}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "imports"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>CSV Imports</span>
        </button>

        <button
          onClick={() => setActiveTab("metrics")}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "metrics"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Metric Definitions</span>
        </button>

        <button
          onClick={() => setActiveTab("tags")}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "tags"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <Tag className="h-4 w-4" />
          <span>Taxonomy & Tags</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "audit"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* Tab 1: Organization Details */}
      {activeTab === "organization" && (
        <form onSubmit={handleOrgUpdate} className="max-w-2xl space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 space-y-4">
            <h3 className="text-base font-semibold text-[var(--foreground)]">Organization Profile</h3>

            <div>
              <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={!isAdmin}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                URL Identifier (Slug)
              </label>
              <input
                type="text"
                value={organization.slug}
                disabled
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm font-mono text-[var(--muted-foreground)]"
              />
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Permanent tenant identifier. Contact support to request a slug change.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Organization Type
                </label>
                <select
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value as OrgType)}
                  disabled={!isAdmin}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm disabled:opacity-60"
                >
                  <option value="ngo">NGO</option>
                  <option value="independent_media">Independent Media</option>
                  <option value="advocacy">Advocacy</option>
                  <option value="research">Research Organization</option>
                  <option value="watchdog">Watchdog</option>
                  <option value="foundation">Foundation</option>
                  <option value="community_organization">Community Organization</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United Kingdom"
                  disabled={!isAdmin}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm disabled:opacity-60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Timezone
                </label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="e.g. Europe/London"
                  disabled={!isAdmin}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.org"
                  disabled={!isAdmin}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                Public Mission / Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of your organization's mission and scope..."
                rows={3}
                disabled={!isAdmin}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm disabled:opacity-60"
              />
            </div>

            {isAdmin && (
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                {orgSaveSuccess && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Settings updated successfully</span>
                  </span>
                )}
                {!orgSaveSuccess && <div />}

                <button
                  type="submit"
                  disabled={isSavingOrg}
                  className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSavingOrg ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            )}
          </div>
        </form>
      )}

      {/* Tab 2: Members & Roles */}
      {activeTab === "members" && (
        <div className="max-w-4xl space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="text-base font-semibold text-[var(--foreground)]">Active Members</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Users with authorized access to this organization workspace.
                </p>
              </div>
            </div>

            {members === undefined ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {members.map((member) => (
                  <div key={member.membershipId} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)] text-sm font-semibold">
                        {member.user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-[var(--foreground)]">{member.user?.name || "Unknown"}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{member.user?.email || ""}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isAdmin && member.role !== "owner" ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.user._id, e.target.value as RoleType)}
                          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs font-medium"
                        >
                          {userRole === "owner" && <option value="owner">Owner</option>}
                          <option value="admin">Admin</option>
                          <option value="analyst">Analyst</option>
                          <option value="contributor">Contributor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className="text-xs px-2.5 py-1 bg-[var(--muted)] rounded-md font-medium capitalize">
                          {member.role}
                        </span>
                      )}

                      {isAdmin && member.role !== "owner" && (
                        <button
                          onClick={() => handleRemoveMember(member.user._id)}
                          className="text-[var(--destructive)] hover:bg-red-50 dark:hover:bg-red-950/40 p-1.5 rounded-md"
                          title="Remove member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invite Form */}
          {isAdmin && (
            <form onSubmit={handleInvite} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 space-y-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[var(--accent)]" />
                <span>Invite New Team Member</span>
              </h3>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="colleague@example.org"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  required
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as RoleType)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                >
                  {userRole === "owner" && <option value="owner">Owner</option>}
                  <option value="admin">Admin</option>
                  <option value="analyst">Analyst</option>
                  <option value="contributor">Contributor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                >
                  {inviting ? "Inviting..." : "Send Invite"}
                </button>
              </div>
            </form>
          )}

          {/* Role Hierarchy Matrix (Section 8) */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-5 text-xs space-y-3">
            <h4 className="font-semibold text-[var(--foreground)] uppercase tracking-wider text-[11px]">
              Radar Authorization Hierarchy (Section 8)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-[11px]">
              <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                <div className="font-bold text-[var(--foreground)]">Owner</div>
                <div className="text-[var(--muted-foreground)] mt-1">Full control, security, integrations, and deletion.</div>
              </div>
              <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                <div className="font-bold text-[var(--foreground)]">Admin</div>
                <div className="text-[var(--muted-foreground)] mt-1">Manage members, integrations, settings, and verify outcomes.</div>
              </div>
              <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                <div className="font-bold text-[var(--foreground)]">Analyst</div>
                <div className="text-[var(--muted-foreground)] mt-1">Analyze data, create initiatives, log outcomes & reports.</div>
              </div>
              <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                <div className="font-bold text-[var(--foreground)]">Contributor</div>
                <div className="text-[var(--muted-foreground)] mt-1">Create initiatives, add outcomes, attach evidence items.</div>
              </div>
              <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                <div className="font-bold text-[var(--foreground)]">Viewer</div>
                <div className="text-[var(--muted-foreground)] mt-1">Read-only access across all data and reports.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Integrations */}
      {activeTab === "integrations" && (
        <IntegrationsTab
          organizationId={organizationId}
          isAdmin={isAdmin}
          onNavigateToImports={() => setActiveTab("imports")}
        />
      )}

      {/* Tab 4: CSV Imports */}
      {activeTab === "imports" && (
        <div className="max-w-4xl">
          <CsvImporter />
        </div>
      )}

      {/* Tab 5: Metric Definitions */}
      {activeTab === "metrics" && (
        <MetricDefinitionsTab
          organizationId={organizationId}
          isAdmin={isAdmin}
        />
      )}

      {/* Tab 6: Taxonomy & Tags */}
      {activeTab === "tags" && (
        <TagsTab
          organizationId={organizationId}
          isAdmin={isAdmin}
        />
      )}

      {/* Tab 6: Audit Log */}
      {activeTab === "audit" && (
        <div className="max-w-4xl space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 space-y-4">
            <div className="pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-semibold text-[var(--foreground)]">Security & Action Audit Log</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Consequential actions (member invitations, role modifications, outcome changes) are recorded immutably per Section 49.
              </p>
            </div>

            {auditEvents === undefined ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
              </div>
            ) : auditEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--muted-foreground)]">
                No audited actions recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {auditEvents.map((event) => (
                  <div key={event._id} className="py-3 flex items-start justify-between text-xs">
                    <div>
                      <div className="font-medium text-[var(--foreground)]">
                        <span className="font-mono font-semibold">{event.action}</span> on <span className="capitalize">{event.entityType}</span>
                      </div>
                      <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                        Actor: {event.actorName} ({event.actorEmail})
                      </div>
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)] font-mono">
                      {new Date(event.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
