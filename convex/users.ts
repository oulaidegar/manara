import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireUser } from "./lib/auth";

export const getOrCreateUser = mutation({
  args: {
    clerkUserId: v.string(),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // We only require auth here, as they might not exist in our db yet
    const identity = await requireAuth(ctx);
    if (identity.subject !== args.clerkUserId) {
      throw new Error("Cannot create user for different identity");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
        avatarUrl: args.avatarUrl,
        updatedAt: Date.now(),
      });
      return existingUser._id;
    }

    const newUserId = await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      name: args.name,
      email: args.email,
      avatarUrl: args.avatarUrl,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return newUserId;
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return user;
  },
});
