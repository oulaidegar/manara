# Radar — Implementation Status

Last updated: 2026-10-06

## Completed

### Phase 0 — Repository and Infrastructure
- [x] Next.js 16 with App Router, TypeScript strict mode
- [x] Tailwind CSS v4 styling with semantic color tokens
- [x] Convex initialized (local deployment and generated types)
- [x] Clerk authentication configured with ConvexProviderWithClerk
- [x] Lucide icons installed and integrated
- [x] ESLint configured (0 errors, 0 warnings)
- [x] Vitest configured with ESM and path aliases
- [x] README.md created and updated
- [x] IMPLEMENTATION_STATUS.md created and maintained

### Phase 1 — Authentication and Organizations
- [x] Clerk sign-in / sign-up pages (`/sign-in`, `/sign-up`)
- [x] Clerk middleware protecting app routes while allowing public routes
- [x] Convex schema: `users`, `organizations`, `memberships`, `invitations`, `auditEvents`
- [x] User sync (`getOrCreateUser` mutation called on authenticated app load)
- [x] Organization creation with strict slug validation and auto-owner assignment
- [x] Organization switcher / selector page (`/~/select-org`)
- [x] Full RBAC role system: `owner`, `admin`, `analyst`, `contributor`, `viewer`
- [x] Centralized authorization helpers: `requireAuth`, `requireUser`, `requireOrganizationMember`, `requireOrganizationRole`, `hasMinimumRole`
- [x] Member management in Convex: list, invite, role updates, member removal
- [x] Invitation model: token generation, listing, revoking, acceptance flow
- [x] Audit logging for all consequential actions (invitations, role updates, removals)
- [x] Protected application shell with sidebar navigation and dynamic route segment `/[organizationSlug]`
- [x] Dedicated Organization Context provider (`OrganizationProvider`, `useOrganization`)
- [x] Rigorous unit and tenant isolation tests (22 tests passing):
  - User in Org A cannot access Org B
  - Analyst cannot perform owner/admin actions
  - Viewer cannot mutate outcomes or manage members
  - Sole owner protections verified
  - Slug validation tests verified

### Phase 2 — Application Shell
- [x] **Responsive Navigation & Drawer:** Mobile hamburger menu, slide-over drawer with backdrop blur, smooth responsive transitions, and fixed desktop sidebar.
- [x] **Integrated Organization Switcher:** Dropdown in sidebar header listing all user organizations with active checks, organization type & role indicator, and "+ Create or switch organization" action.
- [x] **Secondary Navigation:** Top header with breadcrumbs, role badge, tenant isolation indicator, and notifications popover panel.
- [x] **Home Briefing Screen (`/[slug]`):** Follows Section 25 layout: personalized greeting, *Radar Noticed* intelligence highlight, communications performance snapshot, active initiatives tracker, real-world impact candidate queue, and learning practices card.
- [x] **Analyze Screen (`/[slug]/analyze`):** Filter toolbar (date range, platform/channel, content format), rate/denominator-based KPI cards (impressions, reach, meaningful shares per 1k views), and empty state with next actions.
- [x] **Initiatives Screen (`/[slug]/initiatives`):** Impact model visualizer (*Goals → Initiatives → Outputs → Reach → External Signals → Outcomes*), common civil society archetypes, and creation modal.
- [x] **Impact Screen (`/[slug]/impact`):** Strict contribution principle banner (distinguishing contribution from proven causality), status pipeline tabs (*All*, *Candidates*, *Corroborated*, *Verified*), narrative outcome preview, and outcome logging modal.
- [x] **Reports Screen (`/[slug]/reports`):** Tamper-proof query snapshot explanation, report templates (Executive Briefing, Donor Narrative, Campaign Retrospective), and report generation modal.
- [x] **Comprehensive Settings Suite (`/[slug]/settings`):** Tabbed interface with:
  - *Organization Profile:* Name, type, country, timezone, website, mission (live Convex mutation)
  - *Members & Roles:* Member roster, role switcher, removal controls, invite form, and 5-tier authorization matrix
  - *Integrations:* Connector cards (YouTube priority, LinkedIn, Meta, CSV)
  - *CSV Ingestion:* Pipeline guide and canonical column support
  - *Metric Definitions:* Inspectable formulas and aggregation rules
  - *Audit Log:* Immutable record of consequential actions enriched with actor details (`listAuditEvents`)

