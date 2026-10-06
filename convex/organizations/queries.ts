import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOrganizationMember } from "../lib/auth";
import { NotFoundError } from "../lib/errors";

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) return null;

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!org) return null;

    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", org._id).eq("userId", user._id)
      )
      .unique();
    if (!membership) return null;

    return {
      organization: org,
      membership,
    };
  },
});

export const listUserOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const organizations = await Promise.all(
      memberships.map(async (m) => {
        const org = await ctx.db.get(m.organizationId);
        return org;
      })
    );

    return organizations.filter((org) => org !== null);
  },
});

export const getOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);
    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new NotFoundError("Organization", args.organizationId);
    }
    return org;
  },
});

export const listAuditEvents = query({
  args: { organizationId: v.id("organizations"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);
    const limit = args.limit ?? 50;
    const events = await ctx.db
      .query("auditEvents")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .take(limit);

    const enriched = await Promise.all(
      events.map(async (ev) => {
        const actor = await ctx.db.get(ev.actorUserId);
        return {
          ...ev,
          actorName: actor?.name ?? "System",
          actorEmail: actor?.email ?? "",
        };
      })
    );

    return enriched;
  },
});

