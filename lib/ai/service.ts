import {
  PostContentAnalysisInput,
  PostContentAnalysisResult,
  PostPerformanceExplanationInput,
  PostPerformanceExplanationResult,
  ContentPurpose,
  HookType,
  CtaType,
} from "./types";
import {
  POST_CLASSIFICATION_SYSTEM_PROMPT,
  POST_EXPLANATION_SYSTEM_PROMPT,
} from "./prompts";

export const ANALYSIS_VERSION = "post-analysis-v1";

export async function analyzePostContent(
  input: PostContentAnalysisInput
): Promise<PostContentAnalysisResult> {
  const text = `${input.title || ""} ${input.caption || ""}`.trim();
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: POST_CLASSIFICATION_SYSTEM_PROMPT },
            {
              role: "user",
              content: JSON.stringify({
                platform: input.platform,
                postType: input.postType || "post",
                text,
              }),
            },
          ],
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const parsed = JSON.parse(json.choices[0].message.content);
        return {
          primaryTopic: parsed.primaryTopic || "Civic Governance",
          topics: Array.isArray(parsed.topics) ? parsed.topics : ["public interest"],
          contentFormat: parsed.contentFormat || input.postType || "post",
          contentPurpose: parsed.contentPurpose || "education",
          tone: Array.isArray(parsed.tone) ? parsed.tone : ["informative"],
          hookType: parsed.hookType || "none",
          ctaType: parsed.ctaType || "none",
          targetAudience: parsed.targetAudience || "General Public",
          narrativeStyle: parsed.narrativeStyle || "explanatory",
          containsStatistic: Boolean(parsed.containsStatistic),
          containsQuote: Boolean(parsed.containsQuote),
          containsPerson: Boolean(parsed.containsPerson),
          containsQuestion: Boolean(parsed.containsQuestion),
          containsExternalLink: Boolean(parsed.containsExternalLink),
          campaignCandidate: parsed.campaignCandidate,
          summary: parsed.summary || text.slice(0, 140),
          analysisVersion: ANALYSIS_VERSION,
        };
      }
    } catch {
      // Fallback to deterministic heuristic analyzer
    }
  }

  // Deterministic Heuristic Fallback (Sandbox & Offline Compliance)
  return heuristicAnalyzePost(input, text);
}