### Phase 3 — Core Data Model & Realistic Demo Organization (Milestone 1)
- [x] **Core Convex Schemas ([`convex/schema.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/schema.ts)):**
  - `socialAccounts` (channel metadata, handle, platform)
  - `contentItems` (canonical model: title, text, origin, contentType, publishedAt, metrics)
  - `initiatives` (strategic initiatives with goals, owners, tags, status)
  - `initiativeContentLinks` (many-to-many relationship linking content to initiatives)
  - `goals` & `goalIndicators` (direction, baseline, target, current value)
  - `contentMetricObservations` (granular timestamped observations)
  - `actors` (entities, institutions, media, researchers)
  - `outcomes` (changeType, significance, contributionStatement, contributionStrength, verificationStatus)
  - `evidenceItems` (type, title, url, publisher, publishedAt, excerpt, notes)
  - `practices` & `practiceEvaluations` (learning engine hypotheses, signal evaluations)
  - `reports` & `reportBlocks` (tamper-proof frozen query snapshots)
- [x] **Convex Backend Domain Modules:**
  - [`convex/content.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/content.ts): `listContent`, `getContentItem`, `createContentItem`
  - [`convex/initiatives.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/initiatives.ts): `listInitiatives`, `getInitiative`, `createInitiative`, `linkContent`
  - [`convex/impact.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/impact.ts): `listOutcomes`, `getOutcome`, `createOutcome`, `addEvidence`, `updateVerificationStatus`
  - [`convex/reports.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/reports.ts): `listReports`, `getReport`, `createReport` (with initial frozen blocks)
  - [`convex/analytics.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/analytics.ts): `getBriefingData` (Home briefing computation), `getAnalyzeData` (KPI rates, platform breakdown, content ranking)
  - [`convex/seed.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/seed.ts): Idempotent seed mutation populating the complete Section 44 realistic public-interest dataset:
    - 2 social channels (YouTube, LinkedIn)
    - 105 realistic pieces of content published over 90 days across formats (investigations, videos, reports, posts)
    - 3 strategic initiatives (*Public Procurement Investigation*, *Judicial Transparency Campaign*, *Climate Accountability Series*)
    - 4 quantifiable goals with baseline and target indicators
    - 5 documented societal outcomes with varied contribution strengths and verification stages
    - 10 verifiable evidence items (ministerial directives, Hansard parliamentary records, consortium press reports, committee transcripts)
    - 3 learning practices (*Lead with key finding*, *Document walk-through videos*, *Raw quote excerpts*)
    - 2 structured reports with frozen query snapshots
- [x] **Live Frontend Integration:**
  - **Home:** Displays live briefing stats, active initiatives list, candidate outcomes review queue, learning engine takeaways, and a one-click "Load Demo Dataset" button.
  - **Analyze:** Displays live KPI cards, platform breakdown cards, and full content performance table with rate denominators.
  - **Initiatives:** Displays live initiative cards with output tallies, goal counts, and outcome counts.
  - **Impact:** Displays live outcome cards with evidence counts and interactive status updater.
  - **Reports:** Displays live report cards with a snapshot block inspector modal.

### Phase 4 — CSV Import Engine (Section 21)
- [x] **Canonical Column Specifications ([`lib/csv.ts`](file:///Users/louaimroueh/Desktop/Radar/lib/csv.ts)):**
  - All 16 canonical fields: `date`, `title`, `platform`, `account`, `url`, `external_id`, `text`, `content_type`, `impressions`, `reach`, `views`, `likes`, `comments`, `shares`, `saves`, `clicks`
  - Heuristic auto-mapping engine matching common platform export headers and aliases
  - Canonical CSV template generator and one-click template download
  - Client-side RFC-4180 parser handling quotes, commas within cells, newlines, and UTF-8 BOM
  - Client-side row validator with format checking and non-zero metric normalization
- [x] **Backend Deduplication & Ingestion Pipeline ([`convex/imports.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/imports.ts)):**
  - Section 21 3-tier deduplication hierarchy:
    1. Match by `externalId`
    2. Fallback to `url`
    3. Fallback to composite key `(provider, publishedAt, title)`
  - Safe metrics updates for matched existing content without creating duplicates
  - Atomic insertion of new `contentItems` and granular `contentMetricObservations`
  - Permanent `importRuns` audit records storing row counts, tallies, and up to 50 row errors
  - Centralized audit logging via `logAuditEvent`
