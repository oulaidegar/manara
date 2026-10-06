import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember, requireOrganizationRole } from "./lib/auth";
import { logAuditEvent } from "./lib/audit";
import { NotFoundError, ValidationError } from "./lib/errors";

export interface SystemMetricDefinition {
  key: string;
  displayName: string;
  description: string;
  unit: string;
  scope: "content" | "account" | "cross_channel";
  category: "reach" | "engagement" | "action" | "audience" | "derived";
  aggregationBehavior: "sum" | "average" | "latest" | "derived_ratio";
  higherIsBetter: boolean;
  formula?: string;
  isSystem: boolean;
}

export const SYSTEM_METRIC_DEFINITIONS: SystemMetricDefinition[] = [
  {
    key: "impressions",
    displayName: "Impressions",
    description: "Total count of times content appeared on any audience screen or feed.",
    unit: "count",
    scope: "content",
    category: "reach",
    aggregationBehavior: "sum",
    higherIsBetter: true,
    isSystem: true,
  },
  {
    key: "reach",
    displayName: "Unique Reach",
    description: "De-duplicated count of unique individuals exposed to content during the period.",
    unit: "count",
    scope: "content",
    category: "reach",
    aggregationBehavior: "sum",
    higherIsBetter: true,
    isSystem: true,
  },
  {
    key: "views",
    displayName: "Video / Audio Views",
    description: "Playback starts satisfying platform-specific minimum exposure threshold.",
    unit: "count",
    scope: "content",
    category: "reach",
    aggregationBehavior: "sum",
    higherIsBetter: true,
    isSystem: true,
  },
  {
    key: "likes",
    displayName: "Likes & Reactions",
    description: "Low-friction positive signal of agreement, acknowledgement, or approval.",
    unit: "count",
    scope: "content",
    category: "engagement",
    aggregationBehavior: "sum",
    higherIsBetter: true,
    isSystem: true,
  },
  {
    key: "comments",
    displayName: "Public Comments",
    description: "Deliberate audience dialogue, feedback, and discussion responses.",
    unit: "count",
    scope: "content",
    category: "engagement",
    aggregationBehavior: "sum",
    higherIsBetter: true,
    isSystem: true,
  },
  {
    key: "shares",
    displayName: "Meaningful Shares / Reposts",
    description: "High-intent distribution decisions to circulate findings into secondary peer networks.",
    unit: "count",
    scope: "content",
    category: "action",
    aggregationBehavior: "sum",
    higherIsBetter: true,
    isSystem: true,
  },
  {
    key: "saves",
    displayName: "Saves & Bookmarks",
    description: "Explicit intent to retain, reference, or return to investigation materials.",
    unit: "count",
    scope: "content",
    category: "action",
    aggregationBehavior: "sum",
    higherIsBetter: true,
    isSystem: true,
  },
  {
    key: "clicks",
    displayName: "Outbound Clicks",
    description: "Audience journeys from promotional content to full reports, dossiers, or datasets.",
    unit: "count",
    scope: "content",
    category: "action",
    aggregationBehavior: "sum",
    higherIsBetter: true,
    isSystem: true,
  },
  {
    key: "meaningful_action_rate",
    displayName: "Meaningful Action Rate",
    description: "Rate of high-intent audience actions (shares + saves + downloads) per 1,000 impressions.",
    unit: "ratio_per_1k",
    scope: "content",
    category: "derived",
    aggregationBehavior: "derived_ratio",
    higherIsBetter: true,
    formula: "(shares + saves + clicks) / (impressions / 1,000)",
    isSystem: true,
  },
  {
    key: "reach_efficiency_ratio",
    displayName: "Reach Efficiency Ratio",
    description: "Percentage of total screen impressions that represent unique individuals reached.",
    unit: "percentage",
    scope: "content",
    category: "derived",
    aggregationBehavior: "derived_ratio",
    higherIsBetter: true,
    formula: "(reach / impressions) * 100",
    isSystem: true,
  },
  {
    key: "meaningful_share_ratio",
    displayName: "Meaningful Share Ratio",
    description: "Distribution advocacy rate measured as shares per 1,000 views.",
    unit: "ratio_per_1k",
    scope: "content",
    category: "derived",
    aggregationBehavior: "derived_ratio",
    higherIsBetter: true,
    formula: "(shares / views) * 1,000",
    isSystem: true,
  },
];

export const listMetricDefinitions = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    // Fetch custom metrics created by the organization
    const customMetrics = await ctx.db
      .query("metricDefinitions")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    // Merge system metrics with custom organization metrics
    return [
      ...SYSTEM_METRIC_DEFINITIONS.map((m) => ({
        ...m,
        _id: `system_${m.key}`,
        organizationId: undefined,
        createdAt: 0,
      })),
      ...customMetrics,
    ];
  },
});

export const createCustomMetric = mutation({
  args: {
    organizationId: v.id("organizations"),
    key: v.string(),
    displayName: v.string(),
    description: v.string(),
    unit: v.string(),
    scope: v.union(
      v.literal("content"),
      v.literal("account"),
      v.literal("cross_channel")
    ),
    category: v.union(
      v.literal("reach"),
      v.literal("engagement"),
      v.literal("action"),
      v.literal("audience"),
      v.literal("derived")
    ),
    aggregationBehavior: v.union(
      v.literal("sum"),
      v.literal("average"),
      v.literal("latest"),
      v.literal("derived_ratio")
    ),
    higherIsBetter: v.boolean(),
    formula: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
    ]);

    const sanitizedKey = args.key.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_");
    if (!sanitizedKey) {
      throw new ValidationError("Metric key must be valid lowercase alphanumeric characters");
    }

    // Check collision with system metrics
    if (SYSTEM_METRIC_DEFINITIONS.some((m) => m.key === sanitizedKey)) {
      throw new ValidationError(`Metric key '${sanitizedKey}' is reserved by system defaults`);
    }

    const metricId = await ctx.db.insert("metricDefinitions", {
      organizationId: args.organizationId,
      key: sanitizedKey,
      displayName: args.displayName.trim(),
      description: args.description.trim(),
      unit: args.unit,
      scope: args.scope,
      category: args.category,
      aggregationBehavior: args.aggregationBehavior,
      higherIsBetter: args.higherIsBetter,
      formula: args.formula?.trim(),
      isSystem: false,
      createdAt: Date.now(),
    });

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "create_custom_metric",
      entityType: "metric_definition",
      entityId: metricId,
      metadata: { key: sanitizedKey, displayName: args.displayName },
    });

    return metricId;
  },
});

export const deleteCustomMetric = mutation({
  args: {
    organizationId: v.id("organizations"),
    metricId: v.id("metricDefinitions"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
    ]);

    const metric = await ctx.db.get(args.metricId);
    if (!metric || metric.organizationId !== args.organizationId) {
      throw new NotFoundError("MetricDefinition", args.metricId);
    }

    if (metric.isSystem) {
      throw new ValidationError("Cannot delete default system metrics");
    }

    await ctx.db.delete(args.metricId);

    await logAuditEvent(ctx, {
      organizationId: args.organizationId,
      actorUserId: user._id,
      action: "delete_custom_metric",
      entityType: "metric_definition",
      entityId: args.metricId,
      metadata: { key: metric.key },
    });

    return { success: true };
  },
});
