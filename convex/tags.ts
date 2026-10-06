import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember, requireOrganizationRole } from "./lib/auth";
import { logAuditEvent } from "./lib/audit";
import { NotFoundError, ValidationError } from "./lib/errors";

export const listTags = query({
  args: {
    organizationId: v.id("organizations"),
    category: v.optional(
      v.union(
        v.literal("topic"),
        v.literal("format"),
        v.literal("audience"),
        v.literal("purpose"),
        v.literal("region"),
        v.literal("general")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const tags = await ctx.db
      .query("organizationTags")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const filtered = args.category
      ? tags.filter((t) => t.category === args.category)
      : tags;

    // Enrich with content usage count
    const enriched = await Promise.all(
      filtered.map(async (tag) => {
        const usageCount = (
          await ctx.db
            .query("contentTags")
            .withIndex("by_tag", (q) => q.eq("tagId", tag._id))
            .collect()
        ).length;

        return {
          ...tag,
          usageCount,
        };
      })
    );

    return enriched;
  },
});

export const listContentTags = query({
  args: {
    organizationId: v.id("organizations"),
    contentItemId: v.id("contentItems"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const links = await ctx.db
      .query("contentTags")
      .withIndex("by_contentItem", (q) => q.eq("contentItemId", args.contentItemId))
      .collect();

    const enriched = await Promise.all(
      links.map(async (link) => {
        const tag = await ctx.db.get(link.tagId);
        return {
          ...link,
          tag,
        };
      })
    );

    return enriched.filter((item) => item.tag !== null);
  },
});

export const createTag = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    category: v.union(
      v.literal("topic"),
      v.literal("format"),
      v.literal("audience"),
      v.literal("purpose"),
      v.literal("region"),
      v.literal("general")
    ),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const slug = args.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    if (!slug) {
      throw new ValidationError("Tag name must be non-empty alphanumeric characters");
    }

    const existing = await ctx.db
      .query("organizationTags")
      .withIndex("by_organization_slug", (q) =>
        q.eq("organizationId", args.organizationId).eq("slug", slug)
      )
      .first();

    if (existing) {
      throw new ValidationError(`Tag '${args.name}' already exists in this organization`);
    }

    const tagId = await ctx.db.insert("organizationTags", {
      organizationId: args.organizationId,
      name: args.name.trim(),
      slug,
      category: args.category,
      color: args.color,
      description: args.description?.trim(),
      createdAt: Date.now(),
    });

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "create_tag",
      entityType: "organization_tag",
      entityId: tagId,
      metadata: { name: args.name, category: args.category },
    });

    return tagId;
  },
});

export const deleteTag = mutation({
  args: {
    organizationId: v.id("organizations"),
    tagId: v.id("organizationTags"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
    ]);

    const tag = await ctx.db.get(args.tagId);
    if (!tag || tag.organizationId !== args.organizationId) {
      throw new NotFoundError("OrganizationTag", args.tagId);
    }

    // Clean up content tag associations
    const contentLinks = await ctx.db
      .query("contentTags")
      .withIndex("by_tag", (q) => q.eq("tagId", args.tagId))
      .collect();

    for (const link of contentLinks) {
      await ctx.db.delete(link._id);
    }

    await ctx.db.delete(args.tagId);

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "delete_tag",
      entityType: "organization_tag",
      entityId: args.tagId,
      metadata: { name: tag.name },
    });

    return { success: true };
  },
});

export const assignTag = mutation({
  args: {
    organizationId: v.id("organizations"),
    contentItemId: v.id("contentItems"),
    tagId: v.id("organizationTags"),
    source: v.optional(
      v.union(
        v.literal("human"),
        v.literal("ai"),
        v.literal("import"),
        v.literal("system")
      )
    ),
    confidence: v.optional(v.number()),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const content = await ctx.db.get(args.contentItemId);
    if (!content || content.organizationId !== args.organizationId) {
      throw new NotFoundError("ContentItem", args.contentItemId);
    }

    const tag = await ctx.db.get(args.tagId);
    if (!tag || tag.organizationId !== args.organizationId) {
      throw new NotFoundError("OrganizationTag", args.tagId);
    }

    // Check existing
    const existing = await ctx.db
      .query("contentTags")
      .withIndex("by_contentItem", (q) => q.eq("contentItemId", args.contentItemId))
      .filter((q) => q.eq(q.field("tagId"), args.tagId))
      .first();

    if (existing) {
      return existing._id;
    }

    const linkId = await ctx.db.insert("contentTags", {
      organizationId: args.organizationId,
      contentItemId: args.contentItemId,
      tagId: args.tagId,
      source: args.source ?? "human",
      confidence: args.confidence,
      model: args.model,
      assignedBy: user._id,
      createdAt: Date.now(),
    });

    return linkId;
  },
});

export const removeTag = mutation({
  args: {
    organizationId: v.id("organizations"),
    contentItemId: v.id("contentItems"),
    tagId: v.id("organizationTags"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const existing = await ctx.db
      .query("contentTags")
      .withIndex("by_contentItem", (q) => q.eq("contentItemId", args.contentItemId))
      .filter((q) => q.eq(q.field("tagId"), args.tagId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true };
  },
});
