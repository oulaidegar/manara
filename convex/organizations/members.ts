import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOrganizationRole, requireOrganizationMember } from "../lib/auth";
import { logAuditEvent } from "../lib/audit";
import { ValidationError, NotFoundError } from "../lib/errors";

export const listMembers = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);
    
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          membershipId: m._id,
          role: m.role,
          user: user!,
          joinedAt: m.createdAt,
        };
      })
    );

    return members;
  },
});

export const updateMemberRole = mutation({
  args: {
    organizationId: v.id("organizations"),
    memberUserId: v.id("users"),
    newRole: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("analyst"),
      v.literal("contributor"),
      v.literal("viewer")
    ),
  },
  handler: async (ctx, args) => {
    const { user, membership: currentMembership } = await requireOrganizationRole(ctx, args.organizationId, ["owner", "admin"]);

    const targetMembership = await ctx.db
      .query("memberships")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.memberUserId)
      )
      .unique();

    if (!targetMembership) {
      throw new NotFoundError("Membership");
    }

    // Only owners can make others owners or demote owners
    if (args.newRole === "owner" && currentMembership.role !== "owner") {
      throw new ValidationError("Only owners can grant owner role");
    }
    if (targetMembership.role === "owner" && currentMembership.role !== "owner") {
      throw new ValidationError("Only owners can change an owner's role");
    }

    // Check if removing the last owner
    if (targetMembership.role === "owner" && args.newRole !== "owner") {
      const allMemberships = await ctx.db
        .query("memberships")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .collect();
      
      const owners = allMemberships.filter((m) => m.role === "owner");
      if (owners.length <= 1) {
        throw new ValidationError("Cannot demote the last owner");
      }
    }

    await ctx.db.patch(targetMembership._id, {
      role: args.newRole,
      updatedAt: Date.now(),
    });

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "update_member_role",
      entityType: "membership",
      entityId: targetMembership._id,
      metadata: { oldRole: targetMembership.role, newRole: args.newRole },
    });
  },
});

export const removeMember = mutation({
  args: {
    organizationId: v.id("organizations"),
    memberUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { user, membership: currentMembership } = await requireOrganizationRole(ctx, args.organizationId, ["owner", "admin"]);

    const targetMembership = await ctx.db
      .query("memberships")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.memberUserId)
      )
      .unique();

    if (!targetMembership) {
      throw new NotFoundError("Membership");
    }

    if (targetMembership.role === "owner" && currentMembership.role !== "owner") {
      throw new ValidationError("Only owners can remove an owner");
    }

    if (targetMembership.role === "owner") {
      const allMemberships = await ctx.db
        .query("memberships")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .collect();
      
      const owners = allMemberships.filter((m) => m.role === "owner");
      if (owners.length <= 1) {
        throw new ValidationError("Cannot remove the last owner");
      }
    }

    await ctx.db.delete(targetMembership._id);

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "remove_member",
      entityType: "membership",
      entityId: targetMembership._id,
      metadata: { removedUserId: args.memberUserId },
    });
  },
});

export const inviteMember = mutation({
  args: {
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("analyst"),
      v.literal("contributor"),
      v.literal("viewer")
    ),
  },
  handler: async (ctx, args) => {
    const { user, membership } = await requireOrganizationRole(ctx, args.organizationId, ["owner", "admin"]);

    if (args.role === "owner" && membership.role !== "owner") {
      throw new ValidationError("Only owners can invite new owners");
    }

    const existingInvite = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingInvite) {
      throw new ValidationError("A pending invitation already exists for this email");
    }

    // Generate a simple token since standard Node.js crypto isn't available in Convex
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const invitationId = await ctx.db.insert("invitations", {
      organizationId: args.organizationId,
      email: args.email,
      role: args.role,
      status: "pending",
      invitedBy: user._id,
      token,
      expiresAt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "invite_member",
      entityType: "invitation",
      entityId: invitationId,
      metadata: { email: args.email, role: args.role },
    });

    return token;
  },
});

export const listInvitations = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationRole(ctx, args.organizationId, ["owner", "admin"]);

    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return invitations;
  },
});

export const revokeInvitation = mutation({
  args: {
    invitationId: v.id("invitations"),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new NotFoundError("Invitation");
    }

    const { user } = await requireOrganizationRole(ctx, invitation.organizationId, ["owner", "admin"]);

    if (invitation.status !== "pending") {
      throw new ValidationError("Invitation is not pending");
    }

    await ctx.db.patch(args.invitationId, {
      status: "revoked",
      updatedAt: Date.now(),
    });

    await logAuditEvent(ctx, {
      organizationId: invitation.organizationId,
      actorUserId: user._id,
      action: "revoke_invitation",
      entityType: "invitation",
      entityId: invitation._id,
    });
  },
});

export const acceptInvitation = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invitation) {
      throw new ValidationError("Invalid invitation token");
    }

    if (invitation.status !== "pending") {
      throw new ValidationError("Invitation is no longer pending");
    }

    if (invitation.expiresAt < Date.now()) {
      await ctx.db.patch(invitation._id, { status: "expired", updatedAt: Date.now() });
      throw new ValidationError("Invitation has expired");
    }

    const existingMembership = await ctx.db
      .query("memberships")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", invitation.organizationId).eq("userId", user._id)
      )
      .unique();

    if (existingMembership) {
      throw new ValidationError("You are already a member of this organization");
    }

    const membershipId = await ctx.db.insert("memberships", {
      organizationId: invitation.organizationId,
      userId: user._id,
      role: invitation.role,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(invitation._id, {
      status: "accepted",
      updatedAt: Date.now(),
    });

    await logAuditEvent(ctx, {
      organizationId: invitation.organizationId,
      actorUserId: user._id,
      action: "accept_invitation",
      entityType: "membership",
      entityId: membershipId,
    });

    return invitation.organizationId;
  },
});
