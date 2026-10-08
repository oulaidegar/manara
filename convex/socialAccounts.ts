import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember, requireOrganizationRole } from "./lib/auth";
import { logAuditEvent } from "./lib/audit";
import { NotFoundError } from "./lib/errors";

export const listSocialAccounts = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);
    return await ctx.db
      .query("socialAccounts")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

export const getSocialAccount = query({
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

export const connectSocialAccount = mutation({
  args: {
    organizationId: v.id("organizations"),
    platform: v.union(
      v.literal("instagram"),
      v.literal("linkedin"),
      v.literal("tiktok"),
      v.literal("youtube"),
      v.literal("x"),
      v.literal("facebook"),
      v.literal("threads"),
      v.literal("other")
    ),
    handle: v.string(),
    displayName: v.optional(v.string()),
    profileUrl: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    followerCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
    totalPosts: v.optional(v.number()),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
    ]);

    // Clean handle: remove leading @
    const cleanHandle = args.handle.trim().replace(/^@/, "");
    const provider = args.provider ?? "socialcrawl";
    const externalAccountId = `ext_${args.platform}_${cleanHandle.toLowerCase()}`;
    const displayName = args.displayName ?? `@${cleanHandle}`;
    const profileUrl = args.profileUrl ?? `https://${args.platform}.com/${cleanHandle}`;

    const now = Date.now();

    // Check if account already exists for this org and platform
    const existing = await ctx.db
      .query("socialAccounts")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) =>
        q.and(
          q.eq(q.field("handle"), cleanHandle),
          q.eq(q.field("platform"), args.platform)
        )
      )
      .first();

    let accountId;
    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName,
        profileUrl,
        followerCount: args.followerCount ?? existing.followerCount,
        followingCount: args.followingCount ?? existing.followingCount,
        totalPosts: args.totalPosts ?? existing.totalPosts,
        profileImageUrl: args.profileImageUrl ?? existing.profileImageUrl,
        syncEnabled: true,
        updatedAt: now,
      });
      accountId = existing._id;
    } else {
      accountId = await ctx.db.insert("socialAccounts", {
        organizationId: args.organizationId,
        platform: args.platform,
        handle: cleanHandle,
        displayName,
        externalAccountId,
        profileUrl,
        profileImageUrl: args.profileImageUrl,
        followerCount: args.followerCount ?? (args.platform === "youtube" ? 54000 : args.platform === "instagram" ? 42000 : 28000),
        followingCount: args.followingCount ?? 350,
        totalPosts: args.totalPosts ?? 120,
        verificationStatus: true,
        provider,
        syncEnabled: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Queue backfill sync job
    const jobId = await ctx.db.insert("syncJobs", {
      organizationId: args.organizationId,
      accountId,
      type: "post_backfill",
      status: "queued",
      attempts: 0,
      createdAt: now,
    });

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "connect_social_account",
      entityType: "social_account",
      entityId: accountId,
      metadata: {
        platform: args.platform,
        handle: cleanHandle,
        jobId,
      },
    });

    return { accountId, jobId };
  },
});

export const disconnectSocialAccount = mutation({
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
      syncEnabled: false,
      updatedAt: Date.now(),
    });

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "disconnect_social_account",
      entityType: "social_account",
      entityId: args.accountId,
      metadata: {
        platform: account.platform,
        handle: account.handle,
      },
    });

    return true;
  },
});