- [x] **Interactive CSV Import Wizard ([`components/imports/csv-importer.tsx`](file:///Users/louaimroueh/Desktop/Radar/components/imports/csv-importer.tsx)):**
  - 4-step wizard: Upload → Column Mapping → Validate & Preview → Run Summary
  - Live normalized sample table displaying the first 5 records with formatted metric rates
  - Interactive Historical Runs table in Settings / CSV Imports tab
  - Detailed Run Inspection modal showing row error exceptions and execution metadata
- [x] **Unit Testing ([`tests/csv.test.ts`](file:///Users/louaimroueh/Desktop/Radar/tests/csv.test.ts)):**
  - 6 unit tests covering CSV parsing, escaped quotes, BOM handling, mapping heuristics, validation, and canonical template generation (28/28 total suite tests passing)

## Verification Status
- `npm run typecheck`: **PASSED** (0 errors)
- `npm run lint`: **PASSED** (0 errors, 0 warnings)
- `npm test`: **PASSED** (28/28 tests passing)
- `npm run build`: **PASSED** (production bundle generated with all static and dynamic routes)

### Phase 5 — Analytics Deepening & Visualizations (Section 20 & 26)
- [x] **Apache ECharts Engine Integration ([`components/charts/echarts-wrapper.tsx`](file:///Users/louaimroueh/Desktop/Radar/components/charts/echarts-wrapper.tsx)):**
  - Theme-aware responsive canvas wrapper for Apache ECharts matching Radar design tokens
  - `ResizeObserver` listener auto-adjusting charts on sidebar drawer toggles and viewport resizing
  - Clean lifecycle management disposing instances on unmount to prevent memory leaks
- [x] **Dual-Axis Time Series Trend Chart ([`components/charts/time-series-trend-chart.tsx`](file:///Users/louaimroueh/Desktop/Radar/components/charts/time-series-trend-chart.tsx)):**
  - Primary Y-axis: Exposure Volume (selectable between Impressions, Unique Reach, or Views)
  - Secondary Y-axis: Meaningful Action Rate (shares + saves per 1,000 views)
  - Interactive `dataZoom` slider allowing granular exploration of weekly peaks and campaign surges
  - Custom HTML tooltips calculating exact rates and action totals
- [x] **Cross-Channel & Format Breakdown Charts ([`components/charts/`](file:///Users/louaimroueh/Desktop/Radar/components/charts/)):**
  - `PlatformComparisonChart`: Compares total impressions and unique reach across publishing channels
  - `FormatEfficiencyChart`: Ranks content formats (investigations, videos, reports, posts) by action density per 1,000 impressions
- [x] **Enhanced Analytics Backend ([`convex/analytics.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/analytics.ts)):**
  - Windowed date range filtering: `7d`, `30d`, `90d`, `ytd`, `all`
  - Period-over-period delta calculation comparing current window vs. previous equivalent window
  - Granular daily bucket aggregations for time series plotting
  - Format-level and platform-level efficiency calculations
  - Content item enrichment linking strategic initiatives and individual meaningful action rates
- [x] **Analyze Control Center & Content Register ([`app/(app)/[organizationSlug]/analyze/page.tsx`](file:///Users/louaimroueh/Desktop/Radar/app/(app)/[organizationSlug]/analyze/page.tsx)):**
  - 5 Rate KPI Cards: Impressions, Reach, Meaningful Actions, Action Rate / 1k, and Reach Efficiency Ratio
  - Multi-parameter filter toolbar: Date range, comparison mode, channel, content type
  - Tabbed visualization container toggling between timeline and channel/format breakdowns
  - Multi-column sortable content register with live search filtering across titles and excerpts
  - Interactive pagination controls
- [x] **Content Detail Inspection Modal ([`components/analytics/content-detail-modal.tsx`](file:///Users/louaimroueh/Desktop/Radar/components/analytics/content-detail-modal.tsx)):**
  - Complete output inspector with full excerpt, original external URL, linked strategic initiative, and institutional memory guidance

## Verification Status
- `npm run typecheck`: **PASSED** (0 errors)
- `npm run lint`: **PASSED** (0 errors, 0 warnings)
- `npm test`: **PASSED** (28/28 tests passing)
- `npm run build`: **PASSED** (production bundle generated with all static and dynamic routes)

### Phase 6 — Initiatives & Impact Chains (Sections 10, 11, 14, 27)
- [x] **Initiative Portfolio View ([`app/(app)/[organizationSlug]/initiatives/page.tsx`](file:///Users/louaimroueh/Desktop/Radar/app/(app)/[organizationSlug]/initiatives/page.tsx)):**
  - Initiative cards with dynamic rollups (output count, goal count, outcome count, total reach, meaningful actions)
  - Initiative creation modal with civil society archetypes (Policy Reform, Watchdog Investigation, Public Awareness, etc.)
  - Filterable by active, draft, completed, and archived statuses
- [x] **Strategic Initiative Workspace ([`components/initiatives/initiative-workspace.tsx`](file:///Users/louaimroueh/Desktop/Radar/components/initiatives/initiative-workspace.tsx)):**
  - Visual Impact Chain stepper (*Goals → Outputs → Reach → Actions → Outcomes*)
  - Status transitions (`draft` → `active` → `completed` → `archived`)
  - Strategic Goals & Indicators progress tracker with baseline vs target bars
  - Assigned Outputs table with one-click detachment and external link preview
  - Documented Outcomes register with corroborating evidence counts and verification badges
- [x] **Strategic Goal & Indicator Management ([`components/initiatives/goal-modal.tsx`](file:///Users/louaimroueh/Desktop/Radar/components/initiatives/goal-modal.tsx)):**
  - Typed goal classifications (policy change, institutional change, media attention, behavior change, etc.)
  - Quantifiable indicators with direction, baseline, target, and current values
- [x] **Content-to-Initiative Linking Engine ([`components/initiatives/content-link-drawer.tsx`](file:///Users/louaimroueh/Desktop/Radar/components/initiatives/content-link-drawer.tsx)):**
  - Slide-over drawer to search and associate unassigned organization content items to the initiative
  - Live search by title, platform, and content type
- [x] **Convex Backend API ([`convex/initiatives.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/initiatives.ts)):**
  - `getInitiativeWorkspace` query with dynamic aggregate rollups and related entities
  - `createGoal`, `addGoalIndicator`, `updateIndicatorCurrentValue`
  - `linkContent`, `unlinkContent`, `updateInitiativeStatus`, `listAvailableContentForInitiative`

## Verification Status
- `npm run typecheck`: **PASSED** (0 errors)
- `npm run lint`: **PASSED** (0 errors, 0 warnings)
- `npm test`: **PASSED** (28/28 tests passing)
- `npm run build`: **PASSED** (production bundle generated with all static and dynamic routes)

### Phase 7 — Impact & Evidence (Sections 12, 13, 27, 28, 29, 31, 57)
- [x] **Rate-Based Impact KPI Summary Cards ([`components/impact/impact-summary-cards.tsx`](file:///Users/louaimroueh/Desktop/Radar/components/impact/impact-summary-cards.tsx)):**
  - Observed Outcomes tally with pending candidates breakdown
  - Corroborated & Verified pipeline counts with total verified %
  - Attached Verifiable Evidence count (official records, citations, excerpts)
  - Strategic Alignment % (outcomes directly tied to active initiatives)
- [x] **Outcome Recording Wizard Modal ([`components/impact/record-outcome-modal.tsx`](file:///Users/louaimroueh/Desktop/Radar/components/impact/record-outcome-modal.tsx)):**
  - Progressive disclosure 3-step wizard (What Changed? → Contribution Rationale → Corroborating Evidence)
  - Strict Section 2 phrasing guidance on contribution vs. causality
  - Contribution strength ratings (`plausible`, `strong_evidence`, `possible`, `unknown`)
  - Optional initial evidence attachment on creation
- [x] **Outcome Detail & Evidence Slide-Over Drawer ([`components/impact/outcome-detail-drawer.tsx`](file:///Users/louaimroueh/Desktop/Radar/components/impact/outcome-detail-drawer.tsx)):**
  - Real-world event details and societal significance notes
  - Attribution rationale callout with quotation styling
  - Stage pipeline transition controls (`candidate` → `documented` → `corroborated` → `verified` / `rejected`)
  - Verifiable evidence register with icons, source URLs, excerpts, and publisher info
  - Inline evidence artifact creation form with auto-advancement from `candidate` to `documented`
  - Safe deletion of individual evidence items and outcomes
- [x] **Societal Actor & Stakeholder Registry ([`components/impact/actor-registry-modal.tsx`](file:///Users/louaimroueh/Desktop/Radar/components/impact/actor-registry-modal.tsx)):**
  - Directory modal for institutions, parliamentary committees, media outlets, and regulatory bodies
  - Actor creation and removal with URL and jurisdiction metadata
- [x] **Impact Hub Control Center ([`app/(app)/[organizationSlug]/impact/page.tsx`](file:///Users/louaimroueh/Desktop/Radar/app/(app)/[organizationSlug]/impact/page.tsx)):**
  - Status pipeline filter tabs (`All`, `Candidates`, `Documented`, `Corroborated`, `Verified`)
  - Real-time search across titles, descriptions, and contribution statements
  - Change type classification dropdown filter
  - Rich outcome cards with evidence previews, initiative badges, and click-to-open drawer
- [x] **Convex Backend API ([`convex/impact.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/impact.ts)):**
  - `listOutcomes` with evidence snippet previews, search/type filtering, and initiative name enrichment
  - `getOutcome` and `getImpactSummary` aggregation queries
  - `createOutcome`, `updateOutcome`, `deleteOutcome` with child evidence cleanup
  - `addEvidence`, `deleteEvidence`, `updateVerificationStatus`
  - `listActors`, `createActor`, `deleteActor`

## Verification Status
- `npm run typecheck`: **PASSED** (0 errors)
- `npm run lint`: **PASSED** (0 errors, 0 warnings)
- `npm test`: **PASSED** (28/28 tests passing)
- `npm run build`: **PASSED** (production bundle generated with all static and dynamic routes)

### Phase 8 — Learning Engine & Strategic Practices (Section 15, 30, 33)
- [x] **Hypothesis & Communications Practice Cards ([`components/learning/practice-card.tsx`](file:///Users/louaimroueh/Desktop/Radar/components/learning/practice-card.tsx)):**
  - Stated editorial hypothesis ("What we predict will happen")
  - Confidence rating badge (`Strong Positive Signal`, `Positive Signal`, `Weak Signal`, `Negative Signal`, `Insufficient Data`)
  - Empirical evaluation summary (matching sample vs. comparison baseline, percentage delta, target metric)
  - Interactive "Re-evaluate Against Content" trigger and deletion controls
- [x] **Hypothesis Formulation Modal ([`components/learning/create-practice-modal.tsx`](file:///Users/louaimroueh/Desktop/Radar/components/learning/create-practice-modal.tsx)):**
  - Form to define editorial guidelines and testable assumptions
  - Target metric selection (`shares`, `saves`, `reach`, `views`, `clicks`)
  - Status lifecycle (`under_test`, `draft`, `validated`) and origin source tracking
- [x] **Learning Engine Workspace ([`components/learning/learning-workspace.tsx`](file:///Users/louaimroueh/Desktop/Radar/components/learning/learning-workspace.tsx)):**
  - Summary metric strip (Total Hypotheses, Validated Practices, Currently Under Test, Positive Empirical Signals)
  - Filter tabs (All Practices, Validated, Under Test, Drafts)
  - Grid of practice cards with live status feedback
- [x] **Hub Integrations:**
  - Integrated into **Analyze** (`/[organizationSlug]/analyze`): 3rd interactive visualization tab allowing analysts to pivot directly from exposure charts to strategic editorial practices
  - Integrated into **Home** (`/[organizationSlug]`): Direct pathway from briefing card to comprehensive practices
- [x] **Convex Backend API ([`convex/practices.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/practices.ts)):**
  - `listPractices` enriched with latest `practiceEvaluations`
  - `getPractice` with complete evaluation history
  - `createPractice` and `deletePractice`
  - `evaluatePractice`: Empirical evaluation engine analyzing organization content matching the hypothesis versus control cohort, computing delta percentage, sample sizes, and confidence label

## Verification Status
- `npm run typecheck`: **PASSED** (0 errors)
- `npm run lint`: **PASSED** (0 errors, 0 warnings)
- `npm test`: **PASSED** (28/28 tests passing)
- `npm run build`: **PASSED** (production bundle generated with all static and dynamic routes)

### Phase 9 — Tamper-Proof Reports & Export (Section 16, 29, 36)
- [x] **Report Generator Wizard Modal ([`components/reports/report-generator-modal.tsx`](file:///Users/louaimroueh/Desktop/Radar/components/reports/report-generator-modal.tsx)):**
  - 2-step wizard with pre-configured civil society archetypes:
    - *Board / Executive Briefing* (High-level reach, meaningful action rates, corroborated policy outcomes)
    - *Donor Impact Narrative* (Grant stewardship, reach efficiency, and corroborating citations)
    - *Initiative Retrospective* (Investigation dossiers, audience peaks, and policy inquiries)
    - *Editorial & Learning Review* (Storytelling format action efficiency and validated communications practices)
  - Timeframe presets (Last 30 Days, Last 90 Days, Year to Date, Full Archive)
  - Initiative focus filter (All organization work vs. specific strategic initiative)
- [x] **Structured Report Viewer ([`components/reports/report-viewer.tsx`](file:///Users/louaimroueh/Desktop/Radar/components/reports/report-viewer.tsx)):**
  - High-fidelity publication viewer rendering frozen query snapshots
  - Verification ribbon ("Frozen Query Snapshot • Captured on publication")
  - Print / Save as PDF support with clean `@media print` layout formatting
  - Share link button with clipboard feedback
  - Block 1: Executive Summary & Narrative
  - Block 2: Performance Scorecard (Reach, Impressions, Meaningful Actions, Action Rate / 1k, Output / Outcome counts)
  - Block 3: Key Communications Outputs highlights table
  - Block 4: Documented Real-World Outcomes with change types, contribution ratings, and attached corroborating evidence items
  - Block 5: Validated Communications Practices with empirical signals
  - Block 6: Methodology & Section 2 Contribution Disclaimer
- [x] **Standalone Report Route ([`app/(app)/[organizationSlug]/reports/[reportId]/page.tsx`](file:///Users/louaimroueh/Desktop/Radar/app/(app)/[organizationSlug]/reports/[reportId]/page.tsx)):**
  - Dedicated permalink page allowing board members, donors, and partners to view published reports with print/export actions
- [x] **Reports Dashboard ([`app/(app)/[organizationSlug]/reports/page.tsx`](file:///Users/louaimroueh/Desktop/Radar/app/(app)/[organizationSlug]/reports/page.tsx)):**
  - Archetype filter tabs (`All`, `Board`, `Donor`, `Campaign`, `Editorial`)
  - Report cards with frozen block counts, author, publication date, and one-click snapshot viewer modal
- [x] **Convex Backend API ([`convex/reports.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/reports.ts)):**
  - `listReports` enriched with block counts and author details
  - `getReport` and `getPublicReport` returning structured blocks sorted by position
  - `createReport`: Dynamic snapshot capture engine querying live database records for the period and initiative, freezing them into typed immutable `reportBlocks` (`executive_summary`, `kpi_scorecard`, `content_highlights`, `outcome`, `learning`, `methodology`)
  - `updateReportStatus` (`draft`, `published`, `archived`) and `deleteReport` with audit logging

## Verification Status
- `npm run typecheck`: **PASSED** (0 errors)
- `npm run lint`: **PASSED** (0 errors, 0 warnings)
- `npm test`: **PASSED** (28/28 tests passing)
- `npm run build`: **PASSED** (production bundle generated with all static and dynamic routes including `/[organizationSlug]/reports/[reportId]`)

### Phase 10 — Settings, Connectors & Hardening (Sections 15, 16, 22, 23, 24, 49)
- [x] **Platform Connector Architecture ([`convex/connectors/shared/types.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/connectors/shared/types.ts)):**
  - Canonical connector interface enforcing `connect`, `refreshAuthorization`, `listAccounts`, `syncContent`, `syncAccountMetrics`, `normalizeContent`, and `normalizeMetrics`
  - Isolates provider-specific logic away from core application layers
- [x] **YouTube Priority Connector #1 ([`convex/connectors/youtube/index.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/connectors/youtube/index.ts)):**
  - Priority #1 connector per Section 23 with video snippet, statistics, and ISO duration normalization
  - Video vs. `short_video` categorization based on playback length
  - Direct translation of view counts, like counts, and comments into canonical `contentItems` and observation records
  - Connectors for LinkedIn, Meta, and TikTok adhering to the shared contract
- [x] **Platform Synchronization Engine ([`convex/connectors/sync.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/connectors/sync.ts), [`convex/connectors/accounts.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/connectors/accounts.ts)):**
  - `syncRuns` table logging status (`queued`, `running`, `success`, `failed`), timestamps, records created/updated, and error exceptions
  - Transactional manual sync runner with multi-tier content deduplication and metric observation recording
  - Social account connection and disconnection management with server-side tenant isolation
  - Audit logging of all sync triggers and account connections via `logAuditEvent`
  - Recurring scheduled crons file ([`convex/crons.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/crons.ts)) per Section 24
- [x] **Normalized Metric Definitions & Inspector ([`convex/metrics.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/metrics.ts), [`components/settings/metric-definitions-tab.tsx`](file:///Users/louaimroueh/Desktop/Radar/components/settings/metric-definitions-tab.tsx)):**
  - Inspectable catalog of 11 normalized system metrics (`impressions`, `reach`, `views`, `likes`, `comments`, `shares`, `saves`, `clicks`, `meaningful_action_rate`, `reach_efficiency_ratio`, `meaningful_share_ratio`)
  - Transparent formula display for derived rates with category filtering
  - Custom metric formulator allowing organizations to define custom derived rates and indicators with aggregation behavior
- [x] **Organization Taxonomy & Custom Tags ([`convex/tags.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/tags.ts), [`components/settings/tags-tab.tsx`](file:///Users/louaimroueh/Desktop/Radar/components/settings/tags-tab.tsx)):**
  - Multi-dimensional taxonomy supporting topics, storytelling formats, audiences, purposes, and regions per Section 15
  - Color presets, usage counts, slug auto-generation, and deletion with cascading reference cleanup
  - Seed integration populating initial tags in [`convex/seed.ts`](file:///Users/louaimroueh/Desktop/Radar/convex/seed.ts)
- [x] **Comprehensive Settings Suite ([`app/(app)/[organizationSlug]/settings/page.tsx`](file:///Users/louaimroueh/Desktop/Radar/app/(app)/[organizationSlug]/settings/page.tsx)):**
  - 7 specialized tabs: *Organization Profile*, *Members & Roles*, *Integrations & Connectors*, *CSV Imports*, *Metric Definitions*, *Taxonomy & Tags*, and *Security Audit Log*
  - Interactive "Sync Now" controls with live spinner, connection modals, and real-time history logs
- [x] **Unit Testing ([`tests/connectors.test.ts`](file:///Users/louaimroueh/Desktop/Radar/tests/connectors.test.ts)):**
  - 7 unit tests covering YouTube connector attributes, account formatting, long-form and short-form content normalization, metrics extraction, and formula integrity
  - Full suite: **35/35 passing unit tests** across auth, CSV importer, and platform connectors

## Verification Status
- `npm run typecheck`: **PASSED** (0 errors)
- `npm run lint`: **PASSED** (0 errors, 0 warnings)
- `npm test`: **PASSED** (35/35 tests passing)
- `npm run build`: **PASSED** (production bundle generated with all static and dynamic routes)

## In Progress

None.

## Next

All 11 MVP Phases (Phases 0 through 10) are 100% complete, verified, and operational. Ready for deployment and pilot onboarding.

## Known Limitations
- Invitation tokens currently displayed/logged for manual sharing; SMTP/email service to be integrated later
- Convex `CLERK_JWT_ISSUER_DOMAIN` is configured for local backend development; production deployment will use production Clerk domain

## Important Architectural Decisions

1. **Client-side Organization Context:** Dedicated `components/organization-context.tsx` module for `OrganizationProvider` and `useOrganization`, cleanly separating Next.js App Router layout exports from custom React hooks.
2. **User sync approach:** User profile sync runs via `getOrCreateUser` upon sign-in. This avoids immediate external webhook setup during early MVP development while maintaining consistent `users` records in Convex.
3. **Multi-tenancy boundary:** All organization data operations require explicit `organizationId` matching and role verification via centralized server-side helpers in `convex/lib/auth.ts`. Knowing a record ID never bypasses membership checks.
4. **Auditability:** Consequential administrative and member operations write immutable events to `auditEvents` via `logAuditEvent`.
5. **Snapshot immutability:** Reports store frozen query snapshots in `reportBlocks.snapshotData`, guaranteeing historical reproducibility.
6. **Build tooling:** Configured Next.js build script to use `--webpack` for reliable compilation with PostCSS and Tailwind v4.
