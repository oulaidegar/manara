import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export async function logAuditEvent(
  ctx: MutationCtx,
  args: {
    organizationId: Id<"organizations">;
    actorUserId: Id<"users">;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  await ctx.db.insert("auditEvents", {
    ...args,
    createdAt: Date.now(),
  });
}
