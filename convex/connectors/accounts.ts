import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember, requireOrganizationRole } from "../lib/auth";
import { logAuditEvent } from "../lib/audit";
import { NotFoundError } from "../lib/errors";

export const listAccounts = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);
    return await ctx.db
      .query("socialAccounts")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

export const getAccount = query({
  args: {
    organizationId: v.id("organizations"),
    accountId: v.id("socialAccounts"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);
    const account = await ctx.db.get(args.accountId);
    if (!account || account.organizationId !== args.organizationId) {
      throw new NotFoundError("SocialAccount", args.accountId);
    }
    return account;
  },
});

export const connectAccount = mutation({
  args: {
    organizationId: v.id("organizations"),
    provider: v.string(),
    externalAccountId: v.string(),
    name: v.string(),
    handle: v.string(),
    url: v.optional(v.string()),
    accountType: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
    ]);

    // Check if account already exists
    const existing = await ctx.db
      .query("socialAccounts")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) =>
        q.and(
          q.eq(q.field("provider"), args.provider),
          q.eq(q.field("externalAccountId"), args.externalAccountId)
        )
      )
      .first();

    const now = Date.now();
    let accountId;

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        handle: args.handle,
        url: args.url,
        active: true,
        updatedAt: now,
      });
      accountId = existing._id;
    } else {
      accountId = await ctx.db.insert("socialAccounts", {
        organizationId: args.organizationId,
        provider: args.provider,
        externalAccountId: args.externalAccountId,
        name: args.name,
        handle: args.handle,
        url: args.url,
        accountType: args.accountType ?? "channel",
        avatarUrl: args.avatarUrl,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "connect_account",
      entityType: "social_account",
      entityId: accountId,
      metadata: {
        provider: args.provider,
        handle: args.handle,
      },
    });

    return accountId;
  },
});

export const disconnectAccount = mutation({
  args: {
    organizationId: v.id("organizations"),
    accountId: v.id("socialAccounts"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
    ]);

    const account = await ctx.db.get(args.accountId);
    if (!account || account.organizationId !== args.organizationId) {
      throw new NotFoundError("SocialAccount", args.accountId);
    }

    await ctx.db.patch(args.accountId, {
      active: false,
      updatedAt: Date.now(),
    });

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "disconnect_account",
      entityType: "social_account",
      entityId: args.accountId,
      metadata: {
        provider: account.provider,
        handle: account.handle,
      },
    });

    return { success: true };
  },
});
