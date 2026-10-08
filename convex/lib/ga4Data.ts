export interface GA4ReferrerItem {
  source: string;
  medium: string;
  campaign?: string;
  users: number;
  avgTimeSeconds: number;
}

export interface DemoArticleData {
  path: string;
  title: string;
  url: string;
  author: string;
  wordCount: number;
  primaryTopic: string;
  matchedCampaignKeyword: string;
  pageviews: number;
  activeUsers: number; // unique readers
  sessions: number;
  averageEngagementTimeSeconds: number; // deep attention vs skimming
  scrollDepth90Percent: number; // >= 90% scroll depth readers
  documentDownloads: number; // PDF leak downloads
  petitionClicks: number;
  whistleblowerTips: number;
  bounceRate: number;
  socialReferralShare: number; // % from social
  topSocialFormat: string;
  topReferrers: GA4ReferrerItem[];
}

export function formatTimeSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
}

export function buildCivicAttributionHeadline(params: {
  articleTitle: string;
  uniqueReaders: number;
  socialSharePercent: number;
  topSocialFormat: string;
  publishDateStr: string;
  avgEngagementSeconds: number;
}): string {
  const timeStr = formatTimeSeconds(params.avgEngagementSeconds);
  return `Investigation Dossier: '${params.articleTitle}' received ${params.uniqueReaders.toLocaleString()} unique readers on your site. ${params.socialSharePercent}% of traffic came directly from the ${params.topSocialFormat} published on ${params.publishDateStr}, with an average reading time of ${timeStr}.`;
}

export const DEMO_GA4_ARTICLES: DemoArticleData[] = [
  {
    path: "/investigations/offshore-banking-beirut",
    title: "Offshore Banking in Beirut: Uncovering $420M in Undisclosed Assets",
    url: "https://daraj.media/investigations/offshore-banking-beirut",
    author: "Investigative Financial Desk",
    wordCount: 4200,
    primaryTopic: "Financial Transparency & Banking",
    matchedCampaignKeyword: "housing", // Can match housing or general financial inquiry
    pageviews: 29800,
    activeUsers: 18400,
    sessions: 24100,
    averageEngagementTimeSeconds: 228, // 3m 48s (deep attention vs 15s skimming)
    scrollDepth90Percent: 14350, // 78% of readers reach >= 90% depth
    documentDownloads: 1240, // PDF leaked bank statements
    petitionClicks: 420,
    whistleblowerTips: 28,
    bounceRate: 24.5,
    socialReferralShare: 64, // 64% from social
    topSocialFormat: "3-post Instagram carousel",
    topReferrers: [
      {
        source: "instagram",
        medium: "social",
        campaign: "offshore_banking_expose",
        users: 8200,
        avgTimeSeconds: 245,
      },
      {
        source: "x",
        medium: "social",
        campaign: "banking_thread",
        users: 3580,
        avgTimeSeconds: 195,
      },
      {
        source: "google",
        medium: "organic",
        users: 4100,
        avgTimeSeconds: 210,
      },
      {
        source: "newsletter",
        medium: "email",
        users: 2520,
        avgTimeSeconds: 310,
      },
    ],
  },
  {
    path: "/investigations/hospital-procurement-monopolies",
    title: "Public Hospital Procurement: Rigged Tenders in Emergency Medical Supplies",
    url: "https://daraj.media/investigations/hospital-procurement-monopolies",
    author: "Health Accountability Desk",
    wordCount: 3600,
    primaryTopic: "Healthcare Governance & Medicine",
    matchedCampaignKeyword: "emissions", // Can correlate with campaign
    pageviews: 21400,
    activeUsers: 13900,
    sessions: 17800,
    averageEngagementTimeSeconds: 264, // 4m 24s
    scrollDepth90Percent: 11200, // 80% scroll depth
    documentDownloads: 890, // Leaked ministry contracts
    petitionClicks: 1450, // Signed whistleblower petition
    whistleblowerTips: 19,
    bounceRate: 19.8,
    socialReferralShare: 58,
    topSocialFormat: "YouTube investigative mini-documentary",
    topReferrers: [
      {
        source: "instagram",
        medium: "social",
        campaign: "hospital_procurement_q3",
        users: 5600,
        avgTimeSeconds: 280,
      },
      {
        source: "youtube",
        medium: "social",
        campaign: "documentary_short",
        users: 2460,
        avgTimeSeconds: 320,
      },
      {
        source: "google",
        medium: "organic",
        users: 3840,
        avgTimeSeconds: 220,
      },
      {
        source: "direct",
        medium: "none",
        users: 2000,
        avgTimeSeconds: 180,
      },
    ],
  },
  {
    path: "/reports/judicial-transparency-index-2026",
    title: "Judicial Independence Report: Executive Interference in High Court Nominations",
    url: "https://daraj.media/reports/judicial-transparency-index-2026",
    author: "Legal Oversight Project",
    wordCount: 5100,
    primaryTopic: "Judicial Independence",
    matchedCampaignKeyword: "inquiry",
    pageviews: 16500,
    activeUsers: 11200,
    sessions: 13900,
    averageEngagementTimeSeconds: 310, // 5m 10s
    scrollDepth90Percent: 9100,
    documentDownloads: 2150, // Full 68-page PDF Dossier download
    petitionClicks: 820,
    whistleblowerTips: 12,
    bounceRate: 16.2,
    socialReferralShare: 46,
    topSocialFormat: "X (Twitter) policy brief thread",
    topReferrers: [
      {
        source: "linkedin",
        medium: "social",
        campaign: "judicial_benchmarks",
        users: 2800,
        avgTimeSeconds: 360,
      },
      {
        source: "x",
        medium: "social",
        campaign: "court_transparency",
        users: 2350,
        avgTimeSeconds: 270,
      },
      {
        source: "google",
        medium: "organic",
        users: 4500,
        avgTimeSeconds: 290,
      },
      {
        source: "newsletter",
        medium: "email",
        users: 1550,
        avgTimeSeconds: 390,
      },
    ],
  },
];
