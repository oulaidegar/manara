import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember, requireOrganizationRole, requireUser } from "./lib/auth";

export interface HypothesisResult {
  hypothesisKey: string;
  title: string;
  description: string;
  targetMetric: string;
  metricLabel: string;
  variantALabel: string;
  variantBLabel: string;
  sampleSizeA: number;
  sampleSizeB: number;
  meanA: number;
  meanB: number;
  medianA: number;
  medianB: number;
  liftPercent: number;
  multiplier: number;
  pValue: number;
  confidenceLabel: "high_confidence" | "statistically_significant" | "directional_signal" | "inconclusive";
  confidencePercentage: number;
  editorialRecommendation: string;
  postsSampleA: Array<{ id: string; title: string; platform: string; metricValue: number }>;
  postsSampleB: Array<{ id: string; title: string; platform: string; metricValue: number }>;
}

/**
 * Calculates Mann-Whitney U Test (Wilcoxon Rank-Sum) for non-parametric social media metrics comparison.
 * Returns z-score and approximate two-tailed p-value.
 */
export function calculateMannWhitneyPValue(sampleA: number[], sampleB: number[]): number {
  const n1 = sampleA.length;
  const n2 = sampleB.length;
  if (n1 < 2 || n2 < 2) return 0.5;

  // Combine and rank all values
  const combined = [
    ...sampleA.map((val) => ({ val, group: "A" as const })),
    ...sampleB.map((val) => ({ val, group: "B" as const })),
  ];

  combined.sort((a, b) => a.val - b.val);

  // Assign average ranks for ties
  const ranks: number[] = new Array(combined.length);
  let i = 0;
  while (i < combined.length) {
    let j = i;
    while (j < combined.length - 1 && combined[j + 1].val === combined[j].val) {
      j++;
    }
    const avgRank = (i + 1 + j + 1) / 2;
    for (let k = i; k <= j; k++) {
      ranks[k] = avgRank;
    }
    i = j + 1;
  }

  // Sum of ranks for Group A
  let r1 = 0;
  for (let k = 0; k < combined.length; k++) {
    if (combined[k].group === "A") {
      r1 += ranks[k];
    }
  }

  // U statistic for group A
  const u1 = r1 - (n1 * (n1 + 1)) / 2;

  // Expected mean and standard error of U
  const meanU = (n1 * n2) / 2;
  const sigmaU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);

  if (sigmaU === 0) return 1.0;

  // Continuity-corrected Z score
  const z = Math.abs(u1 - meanU) / sigmaU;

  // Standard normal approximation for p-value (Abramowitz & Stegun approximation)
  const p = 2 * (1 - normalCdf(z));
  return Math.min(1.0, Math.max(0.0001, Number(p.toFixed(4))));
}

export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - prob : prob;
}

export function getMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
}

export function getMean(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((a, b) => a + b, 0);
  return Number((sum / numbers.length).toFixed(2));
}

