import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember, requireOrganizationRole, requireUser } from "./lib/auth";
import { logAuditEvent } from "./lib/audit";

export const listOutcomes = query({
  args: {
    organizationId: v.id("organizations"),
    status: v.optional(v.string()),
    initiativeId: v.optional(v.id("initiatives")),
    changeType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    let outcomes;
    if (args.initiativeId) {
      outcomes = await ctx.db
        .query("outcomes")
        .withIndex("by_initiative", (q) => q.eq("initiativeId", args.initiativeId))
        .collect();
    } else {
      outcomes = await ctx.db
        .query("outcomes")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .order("desc")
        .collect();
    }

    if (args.status && args.status !== "all") {
      outcomes = outcomes.filter((o) => o.verificationStatus === args.status);
    }

    if (args.changeType && args.changeType !== "all") {
      outcomes = outcomes.filter((o) => o.changeType === args.changeType);
    }

    const enriched = await Promise.all(
      outcomes.map(async (outcome) => {
        const evidence = await ctx.db
          .query("evidenceItems")
          .withIndex("by_outcome", (q) => q.eq("outcomeId", outcome._id))
          .collect();

        let initiativeName = null;
        if (outcome.initiativeId) {
          const init = await ctx.db.get(outcome.initiativeId);
          initiativeName = init?.name ?? null;
        }

        return {
          ...outcome,
          evidenceCount: evidence.length,
          evidencePreview: evidence.slice(0, 3).map((e) => ({
            _id: e._id,
            title: e.title,
            type: e.type,
            publisher: e.publisher,
            url: e.url,
            excerpt: e.excerpt,
          })),
          initiativeName,
        };
      })
    );

    return enriched;
  },
});

export const getOutcome = query({
  args: {
    organizationId: v.id("organizations"),
    outcomeId: v.id("outcomes"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);
    const outcome = await ctx.db.get(args.outcomeId);
    if (!outcome || outcome.organizationId !== args.organizationId) {
      return null;
    }

    const evidence = await ctx.db
      .query("evidenceItems")
      .withIndex("by_outcome", (q) => q.eq("outcomeId", outcome._id))
      .collect();

    let initiative = null;
    if (outcome.initiativeId) {
      initiative = await ctx.db.get(outcome.initiativeId);
    }

    const creator = await ctx.db.get(outcome.createdBy);

    return {
      outcome,
      evidence,
      initiative,
      creatorName: creator?.name ?? "Team Member",
    };
  },
});

export const getImpactSummary = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const outcomes = await ctx.db
      .query("outcomes")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const evidenceItems = await ctx.db
      .query("evidenceItems")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    let candidatesCount = 0;
    let documentedCount = 0;
    let corroboratedCount = 0;
    let verifiedCount = 0;
    let strongEvidenceCount = 0;
    let initiativesLinkedCount = 0;

    for (const o of outcomes) {
      if (o.verificationStatus === "candidate") candidatesCount++;
      else if (o.verificationStatus === "documented") documentedCount++;
      else if (o.verificationStatus === "corroborated") corroboratedCount++;
      else if (o.verificationStatus === "verified") verifiedCount++;

      if (o.contributionStrength === "strong_evidence") strongEvidenceCount++;
      if (o.initiativeId) initiativesLinkedCount++;
    }

    return {
      totalOutcomes: outcomes.length,
      candidatesCount,
      documentedCount,
      corroboratedCount,
      verifiedCount,
      totalEvidenceCount: evidenceItems.length,
      strongEvidenceCount,
      initiativesLinkedCount,
    };
  },
});