function heuristicAnalyzePost(
  input: PostContentAnalysisInput,
  text: string
): PostContentAnalysisResult {
  const lower = text.toLowerCase();

  // Flags
  const containsQuestion = text.includes("?");
  const containsStatistic = /\b\d+(?:[\.,]\d+)?%|\b\d+(?:,\d{3})+\b|\b\$?\d+(?:\.\d+)?(?:\s?(?:million|billion|k|m))\b/i.test(text);
  const containsQuote = /["'«»]/.test(text);
  const containsExternalLink = /https?:\/\/|link in bio|read full report/i.test(lower);
  const containsPerson = /minister|director|commissioner|mayor|official|dr\.|senator|deputy/i.test(lower);

  // Hook Type (Micro-Taxonomy)
  let hookType: HookType = "none";
  const opening = (input.title || text).trim().toLowerCase();

  if (containsQuestion && (opening.startsWith("why") || opening.startsWith("how") || opening.startsWith("what") || opening.startsWith("can") || opening.startsWith("where") || opening.startsWith("who"))) {
    hookType = "question";
  } else if (/document|leak|leaked|uncovered files|internal memo|audit report|confidential|dossier/i.test(opening)) {
    hookType = "document_scan";
  } else if (containsStatistic && (/shocking|astonishing|surge|overwhelming|massive|skyrocket|inflated/i.test(opening) || /^\d|^\$|^over\s\d|^nearly\s\d/i.test(opening))) {
    hookType = "shock_statistic";
  } else if (containsStatistic && /^\d|^\$|^over\s\d/i.test(lower)) {
    hookType = "statistic";
  } else if (containsQuote && /^["'«»]/.test(opening)) {
    hookType = "direct_quote";
  } else if (containsQuote) {
    hookType = "quote";
  } else if (/urgent|breaking|just in|revealed/i.test(opening)) {
    hookType = "breaking_news";
  } else if (containsQuestion) {
    hookType = "question";
  }

  // CTA (Micro-Taxonomy)
  let ctaType: CtaType = "none";
  if (/read investigation|read full investigation|full exposé|investigative dossier/i.test(lower)) {
    ctaType = "read_investigation";
  } else if (/read more|link in bio|full report|link below/i.test(lower)) {
    ctaType = "read";
  } else if (/sign the petition|sign our petition|add your name|demand accountability/i.test(lower)) {
    ctaType = "sign_petition";
  } else if (/save this|bookmark|save for reference|archive this/i.test(lower)) {
    ctaType = "archive_save";
  } else if (/share this|repost|spread the word|amplify/i.test(lower)) {
    ctaType = "share";
  } else if (/what do you think|comment below|thoughts\?|tell us/i.test(lower)) {
    ctaType = "comment";
  } else if (/donate|support our work/i.test(lower)) {
    ctaType = "donate";
  } else if (/register|sign up|join us/i.test(lower)) {
    ctaType = "register";
  }

  // Length / Slide Brackets
  let slideBracket: string | undefined = undefined;
  let videoLengthBracket: string | undefined = undefined;
  const postFormat = input.postType || "post";
  if (postFormat === "carousel") {
    slideBracket = "6-10 slides";
  } else if (postFormat === "video" || postFormat === "reel") {
    videoLengthBracket = "30-90s";
  }

  // Purpose
  let contentPurpose: ContentPurpose = "education";
  if (/petition|take action|urge|demand/i.test(lower)) contentPurpose = "mobilization";
  else if (/investigation|reveals|found that|new data/i.test(lower)) contentPurpose = "report_launch";
  else if (/policy|reform|lawmakers|parliament/i.test(lower)) contentPurpose = "advocacy";
  else if (/update|announcement|welcoming/i.test(lower)) contentPurpose = "organizational_update";

  // Topics
  const topics: string[] = [];
  if (/housing|rent|landlord|tenant/i.test(lower)) topics.push("housing");
  if (/climate|emissions|energy|renewable/i.test(lower)) topics.push("climate");
  if (/water|river|pollution|clean water/i.test(lower)) topics.push("water quality");
  if (/procurement|contract|spending|budget|funds/i.test(lower)) topics.push("public procurement");
  if (/health|hospital|care|patients/i.test(lower)) topics.push("public health");
  if (/court|justice|legal|rights/i.test(lower)) topics.push("civil rights");
  if (topics.length === 0) topics.push("civic governance");

  return {
    primaryTopic: topics[0],
    topics,
    contentFormat: postFormat,
    contentPurpose,
    tone: containsStatistic ? ["analytical", "informative"] : ["advocacy", "engaging"],
    hookType,
    ctaType,
    slideBracket,
    videoLengthBracket,
    targetAudience: "Civic Observers & Affected Communities",
    narrativeStyle: containsStatistic ? "evidence_first" : "narrative_explainer",
    containsStatistic,
    containsQuote,
    containsPerson,
    containsQuestion,
    containsExternalLink,
    summary: text.slice(0, 160) || "Social media output regarding public interest policy.",
    analysisVersion: ANALYSIS_VERSION,
  };
}

export async function generatePostExplanation(
  input: PostPerformanceExplanationInput
): Promise<PostPerformanceExplanationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: POST_EXPLANATION_SYSTEM_PROMPT },
            { role: "user", content: JSON.stringify(input) },
          ],
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const parsed = JSON.parse(json.choices[0].message.content);
        return {
          headline: parsed.headline || "Performance Benchmark Analysis",
          explanation: parsed.explanation || "Output compared against channel medians.",
          keyDrivers: Array.isArray(parsed.keyDrivers) ? parsed.keyDrivers : [],
          testingRecommendation: parsed.testingRecommendation || "Test variants with similar framing.",
          confidence: parsed.confidence || "promising_pattern",
        };
      }
    } catch {
      // Fallback
    }
  }

  // Deterministic Heuristic Explanation (Rule 18, 30, 34)
  const viewsDelta = input.benchmarks.viewsVsMedian ?? 0;
  const sharesDelta = input.benchmarks.sharesVsMedian ?? 0;
  const percentile = input.benchmarks.percentileRank ?? 50;

  const drivers: string[] = [];
  if (input.analysis?.hookType && input.analysis.hookType !== "none") {
    drivers.push(`Employed a ${input.analysis.hookType} hook format in the opening frame.`);
  }
  if (sharesDelta > 30) {
    drivers.push(`Generated +${sharesDelta.toFixed(0)}% more shares than typical channel posts, signaling high community utility.`);
  }
  if (input.analysis?.ctaType && input.analysis.ctaType !== "none") {
    drivers.push(`Included explicit call-to-action: "${input.analysis.ctaType}".`);
  }

  let headline = "Standard Performance Alignment";
  let explanation = `This post performed near typical historical medians for ${input.platform}.`;
  let rec = "Continue monitoring engagement trajectory across 7-day snapshot windows.";
  let confidence: "early_signal" | "promising_pattern" | "strong_evidence" = "promising_pattern";

  if (percentile >= 80) {
    headline = "Top-Decile Channel Performer";
    explanation = `This post outperformed ${percentile}% of historical posts on ${input.platform}, generating +${viewsDelta.toFixed(0)}% more views and +${sharesDelta.toFixed(0)}% higher amplification than account median.`;
    rec = `Replicate the ${input.analysis?.contentFormat || "format"} storytelling structure in upcoming campaign posts.`;
    confidence = percentile >= 90 ? "strong_evidence" : "promising_pattern";
  } else if (viewsDelta < -30) {
    headline = "Below-Median Reach";
    explanation = `Reached ${Math.abs(viewsDelta).toFixed(0)}% fewer users than account median, though engagement quality remains consistent.`;
    rec = "Experiment with stronger question or statistic hooks in first 3 seconds/lines.";
    confidence = "early_signal";
  }

  return {
    headline,
    explanation,
    keyDrivers: drivers.length > 0 ? drivers : ["Aligned with standard channel baseline cadence."],
    testingRecommendation: rec,
    confidence,
  };
}
