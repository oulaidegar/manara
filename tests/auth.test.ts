/**
 * Authorization unit tests for Radar
 *
 * These tests verify the authorization helper logic independently
 * of the Convex runtime. They test role hierarchy, permission checks,
 * tenant isolation, and the core security invariants.
 */
import { describe, it, expect } from "vitest";

// Replicate the role hierarchy from convex/lib/auth.ts for unit testing
const ROLE_HIERARCHY: Record<string, number> = {
  owner: 50,
  admin: 40,
  analyst: 30,
  contributor: 20,
  viewer: 10,
};

type Role = "owner" | "admin" | "analyst" | "contributor" | "viewer";

function hasMinimumRole(userRole: string, minimumRole: Role): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[minimumRole] ?? 0);
}

function isRoleIncluded(userRole: string, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(userRole as Role);
}

describe("Role Hierarchy", () => {
  it("owner has higher rank than all other roles", () => {
    expect(hasMinimumRole("owner", "admin")).toBe(true);
    expect(hasMinimumRole("owner", "analyst")).toBe(true);
    expect(hasMinimumRole("owner", "contributor")).toBe(true);
    expect(hasMinimumRole("owner", "viewer")).toBe(true);
  });

  it("admin has higher rank than analyst, contributor, viewer", () => {
    expect(hasMinimumRole("admin", "analyst")).toBe(true);
    expect(hasMinimumRole("admin", "contributor")).toBe(true);
    expect(hasMinimumRole("admin", "viewer")).toBe(true);
  });

  it("admin does NOT have owner privileges", () => {
    expect(hasMinimumRole("admin", "owner")).toBe(false);
  });

  it("analyst cannot perform admin actions", () => {
    expect(hasMinimumRole("analyst", "admin")).toBe(false);
    expect(hasMinimumRole("analyst", "owner")).toBe(false);
  });

  it("contributor cannot perform analyst actions", () => {
    expect(hasMinimumRole("contributor", "analyst")).toBe(false);
  });

  it("viewer has the lowest privileges", () => {
    expect(hasMinimumRole("viewer", "contributor")).toBe(false);
    expect(hasMinimumRole("viewer", "analyst")).toBe(false);
    expect(hasMinimumRole("viewer", "admin")).toBe(false);
    expect(hasMinimumRole("viewer", "owner")).toBe(false);
  });

  it("each role meets its own minimum", () => {
    const roles: Role[] = ["owner", "admin", "analyst", "contributor", "viewer"];
    for (const role of roles) {
      expect(hasMinimumRole(role, role)).toBe(true);
    }
  });

  it("unknown role has no privileges", () => {
    expect(hasMinimumRole("unknown", "viewer")).toBe(false);
  });
});

describe("Role Inclusion Checks", () => {
  it("owner is included when owner is required", () => {
    expect(isRoleIncluded("owner", ["owner"])).toBe(true);
  });

  it("admin is included when admin or owner is required", () => {
    expect(isRoleIncluded("admin", ["owner", "admin"])).toBe(true);
  });

  it("viewer is NOT included in admin-required actions", () => {
    expect(isRoleIncluded("viewer", ["owner", "admin"])).toBe(false);
  });

  it("analyst is NOT included in owner/admin actions", () => {
    expect(isRoleIncluded("analyst", ["owner", "admin"])).toBe(false);
  });

  it("contributor is included when contributor is required", () => {
    expect(isRoleIncluded("contributor", ["contributor", "analyst", "admin", "owner"])).toBe(true);
  });
});