export const createOutcome = mutation({
  args: {
    organizationId: v.id("organizations"),
    initiativeId: v.optional(v.id("initiatives")),
    title: v.string(),
    description: v.string(),
    changeType: v.union(
      v.literal("awareness"),
      v.literal("media"),
      v.literal("behavior"),
      v.literal("relationship"),
      v.literal("institutional_practice"),
      v.literal("policy"),
      v.literal("law"),
      v.literal("funding"),
      v.literal("public_commitment"),
      v.literal("investigation"),
      v.literal("other")
    ),
    significance: v.optional(v.string()),
    contributionStatement: v.string(),
    contributionStrength: v.union(
      v.literal("unknown"),
      v.literal("possible"),
      v.literal("plausible"),
      v.literal("strong_evidence")
    ),
    occurredAt: v.optional(v.number()),
    initialEvidence: v.optional(
      v.object({
        title: v.string(),
        type: v.union(
          v.literal("official_document"),
          v.literal("media_article"),
          v.literal("report"),
          v.literal("webpage"),
          v.literal("email"),
          v.literal("meeting_note"),
          v.literal("quote"),
          v.literal("screenshot"),
          v.literal("file"),
          v.literal("dataset"),
          v.literal("other")
        ),
        url: v.optional(v.string()),
        publisher: v.optional(v.string()),
        excerpt: v.optional(v.string()),
        notes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const now = Date.now();
    const outcomeId = await ctx.db.insert("outcomes", {
      organizationId: args.organizationId,
      initiativeId: args.initiativeId,
      title: args.title,
      description: args.description,
      occurredAt: args.occurredAt ?? now,
      changeType: args.changeType,
      significance: args.significance,
      contributionStatement: args.contributionStatement,
      contributionStrength: args.contributionStrength,
      verificationStatus: args.initialEvidence ? "documented" : "candidate",
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    if (args.initialEvidence) {
      await ctx.db.insert("evidenceItems", {
        organizationId: args.organizationId,
        outcomeId,
        type: args.initialEvidence.type,
        title: args.initialEvidence.title,
        url: args.initialEvidence.url,
        publisher: args.initialEvidence.publisher,
        publishedAt: args.occurredAt ?? now,
        excerpt: args.initialEvidence.excerpt,
        notes: args.initialEvidence.notes,
        verificationStatus: "documented",
        createdBy: user._id,
        createdAt: now,
        updatedAt: now,
      });
    }

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "create_outcome",
      entityType: "outcome",
      entityId: outcomeId,
      metadata: { title: args.title, changeType: args.changeType },
    });

    return outcomeId;
  },
});

export const updateOutcome = mutation({
  args: {
    organizationId: v.id("organizations"),
    outcomeId: v.id("outcomes"),
    title: v.string(),
    description: v.string(),
    initiativeId: v.optional(v.id("initiatives")),
    changeType: v.union(
      v.literal("awareness"),
      v.literal("media"),
      v.literal("behavior"),
      v.literal("relationship"),
      v.literal("institutional_practice"),
      v.literal("policy"),
      v.literal("law"),
      v.literal("funding"),
      v.literal("public_commitment"),
      v.literal("investigation"),
      v.literal("other")
    ),
    significance: v.optional(v.string()),
    contributionStatement: v.string(),
    contributionStrength: v.union(
      v.literal("unknown"),
      v.literal("possible"),
      v.literal("plausible"),
      v.literal("strong_evidence")
    ),
    occurredAt: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const outcome = await ctx.db.get(args.outcomeId);
    if (!outcome || outcome.organizationId !== args.organizationId) {
      throw new Error("Outcome not found");
    }

    await ctx.db.patch(args.outcomeId, {
      title: args.title,
      description: args.description,
      initiativeId: args.initiativeId,
      changeType: args.changeType,
      significance: args.significance,
      contributionStatement: args.contributionStatement,
      contributionStrength: args.contributionStrength,
      occurredAt: args.occurredAt,
      updatedAt: Date.now(),
    });

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "update_outcome",
      entityType: "outcome",
      entityId: args.outcomeId,
      metadata: { title: args.title },
    });
  },
});

export const deleteOutcome = mutation({
  args: {
    organizationId: v.id("organizations"),
    outcomeId: v.id("outcomes"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
    ]);

    const outcome = await ctx.db.get(args.outcomeId);
    if (!outcome || outcome.organizationId !== args.organizationId) {
      throw new Error("Outcome not found");
    }

    // Delete attached evidence items
    const evidence = await ctx.db
      .query("evidenceItems")
      .withIndex("by_outcome", (q) => q.eq("outcomeId", args.outcomeId))
      .collect();

    for (const item of evidence) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.outcomeId);

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "delete_outcome",
      entityType: "outcome",
      entityId: args.outcomeId,
      metadata: { title: outcome.title },
    });
  },
});

