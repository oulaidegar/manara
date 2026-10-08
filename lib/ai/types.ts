export type ContentPurpose =
  | "awareness"
  | "education"
  | "advocacy"
  | "mobilization"
  | "fundraising"
  | "report_launch"
  | "event_promotion"
  | "organizational_update"
  | "reaction"
  | "breaking_news"
  | "community_engagement"
  | "other";

export type HookType =
  | "statistic"
  | "shock_statistic"
  | "question"
  | "open_question"
  | "strong_claim"
  | "breaking_news"
  | "personal_story"
  | "quote"
  | "direct_quote"
  | "document_scan"
  | "leaked_record"
  | "visual_hook"
  | "announcement"
  | "none"
  | "other";

export type CtaType =
  | "read"
  | "read_investigation"
  | "share"
  | "comment"
  | "donate"
  | "sign"
  | "sign_petition"
  | "archive_save"
  | "register"
  | "attend"
  | "download"
  | "visit"
  | "contact"
  | "none"
  | "other";

export interface PostContentAnalysisInput {
  platform: string;
  postType?: string;
  caption?: string;
  title?: string;
}

export interface PostContentAnalysisResult {
  primaryTopic: string;
  topics: string[];
  contentFormat: string;
  contentPurpose: ContentPurpose;
  tone: string[];
  hookType: HookType;
  ctaType: CtaType;
  slideBracket?: string;
  videoLengthBracket?: string;
  targetAudience: string;
  narrativeStyle: string;
  containsStatistic: boolean;
  containsQuote: boolean;
  containsPerson: boolean;
  containsQuestion: boolean;
  containsExternalLink: boolean;
  campaignCandidate?: string;
  summary: string;
  analysisVersion: string;
}

export interface PostPerformanceExplanationInput {
  platform: string;
  postType?: string;
  views?: number;
  shares?: number;
  comments?: number;
  engagementRate?: number;
  benchmarks: {
    viewsVsMedian?: number;
    sharesVsMedian?: number;
    engagementRateVsMedian?: number;
    percentileRank?: number;
  };
  analysis?: {
    primaryTopic?: string;
    hookType?: string;
    ctaType?: string;
    contentFormat?: string;
    contentPurpose?: string;
  };
}

export interface PostPerformanceExplanationResult {
  headline: string;
  explanation: string;
  keyDrivers: string[];
  testingRecommendation: string;
  confidence: "early_signal" | "promising_pattern" | "strong_evidence";
}