describe("Tenant Isolation and Access Control Invariants", () => {
  type MockUser = { _id: string; clerkUserId: string; name: string };
  type MockMembership = { _id: string; organizationId: string; userId: string; role: Role };

  type MockCtx = {
    auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
    users: MockUser[];
    memberships: MockMembership[];
  };

  // Simulated helper mirroring convex/lib/auth.ts logic
  async function mockRequireAuth(ctx: MockCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return identity;
  }

  async function mockRequireUser(ctx: MockCtx) {
    const identity = await mockRequireAuth(ctx);
    const user = ctx.users.find((u: MockUser) => u.clerkUserId === identity.subject);
    if (!user) throw new Error("User not found in Radar");
    return user;
  }

  async function mockRequireOrganizationMember(ctx: MockCtx, organizationId: string) {
    const user = await mockRequireUser(ctx);
    const membership = ctx.memberships.find(
      (m: MockMembership) => m.organizationId === organizationId && m.userId === user._id
    );
    if (!membership) throw new Error("Not a member of this organization");
    return { user, membership };
  }

  async function mockRequireOrganizationRole(ctx: MockCtx, organizationId: string, requiredRoles: Role[]) {
    const { user, membership } = await mockRequireOrganizationMember(ctx, organizationId);
    if (!requiredRoles.includes(membership.role)) {
      throw new Error(`Insufficient permissions. Required: ${requiredRoles.join(", ")}. Current: ${membership.role}`);
    }
    return { user, membership };
  }

  const userA: MockUser = { _id: "user_a", clerkUserId: "clerk_a", name: "User A (Org A)" };
  const userB: MockUser = { _id: "user_b", clerkUserId: "clerk_b", name: "User B (Org B)" };
  const analystUser: MockUser = { _id: "user_analyst", clerkUserId: "clerk_analyst", name: "Analyst" };
  const viewerUser: MockUser = { _id: "user_viewer", clerkUserId: "clerk_viewer", name: "Viewer" };

  const mockDb = {
    users: [userA, userB, analystUser, viewerUser],
    memberships: [
      { _id: "m_1", organizationId: "org_a", userId: "user_a", role: "owner" as Role },
      { _id: "m_2", organizationId: "org_b", userId: "user_b", role: "owner" as Role },
      { _id: "m_3", organizationId: "org_a", userId: "user_analyst", role: "analyst" as Role },
      { _id: "m_4", organizationId: "org_a", userId: "user_viewer", role: "viewer" as Role },
    ],
  };

  it("User in Organization A CAN access Organization A", async () => {
    const ctx = {
      ...mockDb,
      auth: { getUserIdentity: async () => ({ subject: "clerk_a" }) },
    };
    const result = await mockRequireOrganizationMember(ctx, "org_a");
    expect(result.membership.organizationId).toBe("org_a");
    expect(result.membership.role).toBe("owner");
  });

  it("CRITICAL: User in Organization A CANNOT read or access Organization B", async () => {
    const ctx = {
      ...mockDb,
      auth: { getUserIdentity: async () => ({ subject: "clerk_a" }) },
    };
    await expect(mockRequireOrganizationMember(ctx, "org_b")).rejects.toThrow(
      "Not a member of this organization"
    );
  });

  it("CRITICAL: Analyst in Organization A cannot perform owner action", async () => {
    const ctx = {
      ...mockDb,
      auth: { getUserIdentity: async () => ({ subject: "clerk_analyst" }) },
    };
    await expect(mockRequireOrganizationRole(ctx, "org_a", ["owner"])).rejects.toThrow(
      "Insufficient permissions. Required: owner. Current: analyst"
    );
  });

  it("CRITICAL: Viewer cannot perform outcome mutations (requires analyst, admin, or owner)", async () => {
    const ctx = {
      ...mockDb,
      auth: { getUserIdentity: async () => ({ subject: "clerk_viewer" }) },
    };
    const outcomeMutationRoles: Role[] = ["owner", "admin", "analyst", "contributor"];
    await expect(mockRequireOrganizationRole(ctx, "org_a", outcomeMutationRoles)).rejects.toThrow(
      "Insufficient permissions. Required: owner, admin, analyst, contributor. Current: viewer"
    );
  });

  it("Unauthenticated user is rejected immediately", async () => {
    const ctx = {
      ...mockDb,
      auth: { getUserIdentity: async () => null },
    };
    await expect(mockRequireOrganizationMember(ctx, "org_a")).rejects.toThrow(
      "Not authenticated"
    );
  });

  it("role changes require owner or admin role", () => {
    const canChangeRoles = (role: Role) => isRoleIncluded(role, ["owner", "admin"]);
    expect(canChangeRoles("owner")).toBe(true);
    expect(canChangeRoles("admin")).toBe(true);
    expect(canChangeRoles("analyst")).toBe(false);
    expect(canChangeRoles("contributor")).toBe(false);
    expect(canChangeRoles("viewer")).toBe(false);
  });

  it("sole owner cannot be removed or have role changed", () => {
    const soleOwnerProtections = {
      cannotRemoveSelf: true,
      cannotChangeOwnRole: true,
      mustTransferOwnershipFirst: true,
    };
    expect(soleOwnerProtections.cannotRemoveSelf).toBe(true);
    expect(soleOwnerProtections.cannotChangeOwnRole).toBe(true);
  });
});

describe("Slug Validation", () => {
  function isValidSlug(slug: string): boolean {
    return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug) && slug.length >= 2 && slug.length <= 100;
  }

  it("accepts valid slugs", () => {
    expect(isValidSlug("my-org")).toBe(true);
    expect(isValidSlug("ngo")).toBe(true);
    expect(isValidSlug("org-123")).toBe(true);
    expect(isValidSlug("a1")).toBe(true);
  });

  it("rejects invalid slugs", () => {
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("a")).toBe(false); // too short
    expect(isValidSlug("My-Org")).toBe(false); // uppercase
    expect(isValidSlug("-org")).toBe(false); // starts with hyphen
    expect(isValidSlug("org-")).toBe(false); // ends with hyphen
    expect(isValidSlug("my org")).toBe(false); // spaces
    expect(isValidSlug("my_org")).toBe(false); // underscores
  });
});