export const addEvidence = mutation({
  args: {
    organizationId: v.id("organizations"),
    outcomeId: v.id("outcomes"),
    type: v.union(
      v.literal("official_document"),
      v.literal("media_article"),
      v.literal("report"),
      v.literal("webpage"),
      v.literal("email"),
      v.literal("meeting_note"),
      v.literal("quote"),
      v.literal("screenshot"),
      v.literal("file"),
      v.literal("dataset"),
      v.literal("other")
    ),
    title: v.string(),
    url: v.optional(v.string()),
    storageId: v.optional(v.string()),
    publisher: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    excerpt: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const outcome = await ctx.db.get(args.outcomeId);
    if (!outcome || outcome.organizationId !== args.organizationId) {
      throw new Error("Outcome not found");
    }

    const now = Date.now();
    const evidenceId = await ctx.db.insert("evidenceItems", {
      organizationId: args.organizationId,
      outcomeId: args.outcomeId,
      type: args.type,
      title: args.title,
      url: args.url,
      storageId: args.storageId,
      publisher: args.publisher,
      publishedAt: args.publishedAt ?? now,
      excerpt: args.excerpt,
      notes: args.notes,
      verificationStatus: "documented",
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    // If outcome was only a candidate, advance to documented automatically upon attaching evidence
    if (outcome.verificationStatus === "candidate") {
      await ctx.db.patch(args.outcomeId, {
        verificationStatus: "documented",
        updatedAt: now,
      });
    }

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "add_evidence",
      entityType: "evidence",
      entityId: evidenceId,
      metadata: { title: args.title, outcomeId: args.outcomeId },
    });

    return evidenceId;
  },
});

export const deleteEvidence = mutation({
  args: {
    organizationId: v.id("organizations"),
    evidenceId: v.id("evidenceItems"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
    ]);

    const item = await ctx.db.get(args.evidenceId);
    if (!item || item.organizationId !== args.organizationId) {
      throw new Error("Evidence item not found");
    }

    await ctx.db.delete(args.evidenceId);

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "delete_evidence",
      entityType: "evidence",
      entityId: args.evidenceId,
      metadata: { title: item.title, outcomeId: item.outcomeId },
    });
  },
});

export const updateVerificationStatus = mutation({
  args: {
    organizationId: v.id("organizations"),
    outcomeId: v.id("outcomes"),
    status: v.union(
      v.literal("candidate"),
      v.literal("documented"),
      v.literal("corroborated"),
      v.literal("verified"),
      v.literal("rejected")
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, ["owner", "admin", "analyst"]);

    const outcome = await ctx.db.get(args.outcomeId);
    if (!outcome || outcome.organizationId !== args.organizationId) {
      throw new Error("Outcome not found");
    }

    await ctx.db.patch(args.outcomeId, {
      verificationStatus: args.status,
      updatedAt: Date.now(),
    });

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "update_verification_status",
      entityType: "outcome",
      entityId: args.outcomeId,
      metadata: { status: args.status },
    });
  },
});

export const listActors = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    return await ctx.db
      .query("actors")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();
  },
});

export const createActor = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    type: v.union(
      v.literal("person"),
      v.literal("government"),
      v.literal("politician"),
      v.literal("media"),
      v.literal("ngo"),
      v.literal("company"),
      v.literal("institution"),
      v.literal("community"),
      v.literal("researcher"),
      v.literal("funder"),
      v.literal("other")
    ),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    country: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const now = Date.now();
    const actorId = await ctx.db.insert("actors", {
      organizationId: args.organizationId,
      name: args.name,
      type: args.type,
      description: args.description,
      website: args.website,
      country: args.country,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "create_actor",
      entityType: "actor",
      entityId: actorId,
      metadata: { name: args.name, type: args.type },
    });

    return actorId;
  },
});

export const deleteActor = mutation({
  args: {
    organizationId: v.id("organizations"),
    actorId: v.id("actors"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, ["owner", "admin", "analyst"]);

    const actor = await ctx.db.get(args.actorId);
    if (!actor || actor.organizationId !== args.organizationId) {
      throw new Error("Actor not found");
    }

    await ctx.db.delete(args.actorId);

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "delete_actor",
      entityType: "actor",
      entityId: args.actorId,
      metadata: { name: actor.name },
    });
  },
});
