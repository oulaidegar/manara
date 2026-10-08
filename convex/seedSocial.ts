import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationMember } from "./lib/auth";
import { Id } from "./_generated/dataModel";

export const seedSocialData = mutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMember(ctx, args.organizationId);

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // 1. Create or ensure 4 social accounts: Instagram, LinkedIn, TikTok, YouTube
    const accountConfigs = [
      {
        platform: "instagram" as const,
        handle: "civic_watchdog",
        displayName: "Civic Watchdog",
        followerCount: 42500,
        followingCount: 412,
        totalPosts: 38,
      },
      {
        platform: "linkedin" as const,
        handle: "civic-accountability-institute",
        displayName: "Civic Accountability Institute",
        followerCount: 28400,
        followingCount: 190,
        totalPosts: 26,
      },
      {
        platform: "youtube" as const,
        handle: "CivicWatchdogMedia",
        displayName: "Civic Watchdog Media",
        followerCount: 54100,
        followingCount: 85,
        totalPosts: 22,
      },
      {
        platform: "tiktok" as const,
        handle: "civicwatchdog",
        displayName: "Civic Watchdog Quick Takes",
        followerCount: 36800,
        followingCount: 320,
        totalPosts: 24,
      },
    ];

    const accountIds: Record<string, Id<"socialAccounts">> = {};

    for (const conf of accountConfigs) {
      const existing = await ctx.db
        .query("socialAccounts")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .filter((q) =>
          q.and(
            q.eq(q.field("platform"), conf.platform),
            q.eq(q.field("handle"), conf.handle)
          )
        )
        .first();

      if (existing) {
        accountIds[conf.platform] = existing._id;
      } else {
        const id = await ctx.db.insert("socialAccounts", {
          organizationId: args.organizationId,
          platform: conf.platform,
          handle: conf.handle,
          displayName: conf.displayName,
          externalAccountId: `seed_${conf.platform}_${conf.handle}`,
          profileUrl: `https://${conf.platform}.com/${conf.handle}`,
          followerCount: conf.followerCount,
          followingCount: conf.followingCount,
          totalPosts: conf.totalPosts,
          verificationStatus: true,
          provider: "socialcrawl",
          syncEnabled: true,
          lastSyncedAt: now,
          createdAt: now - 90 * dayMs,
          updatedAt: now,
        });
        accountIds[conf.platform] = id;
      }
    }

    // 2. Create 2 Campaigns (Section 35)
    let campHousingId;
    const existingHousingCamp = await ctx.db
      .query("campaigns")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("name"), "National Housing Accountability Inquiry"))
      .first();

    if (existingHousingCamp) {
      campHousingId = existingHousingCamp._id;
    } else {
      campHousingId = await ctx.db.insert("campaigns", {
        organizationId: args.organizationId,
        name: "National Housing Accountability Inquiry",
        description: "Investigating corporate acquisitions of affordable residential housing and advocating municipal rent stabilization.",
        startDate: now - 60 * dayMs,
        objectives: ["Publish 3 investigative explainers", "Engage municipal councils", "Mobilize tenant associations"],
        status: "active",
        createdAt: now - 60 * dayMs,
        updatedAt: now,
      });
    }

    let campClimateId;
    const existingClimateCamp = await ctx.db
      .query("campaigns")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("name"), "Industrial Emissions Transparency"))
      .first();

    if (existingClimateCamp) {
      campClimateId = existingClimateCamp._id;
    } else {
      campClimateId = await ctx.db.insert("campaigns", {
        organizationId: args.organizationId,
        name: "Industrial Emissions Transparency",
        description: "Monitoring undisclosed carbon emissions in heavy industry and advancing mandatory corporate disclosure standards.",
        startDate: now - 75 * dayMs,
        objectives: ["Disclose unverified factory data", "Brief environmental protection regulators"],
        status: "active",
        createdAt: now - 75 * dayMs,
        updatedAt: now,
      });
    }

    // 3. Generate 110 Realistic Posts Across Formats (Section 61)
    const archetypes = [
      {
        topic: "Housing Justice",
        subtopics: ["rent control", "affordable housing", "tenants rights"],
        format: "explainer",
        purpose: "education",
        hook: "statistic",
        cta: "read",
        campaign: campHousingId,
        tones: ["urgent", "informative"],
        containsStatistic: true,
        containsPerson: false,
        containsQuote: false,
        containsQuestion: false,
        summary: "Analysis of national rent inflation outpacing median household income by 2.4x over five years.",
      },
      {
        topic: "Industrial Climate Accounting",
        subtopics: ["fossil fuels", "emissions tracking", "clean energy"],
        format: "video",
        purpose: "advocacy",
        hook: "breaking_news",
        cta: "share",
        campaign: campClimateId,
        tones: ["critical", "authoritative"],
        containsStatistic: true,
        containsPerson: true,
        containsQuote: true,
        containsQuestion: false,
        summary: "Satellite imagery reveals unreported flare stack methane leaks exceeding permitted environmental thresholds.",
      },
      {
        topic: "Judicial Court Backlogs",
        subtopics: ["access to justice", "legal aid", "transparency"],
        format: "investigation",
        purpose: "awareness",
        hook: "personal_story",
        cta: "sign",
        campaign: undefined,
        tones: ["investigative", "empathetic"],
        containsStatistic: true,
        containsPerson: true,
        containsQuote: true,
        containsQuestion: false,
        summary: "Decade-long procedural delays in regional civil courts denying basic remedies to vulnerable families.",
      },
      {
        topic: "Public Hospital Procurement",
        subtopics: ["anti-corruption", "public funds", "healthcare"],
        format: "report",
        purpose: "mobilization",
        hook: "strong_claim",
        cta: "read",
        campaign: undefined,
        tones: ["serious", "informative"],
        containsStatistic: true,
        containsPerson: false,
        containsQuote: true,
        containsQuestion: false,
        summary: "Expose on single-source vendor contracts inflating specialized medical equipment prices by 40%.",
      },
      {
        topic: "Digital Surveillance In Transit",
        subtopics: ["biometrics", "civil liberties", "privacy"],
        format: "reel",
        purpose: "education",
        hook: "question",
        cta: "comment",
        campaign: undefined,
        tones: ["provocative", "urgent"],
        containsStatistic: false,
        containsPerson: true,
        containsQuote: false,
        containsQuestion: true,
        summary: "Testing facial recognition scanners installed without parliamentary consultation in metropolitan train stations.",
      },
      {
        topic: "Rural Clean Water Mandates",
        subtopics: ["water quality", "public health", "infrastructure"],
        format: "carousel",
        purpose: "advocacy",
        hook: "statistic",
        cta: "donate",
        campaign: undefined,
        tones: ["informative", "compassionate"],
        containsStatistic: true,
        containsPerson: false,
        containsQuote: false,
        containsQuestion: false,
        summary: "Interactive data cards mapping lead contamination hot-spots across 14 municipal district schools.",
      },
    ];

    const platformsList = ["instagram", "linkedin", "youtube", "tiktok"] as const;
    let createdPostCount = 0;

    for (let i = 0; i < 110; i++) {
      const platform = platformsList[i % platformsList.length];
      const accountId = accountIds[platform];
      const archetype = archetypes[i % archetypes.length];
      const publishedAt = now - (i * 0.8 + 0.5) * dayMs;
      const externalPostId = `seed_${platform}_post_${2000 + i}`;

      // Check if post already exists
      const existingPost = await ctx.db
        .query("socialPosts")
        .withIndex("by_account_externalPostId", (q) =>
          q.eq("accountId", accountId).eq("externalPostId", externalPostId)
        )
        .first();

      if (existingPost) continue;

      // Deterministic realistic metrics with log-normal distribution
      const baseViews = Math.floor(12000 + (Math.sin(i * 0.45) * 0.5 + 0.5) * 88000 + (i % 7 === 0 ? 140000 : 0));
      const impressions = Math.round(baseViews * 1.2);
      const reach = Math.round(baseViews * 0.82);
      const likes = Math.round(baseViews * (0.028 + (i % 3) * 0.007));
      const comments = Math.round(likes * 0.065);
      const shares = Math.round(likes * (archetype.format === "explainer" || archetype.format === "video" ? 0.32 : 0.16));
      const saves = Math.round(likes * (archetype.format === "explainer" || archetype.format === "carousel" ? 0.28 : 0.15));
      const clicks = Math.round(likes * 0.14);

      const engagementCount = likes + comments + shares + saves + clicks;
      const engagementRate = Number((engagementCount / impressions).toFixed(4));
      const shareRate = Number((shares / baseViews).toFixed(4));
      const commentRate = Number((comments / baseViews).toFixed(4));
      const saveRate = Number((saves / baseViews).toFixed(4));

      // Public-Interest Engagement Index (Pillar 1)
      const weightedScore = (saves * 5) + (shares * 3) + (comments * 2) + (likes * 1);
      const pieiScore = Number(((weightedScore / reach) * 100).toFixed(2));
      let convictionTier: "exceptional" | "high" | "moderate" | "baseline" = "baseline";
      if (pieiScore >= 25) convictionTier = "exceptional";
      else if (pieiScore >= 12) convictionTier = "high";
      else if (pieiScore >= 5) convictionTier = "moderate";

      const postAgeDays = (now - publishedAt) / dayMs;
      const isEvergreen = postAgeDays >= 14 && (saves >= 35 || shares >= 45 || (i % 4 === 0));
      const evergreenScore = isEvergreen ? Number((pieiScore * 1.25).toFixed(1)) : undefined;
      const velocityRatio24h = Math.round((Math.round(baseViews * 0.65) / baseViews) * 100);

      const postId = await ctx.db.insert("socialPosts", {
        organizationId: args.organizationId,
        accountId,
        platform,
        externalPostId,
        url: `https://${platform}.com/p/${externalPostId}`,
        publishedAt,
        title: `${archetype.topic}: Key Findings & Analysis #${i + 1}`,
        caption: `Our ongoing public inquiry into ${archetype.topic.toLowerCase()} highlights systemic oversight deficits. Read our evidence dossier and see why immediate institutional response is warranted. #${archetype.subtopics[0].replace(/\s+/g, "")} #RadarIntelligence`,
        postType: archetype.format,
        authorName: "Civic Watchdog",
        authorHandle: `@civic_watchdog`,
        views: baseViews,
        impressions,
        reach,
        likes,
        comments,
        shares,
        saves,
        clicks,
        engagementCount,
        engagementRate,
        engagementRateBasis: "impressions",
        shareRate,
        commentRate,
        saveRate,
        pieiScore,
        pieiBasis: "reach",
        convictionTier,
        isEvergreen,
        evergreenScore,
        velocityRatio24h,
        analysisStatus: "complete",
        lastMetricsSyncAt: now,
        provider: "socialcrawl",
        createdAt: publishedAt,
        updatedAt: now,
      });

      // Insert multiple snapshots to render time series (Section 10 & 24)
      await ctx.db.insert("postMetricSnapshots", {
        organizationId: args.organizationId,
        postId,
        capturedAt: publishedAt + 6 * 3600 * 1000, // +6 hours
        views: Math.round(baseViews * 0.25),
        likes: Math.round(likes * 0.28),
        shares: Math.round(shares * 0.3),
        comments: Math.round(comments * 0.25),
        provider: "socialcrawl",
      });

      await ctx.db.insert("postMetricSnapshots", {
        organizationId: args.organizationId,
        postId,
        capturedAt: publishedAt + dayMs, // +24 hours
        views: Math.round(baseViews * 0.65),
        likes: Math.round(likes * 0.7),
        shares: Math.round(shares * 0.72),
        comments: Math.round(comments * 0.68),
        provider: "socialcrawl",
      });

      await ctx.db.insert("postMetricSnapshots", {
        organizationId: args.organizationId,
        postId,
        capturedAt: now, // current snapshot
        views: baseViews,
        impressions,
        reach,
        likes,
        comments,
        shares,
        saves,
        clicks,
        provider: "socialcrawl",
      });

      // Insert structured content analysis (Section 26 & 27)
      await ctx.db.insert("postAnalysis", {
        postId,
        organizationId: args.organizationId,
        primaryTopic: archetype.topic,
        topics: archetype.subtopics,
        contentFormat: archetype.format,
        contentPurpose: archetype.purpose,
        tone: archetype.tones,
        hookType: archetype.hook,
        ctaType: archetype.cta,
        slideBracket: archetype.format === "carousel" ? "6-10 slides" : undefined,
        videoLengthBracket: archetype.format === "video" || archetype.format === "reel" ? "30-90s" : undefined,
        targetAudience: "Advocacy professionals and policymaking bodies",
        narrativeStyle: "Evidence-first investigative explainer",
        containsStatistic: archetype.containsStatistic,
        containsQuote: archetype.containsQuote,
        containsPerson: archetype.containsPerson,
        containsQuestion: archetype.containsQuestion,
        summary: archetype.summary,
        explanation: `This post delivered a Public-Interest Engagement Index (PIEI) of ${pieiScore}. It achieved substantial sharing & evidence archiving density via a verified ${archetype.hook} hook and a clear call-to-action to ${archetype.cta}.`,
        analysisVersion: "post-analysis-v1",
        analyzedAt: now,
      });

      // If tied to campaign, create campaign association (Section 35)
      if (archetype.campaign) {
        await ctx.db.insert("campaignContent", {
          organizationId: args.organizationId,
          campaignId: archetype.campaign,
          postId,
          associationType: "rule_based",
          confidence: 0.95,
          createdAt: publishedAt,
        });
      }

      createdPostCount++;
    }

    // 4. Seed Impact Events & Evidence for Campaigns (Section 42-44)
    const existingImpact = await ctx.db
      .query("impactEvents")
      .withIndex("by_campaign", (q) => q.eq("campaignId", campHousingId))
      .first();

    if (!existingImpact) {
      const ev1 = await ctx.db.insert("impactEvents", {
        organizationId: args.organizationId,
        campaignId: campHousingId,
        type: "policy_change",
        title: "Municipal Council adopts emergency tenant rent stabilization resolution",
        summary: "Following public release of the inquiry data visualization series, City Council passed Resolution 412 establishing emergency limits on corporate landlord increases.",
        occurredAt: now - 14 * dayMs,
        discoveredAt: now - 12 * dayMs,
        confidence: 0.96,
        status: "verified",
      });

      await ctx.db.insert("impactEvidence", {
        organizationId: args.organizationId,
        impactEventId: ev1,
        sourceUrl: "https://citycouncil.gov/resolutions/2026-412",
        sourceTitle: "City Council Legislative Record: Resolution 412",
        publisher: "City Governance Secretariat",
        publishedAt: now - 14 * dayMs,
        evidenceText: "Councilor Higgins cited the civil society housing affordability dataset in amendment 4B, noting 'the quantitative clarity provided by civic researchers directly informed these statutory caps.'",
        retrievedAt: now - 12 * dayMs,
        sourceType: "official_record",
      });

      const ev2 = await ctx.db.insert("impactEvents", {
        organizationId: args.organizationId,
        campaignId: campHousingId,
        type: "media_mention",
        title: "National Broadcaster features inquiry findings in prime time investigative segment",
        summary: "Lead national television broadcaster aired an 18-minute special documentary based on campaign findings, interviewing impacted families and citing the report.",
        occurredAt: now - 28 * dayMs,
        discoveredAt: now - 27 * dayMs,
        confidence: 0.92,
        status: "verified",
      });

      await ctx.db.insert("impactEvidence", {
        organizationId: args.organizationId,
        impactEventId: ev2,
        sourceUrl: "https://nationalbroadcast.org/investigates/housing-crisis",
        sourceTitle: "The Hidden Cost of Living: Corporate Landlord Cartels",
        publisher: "Public Broadcast Service",
        publishedAt: now - 28 * dayMs,
        evidenceText: "Featuring forensic data collected and published by the civic investigative network, showing 40% higher eviction filings in corporate-owned buildings.",
        retrievedAt: now - 27 * dayMs,
        sourceType: "broadcast",
      });

      const ev3 = await ctx.db.insert("impactEvents", {
        organizationId: args.organizationId,
        campaignId: campClimateId,
        type: "institutional_mention",
        title: "Environmental Protection Authority opens formal review into refinery flaring",
        summary: "State environmental regulator formally cited campaign air monitor data in order requiring continuous emissions telemetry from 3 major refinery facilities.",
        occurredAt: now - 20 * dayMs,
        discoveredAt: now - 18 * dayMs,
        confidence: 0.94,
        status: "verified",
      });

      await ctx.db.insert("impactEvidence", {
        organizationId: args.organizationId,
        impactEventId: ev3,
        sourceUrl: "https://epa.gov/enforcement/actions/refinery-flaring-review",
        sourceTitle: "EPA Notice of Formal Investigative Review 2026-09",
        publisher: "Environmental Protection Authority",
        publishedAt: now - 20 * dayMs,
        evidenceText: "Acting on documented particulate anomalies corroborated by community science data and public advocacy disclosures.",
        retrievedAt: now - 18 * dayMs,
        sourceType: "regulatory_notice",
      });
    }

    return {
      success: true,
      accountsCreated: accountConfigs.length,
      postsCreated: createdPostCount,
    };
  },
});