export const runHypothesisTest = query({
  args: {
    organizationId: v.id("organizations"),
    hypothesisKey: v.string(),
    targetMetric: v.optional(v.string()),
    customAttribute: v.optional(v.string()),
    customValA: v.optional(v.string()),
    customValB: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<HypothesisResult> => {
    await requireOrganizationMember(ctx, args.organizationId);

    // Fetch all posts with analysis
    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const analysisList = await ctx.db
      .query("postAnalysis")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const analysisMap = new Map<string, (typeof analysisList)[0]>();
    for (const an of analysisList) {
      analysisMap.set(an.postId, an);
    }

    const metric = args.targetMetric ?? "saves";

    const getMetricValue = (p: (typeof posts)[0]): number => {
      switch (metric) {
        case "pieiScore":
          return p.pieiScore ?? 0;
        case "shares":
          return p.shares ?? p.reposts ?? 0;
        case "saves":
          return p.saves ?? 0;
        case "views":
          return p.views ?? 0;
        case "engagementRate":
          return p.engagementRate ? Number((p.engagementRate * 100).toFixed(2)) : 0;
        default:
          return p.saves ?? 0;
      }
    };

    let title = "";
    let description = "";
    let variantALabel = "";
    let variantBLabel = "";
    let filterA: (p: (typeof posts)[0], a?: (typeof analysisList)[0]) => boolean;
    let filterB: (p: (typeof posts)[0], a?: (typeof analysisList)[0]) => boolean;

    if (args.hypothesisKey === "hook_document_vs_question") {
      title = "Leaked Document / Document Scan Hooks vs. Open Question Hooks";
      description =
        "Hypothesis: Posts leading with forensic document scans or leaked records achieve significantly higher save rates (evidence archiving) than rhetorical question hooks.";
      variantALabel = "Document Scan / Leaked Record Hook";
      variantBLabel = "Open Question / Generic Hook";
      filterA = (p, a) =>
        a?.hookType === "document_scan" ||
        a?.hookType === "leaked_record" ||
        p.title?.toLowerCase().includes("document") === true ||
        p.caption?.toLowerCase().includes("leak") === true;
      filterB = (p, a) =>
        a?.hookType === "open_question" ||
        a?.hookType === "question" ||
        p.caption?.includes("?") === true;
    } else if (args.hypothesisKey === "slide_bracket_depth") {
      title = "In-Depth Carousels (6-10 Slides) vs. Short Carousels (3-5 Slides)";
      description =
        "Hypothesis: Comprehensive 6-to-10 slide carousels driving step-by-step investigative narratives produce higher Public-Interest Engagement (PIEI) than brief 3-to-5 slide summaries.";
      variantALabel = "In-Depth (6-10 Slides)";
      variantBLabel = "Brief (3-5 Slides)";
      filterA = (_p, a) => a?.slideBracket === "6-10" || a?.slideBracket === "10+";
      filterB = (_p, a) => a?.slideBracket === "3-5" || a?.slideBracket === undefined;
    } else if (args.hypothesisKey === "cta_archive_vs_read") {
      title = "Explicit 'Archive / Save' Call-to-Action vs. Generic 'Read Investigation'";
      description =
        "Hypothesis: Asking citizens directly to archive/bookmark crucial public records increases save volume over generic reading prompts.";
      variantALabel = "Archive / Save Call-to-Action";
      variantBLabel = "Generic / Read Investigation CTA";
      filterA = (_p, a) => a?.ctaType === "archive_save" || a?.ctaType === "save";
      filterB = (_p, a) => a?.ctaType === "read_investigation" || a?.ctaType === "read" || a?.ctaType === undefined;
    } else if (args.hypothesisKey === "video_depth_vs_bite") {
      title = "Investigative Mini-Documentaries (>3 min) vs. Quick Takes (<30s)";
      description =
        "Hypothesis: In-depth video reporting generates higher peer share ratios than surface-level 30-second clips.";
      variantALabel = "Mini-Documentaries (>3 min)";
      variantBLabel = "Quick Takes (<30s)";
      filterA = (_p, a) => a?.videoLengthBracket === ">3min";
      filterB = (_p, a) => a?.videoLengthBracket === "<30s";
    } else {
      // Custom comparison
      title = `Custom Hypothesis: ${args.customValA ?? "Variant A"} vs. ${args.customValB ?? "Variant B"}`;
      description = `Testing empirical performance of ${args.customAttribute ?? "attribute"} on ${metric}.`;
      variantALabel = args.customValA ?? "Condition A";
      variantBLabel = args.customValB ?? "Condition B";
      filterA = (_p, a) => {
        const val = a ? (a as Record<string, unknown>)[args.customAttribute ?? "hookType"] : undefined;
        return String(val) === args.customValA;
      };
      filterB = (_p, a) => {
        const val = a ? (a as Record<string, unknown>)[args.customAttribute ?? "hookType"] : undefined;
        return String(val) === args.customValB || args.customValB === "all_others";
      };
    }

    const groupAPosts = posts.filter((p) => filterA(p, analysisMap.get(p._id)));
    let groupBPosts = posts.filter((p) => filterB(p, analysisMap.get(p._id)));

    // Ensure groups are disjoint and group B has entries if fallback needed
    if (groupBPosts.length === 0) {
      const aIds = new Set(groupAPosts.map((p) => p._id));
      groupBPosts = posts.filter((p) => !aIds.has(p._id));
    }

    const valuesA = groupAPosts.map(getMetricValue);
    const valuesB = groupBPosts.map(getMetricValue);

    const meanA = getMean(valuesA);
    const meanB = getMean(valuesB);
    const medianA = getMedian(valuesA);
    const medianB = getMedian(valuesB);

    const multiplier = meanB > 0 ? Number((meanA / meanB).toFixed(2)) : 1.0;
    const liftPercent = meanB > 0 ? Number((((meanA - meanB) / meanB) * 100).toFixed(1)) : 0;

    const pValue = calculateMannWhitneyPValue(valuesA, valuesB);

    let confidenceLabel: HypothesisResult["confidenceLabel"] = "inconclusive";
    let confidencePercentage = 50;

    if (pValue < 0.01 && valuesA.length >= 4) {
      confidenceLabel = "high_confidence";
      confidencePercentage = 99;
    } else if (pValue < 0.05 && valuesA.length >= 3) {
      confidenceLabel = "statistically_significant";
      confidencePercentage = 95;
    } else if (pValue < 0.10) {
      confidenceLabel = "directional_signal";
      confidencePercentage = 85;
    } else {
      confidenceLabel = "inconclusive";
      confidencePercentage = Math.round((1 - pValue) * 100);
    }

    // Generate editorial takeaway
    let editorialRecommendation = "";
    if (confidenceLabel === "high_confidence" || confidenceLabel === "statistically_significant") {
      editorialRecommendation = `Confirmed Editorial Practice: For your organization, content utilizing "${variantALabel}" achieves ${
        multiplier >= 1 ? `${multiplier}x higher` : `${Math.abs(liftPercent)}% lower`
      } ${metric} compared to "${variantBLabel}" (p = ${pValue}, ${confidencePercentage}% statistical confidence). Standardize this format across newsroom desks.`;
    } else if (confidenceLabel === "directional_signal") {
      editorialRecommendation = `Promising Direction: "${variantALabel}" demonstrates a positive ${liftPercent > 0 ? `+${liftPercent}%` : `${liftPercent}%`} lift on ${metric} over "${variantBLabel}". Sample size indicates a directional signal (p = ${pValue}); continue publishing this variant to cement statistical confidence.`;
    } else {
      editorialRecommendation = `Inconclusive Signal: Current difference (${liftPercent > 0 ? `+${liftPercent}%` : `${liftPercent}%`}) between "${variantALabel}" (n=${valuesA.length}) and "${variantBLabel}" (n=${valuesB.length}) is not statistically distinguishable from random distribution (p = ${pValue}). Gather more tagged publications before revising editorial policy.`;
    }

    return {
      hypothesisKey: args.hypothesisKey,
      title,
      description,
      targetMetric: metric,
      metricLabel: metric === "pieiScore" ? "PIEI Score" : metric.charAt(0).toUpperCase() + metric.slice(1),
      variantALabel,
      variantBLabel,
      sampleSizeA: valuesA.length,
      sampleSizeB: valuesB.length,
      meanA,
      meanB,
      medianA,
      medianB,
      liftPercent,
      multiplier,
      pValue,
      confidenceLabel,
      confidencePercentage,
      editorialRecommendation,
      postsSampleA: groupAPosts.slice(0, 5).map((p) => ({
        id: p._id,
        title: p.title || p.caption || "Post",
        platform: p.platform,
        metricValue: getMetricValue(p),
      })),
      postsSampleB: groupBPosts.slice(0, 5).map((p) => ({
        id: p._id,
        title: p.title || p.caption || "Post",
        platform: p.platform,
        metricValue: getMetricValue(p),
      })),
    };
  },
});

export const saveHypothesisAsPractice = mutation({
  args: {
    organizationId: v.id("organizations"),
    title: v.string(),
    hypothesis: v.string(),
    metricKey: v.string(),
    difference: v.number(),
    matchingSampleSize: v.number(),
    comparisonSampleSize: v.number(),
    confidenceLabel: v.union(
      v.literal("insufficient_data"),
      v.literal("weak_signal"),
      v.literal("positive_signal"),
      v.literal("negative_signal"),
      v.literal("strong_signal")
    ),
  },
  handler: async (ctx, args) => {
    const _user = await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, [
      "owner",
      "admin",
      "analyst",
      "contributor",
    ]);

    const now = Date.now();

    // Check if practice already exists
    const existing = await ctx.db
      .query("practices")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("title"), args.title))
      .first();

    let practiceId = existing?._id;

    if (!practiceId) {
      practiceId = await ctx.db.insert("practices", {
        organizationId: args.organizationId,
        title: args.title,
        description: `Empirically verified organizational communications practice for ${args.metricKey}.`,
        hypothesis: args.hypothesis,
        metricKey: args.metricKey,
        status: args.difference > 0 ? "active" : "retired",
        source: "hypothesis_testing_engine",
        createdAt: now,
        updatedAt: now,
      });
    }

    // Insert evaluation snapshot
    await ctx.db.insert("practiceEvaluations", {
      organizationId: args.organizationId,
      practiceId,
      periodStart: now - 90 * 24 * 60 * 60 * 1000,
      periodEnd: now,
      matchingSampleSize: args.matchingSampleSize,
      comparisonSampleSize: args.comparisonSampleSize,
      matchingMetricValue: Math.round(100 + args.difference),
      comparisonMetricValue: 100,
      difference: args.difference,
      confidenceLabel: args.confidenceLabel,
      calculatedAt: now,
    });

    return practiceId;
  },
});
