import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<string, number> = {
  owner: 50,
  admin: 40,
  analyst: 30,
  contributor: 20,
  viewer: 10,
};

export type Role = "owner" | "admin" | "analyst" | "contributor" | "viewer";

// Get the authenticated Clerk user identity or throw
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

// Get the Radar user record for the authenticated Clerk user, or throw
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await requireAuth(ctx);
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
    .unique();
  if (!user) {
    throw new Error("User not found in Radar");
  }
  return user;
}

// Verify the user is a member of the given organization, return membership
export async function requireOrganizationMember(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">
) {
  const user = await requireUser(ctx);
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_organization_user", (q) =>
      q.eq("organizationId", organizationId).eq("userId", user._id)
    )
    .unique();
  if (!membership) {
    throw new Error("Not a member of this organization");
  }
  return { user, membership };
}

// Verify the user has one of the required roles in the organization
export async function requireOrganizationRole(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  requiredRoles: Role[]
) {
  const { user, membership } = await requireOrganizationMember(ctx, organizationId);
  if (!requiredRoles.includes(membership.role as Role)) {
    throw new Error(
      `Insufficient permissions. Required: ${requiredRoles.join(", ")}. Current: ${membership.role}`
    );
  }
  return { user, membership };
}

// Check if a role meets a minimum level
export function hasMinimumRole(userRole: string, minimumRole: Role): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[minimumRole] ?? 0);
}
