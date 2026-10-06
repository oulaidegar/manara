import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizationRole, requireUser } from "./lib/auth";

export const seedDemoData = mutation({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOrganizationRole(ctx, args.organizationId, ["owner", "admin", "analyst"]);

    // Check if already seeded to prevent duplication
    const existingContent = await ctx.db
      .query("contentItems")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first();

    if (existingContent) {
      return { message: "Organization already has content data.", count: 0 };
    }

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    // 1. Create Social Accounts
    const ytAccount = await ctx.db.insert("socialAccounts", {
      organizationId: args.organizationId,
      provider: "youtube",
      externalAccountId: "yt_civic_watch_01",
      name: "Public Interest Watch",
      handle: "@publicinterestwatch",
      url: "https://youtube.com/@publicinterestwatch",
      accountType: "channel",
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    const liAccount = await ctx.db.insert("socialAccounts", {
      organizationId: args.organizationId,
      provider: "linkedin",
      externalAccountId: "li_civic_watch_02",
      name: "Public Interest Watchdog Organization",
      handle: "public-interest-watch",
      url: "https://linkedin.com/company/public-interest-watch",
      accountType: "organization",
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    // Initial platform sync runs
    await ctx.db.insert("syncRuns", {
      organizationId: args.organizationId,
      accountId: ytAccount,
      provider: "youtube",
      syncType: "full",
      status: "success",
      startedAt: now - 2 * 60 * 60 * 1000,
      completedAt: now - 2 * 60 * 60 * 1000 + 45000,
      recordsProcessed: 65,
      recordsCreated: 65,
      recordsUpdated: 0,
      attempt: 1,
      createdAt: now - 2 * 60 * 60 * 1000,
    });

    await ctx.db.insert("syncRuns", {
      organizationId: args.organizationId,
      accountId: liAccount,
      provider: "linkedin",
      syncType: "full",
      status: "success",
      startedAt: now - 4 * 60 * 60 * 1000,
      completedAt: now - 4 * 60 * 60 * 1000 + 32000,
      recordsProcessed: 40,
      recordsCreated: 40,
      recordsUpdated: 0,
      attempt: 1,
      createdAt: now - 4 * 60 * 60 * 1000,
    });

    // Seed Organization Tags & Taxonomy (Section 15)
    await ctx.db.insert("organizationTags", {
      organizationId: args.organizationId,
      name: "Procurement Investigation",
      slug: "procurement-investigation",
      category: "topic",
      color: "#ef4444",
      description: "Tender transparency and public purse integrity reporting.",
      createdAt: now,
    });

    await ctx.db.insert("organizationTags", {
      organizationId: args.organizationId,
      name: "Judicial Transparency",
      slug: "judicial-transparency",
      category: "topic",
      color: "#3b82f6",
      description: "Conflict of interest audits and court calendar access.",
      createdAt: now,
    });

    await ctx.db.insert("organizationTags", {
      organizationId: args.organizationId,
      name: "Open Data Dossier",
      slug: "open-data-dossier",
      category: "format",
      color: "#10b981",
      description: "Structured spreadsheet datasets and freedom of information releases.",
      createdAt: now,
    });

    await ctx.db.insert("organizationTags", {
      organizationId: args.organizationId,
      name: "Parliamentary Briefing",
      slug: "parliamentary-briefing",
      category: "purpose",
      color: "#8b5cf6",
      description: "Executive summaries prepared for legislative inquiries.",
      createdAt: now,
    });

    // 2. Create 3 Initiatives
    const initProcurement = await ctx.db.insert("initiatives", {
      organizationId: args.organizationId,
      name: "Public Procurement Investigation",
      description:
        "Comprehensive investigative reporting on emergency tender inflation and sole-source infrastructure contracts.",
      status: "active",
      startDate: now - 90 * DAY,
      ownerUserId: user._id,
      primaryGoal: "policy_change",
      tags: ["investigation", "corruption", "transparency", "procurement"],
      createdAt: now,
      updatedAt: now,
    });

    const initJudicial = await ctx.db.insert("initiatives", {
      organizationId: args.organizationId,
      name: "Judicial Transparency Campaign",
      description:
        "Advocating for digital courtroom access and mandatory conflict-of-interest declarations for appellate judges.",
      status: "active",
      startDate: now - 60 * DAY,
      ownerUserId: user._id,
      primaryGoal: "institutional_change",
      tags: ["judiciary", "reform", "open-justice", "court-records"],
      createdAt: now,
      updatedAt: now,
    });

    const initClimate = await ctx.db.insert("initiatives", {
      organizationId: args.organizationId,
      name: "Climate Accountability Series",
      description:
        "Tracking corporate net-zero pledges against public regulatory filings and actual emissions audits.",
      status: "active",
      startDate: now - 45 * DAY,
      ownerUserId: user._id,
      primaryGoal: "awareness",
      tags: ["climate", "emissions", "corporate-transparency"],
      createdAt: now,
      updatedAt: now,
    });

    // 3. Create 4 Goals & Indicators
    const goal1 = await ctx.db.insert("goals", {
      organizationId: args.organizationId,
      initiativeId: initProcurement,
      title: "Expose inflated non-competitive public contracts",
      description: "Produce evidence-based investigations and ensure coverage by national media outlets.",
      goalType: "policy_change",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("goalIndicators", {
      organizationId: args.organizationId,
      goalId: goal1,
      metricKey: "shares",
      description: "Meaningful reposts and citations across public interest networks",
      baselineValue: 500,
      targetValue: 8000,
      currentValue: 6420,
      direction: "increase",
    });

    await ctx.db.insert("goals", {
      organizationId: args.organizationId,
      initiativeId: initProcurement,
      title: "Trigger official parliamentary review",
      description: "Brief members of parliament with vetted contract documentation.",
      goalType: "institutional_change",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("goals", {
      organizationId: args.organizationId,
      initiativeId: initJudicial,
      title: "Mandate open courtroom disclosure records",
      description: "Promote public petition and draft legislative amendments for judicial transparency.",
      goalType: "policy_change",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("goals", {
      organizationId: args.organizationId,
      initiativeId: initClimate,
      title: "Drive public understanding of disclosure gaps",
      description: "Publish data visualizations explaining industrial emissions under-reporting.",
      goalType: "awareness",
      createdAt: now,
      updatedAt: now,
    });

    // 4. Generate 105 realistic content items across 90 days
    const contentTitles = [
      // Procurement investigation pieces
      {
        title: "Investigation: How £45M in healthcare tenders bypassed competitive bidding",
        text: "Our six-month audit uncovered 14 consecutive sole-source contracts awarded to newly formed holding entities with no prior supply history.",
        type: "investigation" as const,
        provider: "website",
        origin: "website" as const,
        init: initProcurement,
        imp: 82500,
        reach: 54000,
        shares: 2450,
        saves: 820,
        clicks: 3400,
      },
      {
        title: "Video Breakdown: The Anatomy of a Phantom Procurement Tender",
        text: "Watch our lead investigator walk through the public registry documents and tracing payments across border jurisdictions.",
        type: "video" as const,
        provider: "youtube",
        origin: "social" as const,
        init: initProcurement,
        imp: 45000,
        reach: 32000,
        shares: 1120,
        saves: 480,
        clicks: 1850,
      },
      {
        title: "Document Release: Redacted Ministry of Finance Audit Reports (2024-2026)",
        text: "Full release of 340 pages of internal inspection reports obtained through Freedom of Information litigation.",
        type: "report" as const,
        provider: "website",
        origin: "website" as const,
        init: initProcurement,
        imp: 29000,
        reach: 19500,
        shares: 980,
        saves: 740,
        clicks: 2800,
      },
      {
        title: "Key Findings Thread: 5 patterns in sole-source infrastructure awards",
        text: "1. Rapid contract signing 48h before fiscal year end\n2. Lack of technical specifications\n3. Single bidder exclusions...",
        type: "post" as const,
        provider: "linkedin",
        origin: "social" as const,
        init: initProcurement,
        imp: 38000,
        reach: 24000,
        shares: 1450,
        saves: 610,
        clicks: 1200,
      },
      // Judicial transparency pieces
      {
        title: "Why Citizens Can't See Appellate Court Hearing Records Online",
        text: "A comparative audit of 18 regional appeals courts reveals that 75% require in-person fees simply to inspect public docket entries.",
        type: "article" as const,
        provider: "website",
        origin: "website" as const,
        init: initJudicial,
        imp: 24000,
        reach: 16800,
        shares: 620,
        saves: 340,
        clicks: 980,
      },
      {
        title: "Policy Memo: Modernizing Judicial Conflict-of-Interest Disclosures",
        text: "Our policy recommendations submitted to the parliamentary committee on open justice and judicial ethics.",
        type: "report" as const,
        provider: "website",
        origin: "website" as const,
        init: initJudicial,
        imp: 18500,
        reach: 12400,
        shares: 540,
        saves: 410,
        clicks: 1150,
      },
      {
        title: "Explainer: What happens when judges recuse without public explanation?",
        text: "Examining three years of judicial recusal patterns and the impact on public trust in legal adjudication.",
        type: "video" as const,
        provider: "youtube",
        origin: "social" as const,
        init: initJudicial,
        imp: 31000,
        reach: 22000,
        shares: 890,
        saves: 310,
        clicks: 1450,
      },
      // Climate accountability pieces
      {
        title: "Emissions Gap Report: Tracking corporate net-zero pledges vs verifiable filings",
        text: "An analysis of the top 50 industrial emitters shows a 34% divergence between self-reported marketing brochures and statutory filings.",
        type: "investigation" as const,
        provider: "website",
        origin: "website" as const,
        init: initClimate,
        imp: 41000,
        reach: 28000,
        shares: 1320,
        saves: 720,
        clicks: 2100,
      },
      {
        title: "Short Video: How carbon offset accounting loopholes work in 90 seconds",
        text: "Clear, visual explanation of phantom forestry offset credits using verified satellite radar tracking.",
        type: "short_video" as const,
        provider: "youtube",
        origin: "social" as const,
        init: initClimate,
        imp: 62000,
        reach: 48000,
        shares: 2100,
        saves: 890,
        clicks: 2400,
      },
      {
        title: "Monthly Public Interest Briefing — September 2026",
        text: "Overview of all active legal challenges, public records requests, and upcoming investigative publications.",
        type: "newsletter" as const,
        provider: "website",
        origin: "newsletter" as const,
        init: initProcurement,
        imp: 14000,
        reach: 11200,
        shares: 310,
        saves: 190,
        clicks: 1850,
      },
    ];

    let contentCount = 0;

    // Insert the 10 featured comprehensive items
    for (let i = 0; i < contentTitles.length; i++) {
      const item = contentTitles[i];
      const publishedAt = now - (i * 7 + 2) * DAY;
      const accountId = item.provider === "youtube" ? ytAccount : item.provider === "linkedin" ? liAccount : undefined;

      const contentItemId = await ctx.db.insert("contentItems", {
        organizationId: args.organizationId,
        accountId,
        provider: item.provider,
        origin: item.origin,
        contentType: item.type,
        title: item.title,
        text: item.text,
        publishedAt,
        metrics: {
          impressions: item.imp,
          reach: item.reach,
          shares: item.shares,
          saves: item.saves,
          clicks: item.clicks,
        },
        createdAt: publishedAt,
        updatedAt: publishedAt,
      });

      // Link to initiative
      await ctx.db.insert("initiativeContentLinks", {
        organizationId: args.organizationId,
        initiativeId: item.init,
        contentItemId,
        createdAt: publishedAt,
        createdBy: user._id,
      });

      // Insert metric observations
      await ctx.db.insert("contentMetricObservations", {
        organizationId: args.organizationId,
        contentItemId,
        metricKey: "impressions",
        providerMetricName: "raw_impressions",
        value: item.imp,
        observedAt: publishedAt + DAY,
      });

      await ctx.db.insert("contentMetricObservations", {
        organizationId: args.organizationId,
        contentItemId,
        metricKey: "shares",
        providerMetricName: "raw_shares",
        value: item.shares,
        observedAt: publishedAt + DAY,
      });

      contentCount++;
    }

    // Generate 95 additional realistic posts across the 90 days to exceed 100 items per Section 44
    const formatTypes: Array<"post" | "article" | "short_video" | "video"> = ["post", "article", "short_video", "video"];
    const providers = ["youtube", "linkedin", "website"];
    const inits = [initProcurement, initJudicial, initClimate];

    for (let i = 11; i <= 105; i++) {
      const daysAgo = Math.floor((i / 105) * 88) + 1;
      const publishedAt = now - daysAgo * DAY;
      const provider = providers[i % providers.length];
      const format = formatTypes[i % formatTypes.length];
      const init = inits[i % inits.length];

      const baseImp = 1500 + (i * 380) % 25000;
      const reach = Math.floor(baseImp * 0.72);
      const shares = Math.floor(baseImp * 0.038);
      const saves = Math.floor(baseImp * 0.018);
      const clicks = Math.floor(baseImp * 0.045);

      const title =
        format === "video" || format === "short_video"
          ? `Visual Audit #${i}: Tracking public disclosure discrepancies in ${daysAgo} days`
          : `Update #${i}: Field notes and documentation release on regulatory oversight`;

      const contentItemId = await ctx.db.insert("contentItems", {
        organizationId: args.organizationId,
        accountId: provider === "youtube" ? ytAccount : provider === "linkedin" ? liAccount : undefined,
        provider,
        origin: "social",
        contentType: format,
        title,
        text: `Periodic monitoring and verified update on ongoing public accountability investigations. Item sequence ${i}.`,
        publishedAt,
        metrics: {
          impressions: baseImp,
          reach,
          shares,
          saves,
          clicks,
        },
        createdAt: publishedAt,
        updatedAt: publishedAt,
      });

      await ctx.db.insert("initiativeContentLinks", {
        organizationId: args.organizationId,
        initiativeId: init,
        contentItemId,
        createdAt: publishedAt,
        createdBy: user._id,
      });

      contentCount++;
    }

    // 5. Create 5 Documented Outcomes (Section 27 & 44)
    const outcome1 = await ctx.db.insert("outcomes", {
      organizationId: args.organizationId,
      initiativeId: initProcurement,
      title: "Government opens procurement transparency review",
      description:
        "The Ministry of Finance formally instituted an independent review panel into non-competitive tender thresholds following public release of our audit report.",
      occurredAt: now - 18 * DAY,
      changeType: "policy",
      significance:
        "The review explicitly incorporates our 4 key recommendations on mandatory registry disclosures for contracts exceeding £5M.",
      contributionStatement:
        "Evidence indicates our investigative reporting directly surfaced the undisclosed contracts and provided the methodology adopted by the review committee.",
      contributionStrength: "strong_evidence",
      verificationStatus: "corroborated",
      createdBy: user._id,
      createdAt: now - 18 * DAY,
      updatedAt: now - 18 * DAY,
    });

    const outcome2 = await ctx.db.insert("outcomes", {
      organizationId: args.organizationId,
      initiativeId: initProcurement,
      title: "Parliamentary Public Accounts Committee launches inquiry",
      description:
        "Committee issued formal summons to procurement directors based on the documentation published in our investigation.",
      occurredAt: now - 12 * DAY,
      changeType: "investigation",
      significance: "Formal committee hearings with subpoena power.",
      contributionStatement:
        "Hearing transcripts cite our investigative report 14 times and adopted our contract risk index.",
      contributionStrength: "strong_evidence",
      verificationStatus: "verified",
      createdBy: user._id,
      createdAt: now - 12 * DAY,
      updatedAt: now - 12 * DAY,
    });

    const outcome3 = await ctx.db.insert("outcomes", {
      organizationId: args.organizationId,
      initiativeId: initJudicial,
      title: "Judicial council publishes revised conflict-of-interest code",
      description:
        "New ethical guidelines adopted requiring appellate judges to file annual public financial interest summaries.",
      occurredAt: now - 25 * DAY,
      changeType: "institutional_practice",
      significance: "First update to judicial disclosure standards in 14 years.",
      contributionStatement:
        "Our policy memorandum was cited in the explanatory notes of the Judicial Council Gazette.",
      contributionStrength: "plausible",
      verificationStatus: "corroborated",
      createdBy: user._id,
      createdAt: now - 25 * DAY,
      updatedAt: now - 25 * DAY,
    });

    const outcome4 = await ctx.db.insert("outcomes", {
      organizationId: args.organizationId,
      initiativeId: initProcurement,
      title: "National media consortium syndicates procurement audit findings",
      description:
        "Front-page investigative series across 4 major national newspapers covering tender inflation.",
      occurredAt: now - 35 * DAY,
      changeType: "media",
      significance: "Brought public accountability issues to an estimated 3.8 million readers.",
      contributionStatement:
        "We co-published the underlying dataset and provided verified document packets to editorial teams.",
      contributionStrength: "strong_evidence",
      verificationStatus: "documented",
      createdBy: user._id,
      createdAt: now - 35 * DAY,
      updatedAt: now - 35 * DAY,
    });

    const outcome5 = await ctx.db.insert("outcomes", {
      organizationId: args.organizationId,
      initiativeId: initJudicial,
      title: "Private members bill introduced for open courtroom dockets",
      description:
        "Bipartisan legislation introduced to mandate free online access to appeals court decisions and transcripts.",
      occurredAt: now - 6 * DAY,
      changeType: "law",
      significance: "Proposed statutory right to digital judicial records.",
      contributionStatement:
        "The bill's drafting sponsor consulted our research team on technical specifications for open docket portals.",
      contributionStrength: "plausible",
      verificationStatus: "candidate",
      createdBy: user._id,
      createdAt: now - 6 * DAY,
      updatedAt: now - 6 * DAY,
    });

    // 6. Create 10 Evidence Items (Section 31 & 44)
    await ctx.db.insert("evidenceItems", {
      organizationId: args.organizationId,
      outcomeId: outcome1,
      type: "official_document",
      title: "Ministry of Finance Gazette Directive No. 2026/842",
      url: "https://example.gov/gazette/2026-842",
      publisher: "Ministry of Finance",
      publishedAt: now - 18 * DAY,
      excerpt: "Establishing the Independent Panel on Non-Competitive Tender Review, with specific reference to sole-source infrastructure awards.",
      verificationStatus: "verified",
      createdBy: user._id,
      createdAt: now - 18 * DAY,
      updatedAt: now - 18 * DAY,
    });

    await ctx.db.insert("evidenceItems", {
      organizationId: args.organizationId,
      outcomeId: outcome1,
      type: "quote",
      title: "Panel Chairperson Opening Statement",
      publisher: "Public Press Conference",
      publishedAt: now - 17 * DAY,
      excerpt: "We recognize the detailed evidentiary dossier compiled by civic researchers regarding contract awards in Q1-Q2.",
      verificationStatus: "verified",
      createdBy: user._id,
      createdAt: now - 17 * DAY,
      updatedAt: now - 17 * DAY,
    });

    await ctx.db.insert("evidenceItems", {
      organizationId: args.organizationId,
      outcomeId: outcome2,
      type: "official_document",
      title: "Parliamentary Hansard Records — PAC Session 44",
      url: "https://parliament.example.org/hansard/session-44",
      publisher: "Parliamentary Information Service",
      publishedAt: now - 12 * DAY,
      excerpt: "Committee member question: 'I refer to page 18 of the Public Interest Watch report showing 14 sole-source contracts...'",
      verificationStatus: "verified",
      createdBy: user._id,
      createdAt: now - 12 * DAY,
      updatedAt: now - 12 * DAY,
    });

    await ctx.db.insert("evidenceItems", {
      organizationId: args.organizationId,
      outcomeId: outcome2,
      type: "media_article",
      title: "Broadcaster In-Depth Coverage of PAC Hearing",
      url: "https://nationalbroadcaster.example/news/hearing-tender-probe",
      publisher: "National News",
      publishedAt: now - 11 * DAY,
      excerpt: "Officials faced sharp questions over contract inflation first documented by investigative watchdogs.",
      verificationStatus: "verified",
      createdBy: user._id,
      createdAt: now - 11 * DAY,
      updatedAt: now - 11 * DAY,
    });

    await ctx.db.insert("evidenceItems", {
      organizationId: args.organizationId,
      outcomeId: outcome3,
      type: "official_document",
      title: "Judicial Council Administrative Order 2026-09",
      publisher: "High Judicial Council",
      publishedAt: now - 25 * DAY,
      excerpt: "Judges of the Court of Appeal shall henceforth deposit conflict declarations annually with the Registrar.",
      verificationStatus: "verified",
      createdBy: user._id,
      createdAt: now - 25 * DAY,
      updatedAt: now - 25 * DAY,
    });

    await ctx.db.insert("evidenceItems", {
      organizationId: args.organizationId,
      outcomeId: outcome3,
      type: "meeting_note",
      title: "Working Group Consultation Minutes",
      publisher: "Open Justice Alliance",
      publishedAt: now - 30 * DAY,
      excerpt: "Review of NGO policy submission with judicial ethics rapporteur.",
      verificationStatus: "documented",
      createdBy: user._id,
      createdAt: now - 30 * DAY,
      updatedAt: now - 30 * DAY,
    });

    await ctx.db.insert("evidenceItems", {
      organizationId: args.organizationId,
      outcomeId: outcome4,
      type: "media_article",
      title: "Front Page Feature — The Morning Herald",
      publisher: "The Morning Herald",
      publishedAt: now - 35 * DAY,
      excerpt: "Investigation details £45M in irregular public tenders, based on data analyzed by Public Interest Watch.",
      verificationStatus: "verified",
      createdBy: user._id,
      createdAt: now - 35 * DAY,
      updatedAt: now - 35 * DAY,
    });

    await ctx.db.insert("evidenceItems", {
      organizationId: args.organizationId,
      outcomeId: outcome4,
      type: "media_article",
      title: "Editorial: Why Transparency in State Contracting Matters",
      publisher: "Financial Review",
      publishedAt: now - 34 * DAY,
      excerpt: "Citing the civic audit findings as an indispensable model for state spending accountability.",
      verificationStatus: "verified",
      createdBy: user._id,
      createdAt: now - 34 * DAY,
      updatedAt: now - 34 * DAY,
    });

    await ctx.db.insert("evidenceItems", {
      organizationId: args.organizationId,
      outcomeId: outcome5,
      type: "official_document",
      title: "Open Court Dockets (Transparency) Bill 2026 (Draft Text)",
      publisher: "Parliamentary Bill Office",
      publishedAt: now - 6 * DAY,
      excerpt: "A Bill to require public electronic access to appellate court records without fees.",
      verificationStatus: "documented",
      createdBy: user._id,
      createdAt: now - 6 * DAY,
      updatedAt: now - 6 * DAY,
    });

    await ctx.db.insert("evidenceItems", {
      organizationId: args.organizationId,
      outcomeId: outcome5,
      type: "email",
      title: "Correspondence with Drafting Counsel",
      publisher: "Office of MP J. Vance",
      publishedAt: now - 8 * DAY,
      excerpt: "Thank you for providing your survey data on court fee barriers. We have integrated your proposed schedule.",
      verificationStatus: "documented",
      createdBy: user._id,
      createdAt: now - 8 * DAY,
      updatedAt: now - 8 * DAY,
    });

    // 7. Create 3 Practices (Learning Engine — Section 33 & 44)
    const practiceLead = await ctx.db.insert("practices", {
      organizationId: args.organizationId,
      title: "Lead with key investigative finding in opening text",
      description: "Outputs stating the core revelation in the first sentence rather than teasers produce higher meaningful sharing.",
      hypothesis: "Posts with clear conclusions generate greater civic dissemination than intrigue-based headlines.",
      metricKey: "shares",
      status: "validated",
      source: "editorial_testing",
      createdAt: now - 60 * DAY,
      updatedAt: now,
    });

    await ctx.db.insert("practiceEvaluations", {
      organizationId: args.organizationId,
      practiceId: practiceLead,
      periodStart: now - 90 * DAY,
      periodEnd: now,
      matchingSampleSize: 32,
      comparisonSampleSize: 48,
      matchingMetricValue: 1420,
      comparisonMetricValue: 1120,
      difference: 26.8,
      confidenceLabel: "positive_signal",
      calculatedAt: now,
    });

    const practiceVideo = await ctx.db.insert("practices", {
      organizationId: args.organizationId,
      title: "Explanatory document walk-through videos",
      description: "Screen recordings showing actual highlighted audit records produce 42% longer average watch durations.",
      hypothesis: "Showing primary source documents enhances credibility and viewer retention.",
      metricKey: "views",
      status: "validated",
      source: "youtube_analytics",
      createdAt: now - 45 * DAY,
      updatedAt: now,
    });

    await ctx.db.insert("practiceEvaluations", {
      organizationId: args.organizationId,
      practiceId: practiceVideo,
      periodStart: now - 60 * DAY,
      periodEnd: now,
      matchingSampleSize: 14,
      comparisonSampleSize: 22,
      matchingMetricValue: 380,
      comparisonMetricValue: 267,
      difference: 42.3,
      confidenceLabel: "strong_signal",
      calculatedAt: now,
    });

    await ctx.db.insert("practices", {
      organizationId: args.organizationId,
      title: "Raw quote excerpts without narrative context",
      description: "Isolated quotes without explanatory context show inconsistent audience engagement.",
      hypothesis: "Uncontextualized quotations fail to communicate significance to non-expert audiences.",
      metricKey: "shares",
      status: "observing",
      source: "social_posts",
      createdAt: now - 30 * DAY,
      updatedAt: now,
    });

    // 8. Create 2 Reports with frozen snapshots (Section 38 & 39)
    const report1 = await ctx.db.insert("reports", {
      organizationId: args.organizationId,
      title: "Q3 Public Procurement & Judicial Transparency Impact Report",
      description: "Executive review of communications reach, parliamentary citations, and policy outcomes.",
      reportType: "quarterly",
      periodStart: now - 90 * DAY,
      periodEnd: now,
      status: "published",
      publishedAt: now - 5 * DAY,
      createdBy: user._id,
      createdAt: now - 5 * DAY,
      updatedAt: now - 5 * DAY,
    });

    await ctx.db.insert("reportBlocks", {
      organizationId: args.organizationId,
      reportId: report1,
      type: "executive_summary",
      position: 1,
      generatedText:
        "Over the past 90 days, the Public Procurement Investigation reached over 650,000 citizens and generated 18,000 meaningful interactions. Crucially, the investigation contributed to the establishment of an official government review panel and an inquiry by the Parliamentary Public Accounts Committee.",
      snapshotAt: now - 5 * DAY,
      createdAt: now - 5 * DAY,
      updatedAt: now - 5 * DAY,
    });

    await ctx.db.insert("reportBlocks", {
      organizationId: args.organizationId,
      reportId: report1,
      type: "kpi_scorecard",
      position: 2,
      snapshotData: {
        totalReach: 650000,
        meaningfulActions: 18450,
        externalCitations: 43,
        policymakerInteractions: 5,
        shareRate: "4.2 per 1,000 impressions",
      },
      snapshotAt: now - 5 * DAY,
      createdAt: now - 5 * DAY,
      updatedAt: now - 5 * DAY,
    });

    await ctx.db.insert("reportBlocks", {
      organizationId: args.organizationId,
      reportId: report1,
      type: "outcome",
      position: 3,
      snapshotData: {
        title: "Government opens procurement transparency review",
        contributionStrength: "strong_evidence",
        status: "corroborated",
        date: "14 September 2026",
      },
      snapshotAt: now - 5 * DAY,
      createdAt: now - 5 * DAY,
      updatedAt: now - 5 * DAY,
    });

    const report2 = await ctx.db.insert("reports", {
      organizationId: args.organizationId,
      title: "Monthly Communications & Impact Briefing (August 2026)",
      description: "Monthly board scorecard tracking reach, video watch duration, and evidence citations.",
      reportType: "monthly",
      periodStart: now - 60 * DAY,
      periodEnd: now - 30 * DAY,
      status: "published",
      publishedAt: now - 30 * DAY,
      createdBy: user._id,
      createdAt: now - 30 * DAY,
      updatedAt: now - 30 * DAY,
    });

    await ctx.db.insert("reportBlocks", {
      organizationId: args.organizationId,
      reportId: report2,
      type: "executive_summary",
      position: 1,
      generatedText:
        "August communications performance showed significant audience growth in explainer videos, which achieved a 2.1× higher median share rate than standard organizational posts.",
      snapshotAt: now - 30 * DAY,
      createdAt: now - 30 * DAY,
      updatedAt: now - 30 * DAY,
    });

    return {
      message: "Successfully seeded realistic demo dataset.",
      contentCount,
      outcomesCount: 5,
      evidenceCount: 10,
      initiativesCount: 3,
      reportsCount: 2,
    };
  },
});
