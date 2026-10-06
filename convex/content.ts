import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember, requireOrganizationRole } from "./lib/auth";

export const listContent = query({
  args: {
    organizationId: v.id("organizations"),
    initiativeId: v.optional(v.id("initiatives")),
    contentType: v.optional(v.string()),
    provider: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);
    const limit = args.limit ?? 50;

    let items;
    if (args.initiativeId) {
      const links = await ctx.db
        .query("initiativeContentLinks")
        .withIndex("by_initiative", (q) => q.eq("initiativeId", args.initiativeId!))
        .take(limit);

      items = await Promise.all(
        links.map(async (link) => {
          return await ctx.db.get(link.contentItemId);
        })
      );
      items = items.filter((item): item is NonNullable<typeof item> => item !== null);
    } else {
      items = await ctx.db
        .query("contentItems")
        .withIndex("by_organization_publishedAt", (q) => q.eq("organizationId", args.organizationId))
        .order("desc")
        .take(limit);
    }

    if (args.contentType && args.contentType !== "all") {
      items = items.filter((item) => item.contentType === args.contentType);
    }
    if (args.provider && args.provider !== "all") {
      items = items.filter((item) => item.provider === args.provider);
    }

    return items;
  },
});

export const getContentItem = query({
  args: {
    organizationId: v.id("organizations"),
    contentItemId: v.id("contentItems"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);
    const item = await ctx.db.get(args.contentItemId);
    if (!item || item.organizationId !== args.organizationId) {
      return null;
    }

    const observations = await ctx.db
      .query("contentMetricObservations")
      .withIndex("by_contentItem", (q) => q.eq("contentItemId", args.contentItemId))
      .collect();

    const links = await ctx.db
      .query("initiativeContentLinks")
      .withIndex("by_contentItem", (q) => q.eq("contentItemId", args.contentItemId))
      .collect();

    const initiatives = await Promise.all(
      links.map(async (l) => await ctx.db.get(l.initiativeId))
    );

    return {
      item,
      observations,
      initiatives: initiatives.filter((init): init is NonNullable<typeof init> => init !== null),
    };
  },
});

export const createContentItem = mutation({
  args: {
    organizationId: v.id("organizations"),
    provider: v.string(),
    origin: v.union(
      v.literal("social"),
      v.literal("website"),
      v.literal("newsletter"),
      v.literal("manual"),
      v.literal("csv_import"),
      v.literal("other")
    ),
    contentType: v.union(
      v.literal("post"),
      v.literal("video"),
      v.literal("short_video"),
      v.literal("article"),
      v.literal("report"),
      v.literal("investigation"),
      v.literal("newsletter"),
      v.literal("podcast"),
      v.literal("event"),
      v.literal("research"),
      v.literal("press_release"),
      v.literal("other")
    ),
    title: v.string(),
    text: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    metrics: v.optional(
      v.object({
        impressions: v.optional(v.number()),
        reach: v.optional(v.number()),
        views: v.optional(v.number()),
        likes: v.optional(v.number()),
        comments: v.optional(v.number()),
        shares: v.optional(v.number()),
        saves: v.optional(v.number()),
        clicks: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const now = Date.now();
    return await ctx.db.insert("contentItems", {
      ...args,
      publishedAt: args.publishedAt ?? now,
      createdAt: now,
      updatedAt: now,
    });
  },
});
