import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOrganizationRole } from "../lib/auth";
import { ValidationError, NotFoundError } from "../lib/errors";

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    organizationType: v.union(
      v.literal("ngo"),
      v.literal("independent_media"),
      v.literal("advocacy"),
      v.literal("research"),
      v.literal("watchdog"),
      v.literal("foundation"),
      v.literal("community_organization"),
      v.literal("other")
    ),
    country: v.optional(v.string()),
    timezone: v.optional(v.string()),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Validate slug (lowercase, alphanumeric + hyphens)
    if (!/^[a-z0-9-]+$/.test(args.slug)) {
      throw new ValidationError("Slug must be lowercase alphanumeric and hyphens only");
    }

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      throw new ValidationError("Organization with this slug already exists");
    }

    const organizationId = await ctx.db.insert("organizations", {
      ...args,
      onboardingStatus: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("memberships", {
      organizationId,
      userId: user._id,
      role: "owner",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return organizationId;
  },
});

export const update = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    organizationType: v.optional(
      v.union(
        v.literal("ngo"),
        v.literal("independent_media"),
        v.literal("advocacy"),
        v.literal("research"),
        v.literal("watchdog"),
        v.literal("foundation"),
        v.literal("community_organization"),
        v.literal("other")
      )
    ),
    country: v.optional(v.string()),
    timezone: v.optional(v.string()),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
    onboardingStatus: v.optional(
      v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"))
    ),
  },
  handler: async (ctx, args) => {
    const { organizationId, ...updates } = args;
    await requireOrganizationRole(ctx, organizationId, ["owner", "admin"]);

    const org = await ctx.db.get(organizationId);
    if (!org) {
      throw new NotFoundError("Organization");
    }

    if (updates.slug && updates.slug !== org.slug) {
      if (!/^[a-z0-9-]+$/.test(updates.slug)) {
        throw new ValidationError("Slug must be lowercase alphanumeric and hyphens only");
      }

      const existing = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", updates.slug as string))
        .unique();

      if (existing) {
        throw new ValidationError("Organization with this slug already exists");
      }
    }

    await ctx.db.patch(organizationId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return organizationId;
  },
});
