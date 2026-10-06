import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerkUserId", ["clerkUserId"]),

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    organizationType: v.union(
      v.literal("ngo"),
      v.literal("independent_media"),
      v.literal("advocacy"),
      v.literal("research"),
      v.literal("watchdog"),
      v.literal("foundation"),
      v.literal("community_organization"),
      v.literal("other")
    ),
    country: v.optional(v.string()),
    timezone: v.optional(v.string()),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
    onboardingStatus: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

  memberships: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("analyst"),
      v.literal("contributor"),
      v.literal("viewer")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_organization_user", ["organizationId", "userId"]),

  invitations: defineTable({
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("analyst"),
      v.literal("contributor"),
      v.literal("viewer")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("expired"),
      v.literal("revoked")
    ),
    invitedBy: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_email", ["email"])
    .index("by_token", ["token"]),

  auditEvents: defineTable({
    organizationId: v.id("organizations"),
    actorUserId: v.id("users"),
    action: v.string(),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_organization", ["organizationId"]),

  // --- Accounts & Integrations ---
  socialAccounts: defineTable({
    organizationId: v.id("organizations"),
    provider: v.string(),
    externalAccountId: v.string(),
    name: v.string(),
    handle: v.string(),
    url: v.optional(v.string()),
    accountType: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_organization", ["organizationId"]),

  // --- Canonical Content Model (Section 13) ---
  contentItems: defineTable({
    organizationId: v.id("organizations"),
    accountId: v.optional(v.id("socialAccounts")),
    provider: v.string(),
    externalId: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    origin: v.union(
      v.literal("social"),
      v.literal("website"),
      v.literal("newsletter"),
      v.literal("manual"),
      v.literal("csv_import"),
      v.literal("other")
    ),
    contentType: v.union(
      v.literal("post"),
      v.literal("video"),
      v.literal("short_video"),
      v.literal("article"),
      v.literal("report"),
      v.literal("investigation"),
      v.literal("newsletter"),
      v.literal("podcast"),
      v.literal("event"),
      v.literal("research"),
      v.literal("press_release"),
      v.literal("other")
    ),
    title: v.string(),
    text: v.optional(v.string()),
    publishedAt: v.number(),
    mediaType: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    language: v.optional(v.string()),
    authorName: v.optional(v.string()),
    metrics: v.optional(
      v.object({
        impressions: v.optional(v.number()),
        reach: v.optional(v.number()),
        views: v.optional(v.number()),
        likes: v.optional(v.number()),
        comments: v.optional(v.number()),
        shares: v.optional(v.number()),
        saves: v.optional(v.number()),
        clicks: v.optional(v.number()),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_publishedAt", ["organizationId", "publishedAt"])
    .index("by_account", ["accountId"]),

  // --- Initiatives (Section 10) ---
  initiatives: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    ownerUserId: v.optional(v.id("users")),
    primaryGoal: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
    archivedAt: v.optional(v.number()),
  }).index("by_organization", ["organizationId"]),

  // --- Many-to-Many Initiative Content Links (Section 14) ---
  initiativeContentLinks: defineTable({
    organizationId: v.id("organizations"),
    initiativeId: v.id("initiatives"),
    contentItemId: v.id("contentItems"),
    createdAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_initiative", ["initiativeId"])
    .index("by_contentItem", ["contentItemId"]),

  // --- Goals & Indicators (Section 11) ---
  goals: defineTable({
    organizationId: v.id("organizations"),
    initiativeId: v.id("initiatives"),
    title: v.string(),
    description: v.optional(v.string()),
    goalType: v.union(
      v.literal("awareness"),
      v.literal("engagement"),
      v.literal("audience_growth"),
      v.literal("behavior_change"),
      v.literal("media_attention"),
      v.literal("policy_change"),
      v.literal("institutional_change"),
      v.literal("capacity"),
      v.literal("fundraising"),
      v.literal("other")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_initiative", ["initiativeId"]),

  goalIndicators: defineTable({
    organizationId: v.id("organizations"),
    goalId: v.id("goals"),
    metricKey: v.string(),
    description: v.string(),
    baselineValue: v.number(),
    targetValue: v.number(),
    currentValue: v.optional(v.number()),
    direction: v.union(
      v.literal("increase"),
      v.literal("decrease"),
      v.literal("maintain"),
      v.literal("qualitative")
    ),
    periodStart: v.optional(v.number()),
    periodEnd: v.optional(v.number()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_goal", ["goalId"]),

  // --- Metric Observations (Section 17) ---
  contentMetricObservations: defineTable({
    organizationId: v.id("organizations"),
    contentItemId: v.id("contentItems"),
    metricKey: v.string(),
    providerMetricName: v.string(),
    value: v.number(),
    observedAt: v.number(),
    sourcePeriodStart: v.optional(v.number()),
    sourcePeriodEnd: v.optional(v.number()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_contentItem", ["contentItemId"])
    .index("by_organization_metricKey", ["organizationId", "metricKey"]),

  // --- Real-World Impact & Evidence (Section 27, 29, 31) ---
  actors: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_organization", ["organizationId"]),

  outcomes: defineTable({
    organizationId: v.id("organizations"),
    initiativeId: v.optional(v.id("initiatives")),
    title: v.string(),
    description: v.string(),
    occurredAt: v.number(),
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
    verificationStatus: v.union(
      v.literal("candidate"),
      v.literal("documented"),
      v.literal("corroborated"),
      v.literal("verified"),
      v.literal("rejected")
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_initiative", ["initiativeId"]),

  evidenceItems: defineTable({
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
    verificationStatus: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_outcome", ["outcomeId"]),

  // --- Learning Engine: Hypotheses & Practices (Section 33) ---
  practices: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.string(),
    hypothesis: v.string(),
    metricKey: v.string(),
    status: v.string(),
    source: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_organization", ["organizationId"]),

  practiceEvaluations: defineTable({
    organizationId: v.id("organizations"),
    practiceId: v.id("practices"),
    periodStart: v.number(),
    periodEnd: v.number(),
    matchingSampleSize: v.number(),
    comparisonSampleSize: v.number(),
    matchingMetricValue: v.number(),
    comparisonMetricValue: v.number(),
    difference: v.number(),
    confidenceLabel: v.union(
      v.literal("insufficient_data"),
      v.literal("weak_signal"),
      v.literal("positive_signal"),
      v.literal("negative_signal"),
      v.literal("strong_signal")
    ),
    calculatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_practice", ["practiceId"]),

  // --- Reports & Snapshots (Section 38 & 39) ---
  reports: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.optional(v.string()),
    reportType: v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("annual"),
      v.literal("campaign"),
      v.literal("donor"),
      v.literal("board"),
      v.literal("editorial"),
      v.literal("custom")
    ),
    periodStart: v.number(),
    periodEnd: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  }).index("by_organization", ["organizationId"]),

  reportBlocks: defineTable({
    organizationId: v.id("organizations"),
    reportId: v.id("reports"),
    type: v.union(
      v.literal("heading"),
      v.literal("text"),
      v.literal("executive_summary"),
      v.literal("kpi_scorecard"),
      v.literal("chart"),
      v.literal("content_highlights"),
      v.literal("outcome"),
      v.literal("evidence"),
      v.literal("learning"),
      v.literal("recommendation"),
      v.literal("methodology"),
      v.literal("divider")
    ),
    position: v.number(),
    configuration: v.optional(v.any()),
    snapshotData: v.optional(v.any()),
    snapshotAt: v.optional(v.number()),
    generatedText: v.optional(v.string()),
    editedText: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_report", ["reportId"]),

  // --- CSV Ingestion Runs (Section 21) ---
  importRuns: defineTable({
    organizationId: v.id("organizations"),
    fileName: v.string(),
    sourcePlatform: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    rowCount: v.number(),
    importedCount: v.number(),
    updatedCount: v.number(),
    skippedCount: v.number(),
    errorCount: v.number(),
    errors: v.optional(
      v.array(
        v.object({
          rowNumber: v.number(),
          field: v.optional(v.string()),
          message: v.string(),
          rawData: v.optional(v.string()),
        })
      )
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_createdAt", ["organizationId", "createdAt"]),

  // --- Platform Sync Runs (Section 24) ---
  syncRuns: defineTable({
    organizationId: v.id("organizations"),
    accountId: v.optional(v.id("socialAccounts")),
    provider: v.string(),
    syncType: v.union(
      v.literal("content"),
      v.literal("metrics"),
      v.literal("full"),
      v.literal("manual")
    ),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("success"),
      v.literal("partial"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    cursor: v.optional(v.string()),
    recordsProcessed: v.number(),
    recordsCreated: v.number(),
    recordsUpdated: v.number(),
    attempt: v.number(),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    nextRetryAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_createdAt", ["organizationId", "createdAt"])
    .index("by_account", ["accountId"]),

  // --- Normalized Metric Definitions (Section 16) ---
  metricDefinitions: defineTable({
    organizationId: v.optional(v.id("organizations")),
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
    isSystem: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_key", ["key"]),

  // --- Organization Tags & Taxonomy (Section 15) ---
  organizationTags: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    slug: v.string(),
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
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_slug", ["organizationId", "slug"]),

  contentTags: defineTable({
    organizationId: v.id("organizations"),
    contentItemId: v.id("contentItems"),
    tagId: v.id("organizationTags"),
    source: v.union(
      v.literal("human"),
      v.literal("ai"),
      v.literal("import"),
      v.literal("system")
    ),
    confidence: v.optional(v.number()),
    model: v.optional(v.string()),
    assignedBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_contentItem", ["contentItemId"])
    .index("by_tag", ["tagId"]),
});
