/**
 * CSV Import Engine Utilities for Radar (Section 21)
 *
 * Implements RFC-4180 parsing, canonical column mapping,
 * auto-detection heuristics, and sample template generation.
 */

export interface CanonicalField {
  key: string;
  label: string;
  required: boolean;
  type: "string" | "date" | "number";
  description: string;
  aliases: string[];
}

export const CANONICAL_FIELDS: CanonicalField[] = [
  {
    key: "date",
    label: "Date / Published At",
    required: true,
    type: "date",
    description: "Publication date (e.g., 2026-03-15 or ISO-8601)",
    aliases: [
      "date",
      "published_at",
      "publishedat",
      "publish_date",
      "post_date",
      "created_at",
      "created_time",
      "timestamp",
      "time",
    ],
  },
  {
    key: "title",
    label: "Title / Headline",
    required: true,
    type: "string",
    description: "Primary headline or title of the content item",
    aliases: [
      "title",
      "headline",
      "name",
      "content_title",
      "post_title",
      "video_title",
      "subject",
    ],
  },
  {
    key: "platform",
    label: "Platform / Network",
    required: false,
    type: "string",
    description: "e.g., youtube, linkedin, meta, twitter, web, substack",
    aliases: [
      "platform",
      "source",
      "network",
      "provider",
      "channel_type",
      "medium",
    ],
  },
  {
    key: "account",
    label: "Account / Channel Handle",
    required: false,
    type: "string",
    description: "Account handle or publishing brand",
    aliases: ["account", "handle", "channel", "profile", "page_name", "author"],
  },
  {
    key: "url",
    label: "Content URL",
    required: false,
    type: "string",
    description: "Permanent web link to the original publication",
    aliases: ["url", "link", "permalink", "post_url", "content_url", "href"],
  },
  {
    key: "external_id",
    label: "External Platform ID",
    required: false,
    type: "string",
    description: "Unique provider ID used for high-confidence deduplication",
    aliases: [
      "external_id",
      "externalid",
      "id",
      "post_id",
      "video_id",
      "item_id",
      "content_id",
    ],
  },
  {
    key: "text",
    label: "Text / Caption / Excerpt",
    required: false,
    type: "string",
    description: "Full post body, description, or transcript excerpt",
    aliases: ["text", "content", "body", "caption", "description", "message", "summary"],
  },
  {
    key: "content_type",
    label: "Content Type / Format",
    required: false,
    type: "string",
    description: "e.g., post, video, short_video, article, report, investigation",
    aliases: ["content_type", "contenttype", "type", "format", "media_type", "post_type"],
  },
  {
    key: "impressions",
    label: "Impressions",
    required: false,
    type: "number",
    description: "Total times content was displayed on screen",
    aliases: ["impressions", "total_impressions", "post_impressions", "impr"],
  },
  {
    key: "reach",
    label: "Reach",
    required: false,
    type: "number",
    description: "Unique individuals who viewed the content",
    aliases: ["reach", "unique_reach", "unique_viewers", "accounts_reached"],
  },
  {
    key: "views",
    label: "Views / Video Plays",
    required: false,
    type: "number",
    description: "Total video views or article reads",
    aliases: ["views", "video_views", "plays", "watch_count", "total_views"],
  },
  {
    key: "likes",
    label: "Likes / Reactions",
    required: false,
    type: "number",
    description: "Lightweight endorsement reactions",
    aliases: ["likes", "reactions", "favorites", "upvotes"],
  },
  {
    key: "comments",
    label: "Comments / Replies",
    required: false,
    type: "number",
    description: "Public discussion and responses",
    aliases: ["comments", "replies", "discussion_count"],
  },
  {
    key: "shares",
    label: "Shares / Reposts",
    required: false,
    type: "number",
    description: "Distribution actions (meaningful amplification)",
    aliases: ["shares", "reposts", "retweets", "forwards"],
  },
  {
    key: "saves",
    label: "Saves / Bookmarks",
    required: false,
    type: "number",
    description: "Intent to retain or reference content (high intent)",
    aliases: ["saves", "bookmarks", "saved", "favorites_saved"],
  },
  {
    key: "clicks",
    label: "Clicks",
    required: false,
    type: "number",
    description: "Link clicks outbound or interactive actions",
    aliases: ["clicks", "link_clicks", "url_clicks", "outbound_clicks"],
  },
];

/**
 * Robust RFC-4180 compliant CSV parser
 */
export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  // Strip UTF-8 BOM if present
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const rawLines: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = "";
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentVal.trim());
        currentVal = "";
      } else if (char === "\r") {
        if (nextChar === "\n") i++;
        currentRow.push(currentVal.trim());
        currentVal = "";
        if (currentRow.some((c) => c !== "")) {
          rawLines.push(currentRow);
        }
        currentRow = [];
      } else if (char === "\n") {
        currentRow.push(currentVal.trim());
        currentVal = "";
        if (currentRow.some((c) => c !== "")) {
          rawLines.push(currentRow);
        }
        currentRow = [];
      } else {
        currentVal += char;
      }
    }
  }

  // Push remaining field if any
  if (currentVal !== "" || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((c) => c !== "")) {
      rawLines.push(currentRow);
    }
  }

  if (rawLines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = rawLines[0].map((h) => h.replace(/^["']|["']$/g, "").trim());
  const rows: Record<string, string>[] = [];

  for (let r = 1; r < rawLines.length; r++) {
    const line = rawLines[r];
    const rowObj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const header = headers[c];
      if (header) {
        rowObj[header] = line[c] ?? "";
      }
    }
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Automatically suggests a mapping from CSV header to Canonical field key
 */
export function suggestColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const header of headers) {
    const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Phase 1: Check for exact match against canonical keys and aliases
    let matchedKey: string | null = null;

    for (const field of CANONICAL_FIELDS) {
      const exactMatch = field.aliases.some((alias) => {
        const normAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, "");
        return normalized === normAlias;
      });

      if (exactMatch) {
        matchedKey = field.key;
        break;
      }
    }

    // Phase 2: If no exact match, check for non-trivial substring matches (alias length >= 4)
    if (!matchedKey) {
      for (const field of CANONICAL_FIELDS) {
        const subMatch = field.aliases.some((alias) => {
          const normAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (normAlias.length < 4) return false;
          return normalized.includes(normAlias);
        });

        if (subMatch) {
          matchedKey = field.key;
          break;
        }
      }
    }

    if (matchedKey) {
      mapping[header] = matchedKey;
    }
  }

  return mapping;
}

export interface ValidatedRow {
  rowNumber: number;
  data: {
    date: string;
    title: string;
    platform?: string;
    account?: string;
    url?: string;
    externalId?: string;
    text?: string;
    contentType?: string;
    impressions?: number;
    reach?: number;
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    clicks?: number;
  };
  errors: string[];
}

/**
 * Validates and transforms parsed rows using the given header-to-canonical mapping
 */
export function validateAndMapRows(
  rows: Record<string, string>[],
  columnMapping: Record<string, string>,
  defaultPlatform = "general"
): {
  validRows: ValidatedRow[];
  invalidRows: ValidatedRow[];
  summary: { total: number; valid: number; invalid: number };
} {
  const validRows: ValidatedRow[] = [];
  const invalidRows: ValidatedRow[] = [];

  // Invert mapping for quick canonical field lookup: canonicalKey -> csvHeader
  const fieldToHeader: Record<string, string> = {};
  for (const [csvHeader, canonicalKey] of Object.entries(columnMapping)) {
    if (canonicalKey) {
      fieldToHeader[canonicalKey] = csvHeader;
    }
  }

  rows.forEach((row, idx) => {
    const rowNumber = idx + 1;
    const errors: string[] = [];

    const getVal = (key: string): string => {
      const header = fieldToHeader[key];
      return header && row[header] !== undefined ? row[header].trim() : "";
    };

    const getNum = (key: string): number | undefined => {
      const raw = getVal(key);
      if (!raw) return undefined;
      // Strip formatting commas, currencies, spaces
      const cleanNum = raw.replace(/[$, ]/g, "");
      const parsed = parseFloat(cleanNum);
      return isNaN(parsed) ? undefined : Math.max(0, parsed);
    };

    const rawDate = getVal("date");
    const title = getVal("title");

    if (!rawDate) {
      errors.push("Missing required field 'date'");
    } else {
      const ts = Date.parse(rawDate);
      if (isNaN(ts)) {
        errors.push(`Invalid date format "${rawDate}"`);
      }
    }

    if (!title) {
      errors.push("Missing required field 'title'");
    }

    const rowData = {
      date: rawDate,
      title: title || `Untitled Content Item #${rowNumber}`,
      platform: getVal("platform") || defaultPlatform,
      account: getVal("account") || undefined,
      url: getVal("url") || undefined,
      externalId: getVal("external_id") || undefined,
      text: getVal("text") || undefined,
      contentType: getVal("content_type") || "post",
      impressions: getNum("impressions"),
      reach: getNum("reach"),
      views: getNum("views"),
      likes: getNum("likes"),
      comments: getNum("comments"),
      shares: getNum("shares"),
      saves: getNum("saves"),
      clicks: getNum("clicks"),
    };

    const validated: ValidatedRow = {
      rowNumber,
      data: rowData,
      errors,
    };

    if (errors.length === 0) {
      validRows.push(validated);
    } else {
      invalidRows.push(validated);
    }
  });

  return {
    validRows,
    invalidRows,
    summary: {
      total: rows.length,
      valid: validRows.length,
      invalid: invalidRows.length,
    },
  };
}

/**
 * Generates the canonical sample CSV template per Section 21
 */
export function generateCanonicalTemplateCsv(): string {
  const headers = [
    "date",
    "platform",
    "account",
    "url",
    "external_id",
    "title",
    "text",
    "content_type",
    "impressions",
    "reach",
    "views",
    "likes",
    "comments",
    "shares",
    "saves",
    "clicks",
  ];

  const sampleRows = [
    [
      "2026-03-01",
      "youtube",
      "TransparencyWatch",
      "https://youtube.com/watch?v=sample-procurement-1",
      "yt-vid-001",
      "Procurement Discrepancies: Where Did the $4.2M Healthcare Grant Go?",
      "Deep dive video investigation analyzing public expenditure records and ministerial contract approvals.",
      "video",
      "125000",
      "94000",
      "48200",
      "3400",
      "890",
      "1420",
      "680",
      "2900",
    ],
    [
      "2026-03-04",
      "linkedin",
      "CivicAccountability",
      "https://linkedin.com/posts/sample-procurement-findings",
      "li-post-002",
      "Executive Briefing: 5 Key Findings from the Healthcare Procurement Audit",
      "Summary infographic highlighting single-source vendor awards without statutory public tender proceedings.",
      "post",
      "46000",
      "31000",
      "18500",
      "1850",
      "210",
      "490",
      "380",
      "1120",
    ],
    [
      "2026-03-08",
      "website",
      "OpenJustice",
      "https://openjustice.org/reports/procurement-investigation-final",
      "web-rep-003",
      "Dossier: The 2026 State Procurement Transparency Audit Report",
      "Full 64-page verified research report with public asset disclosure indices and parliamentary references.",
      "report",
      "34000",
      "27000",
      "14000",
      "980",
      "94",
      "850",
      "1420",
      "4600",
    ],
  ];

  const escapeCell = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const csvLines = [
    headers.join(","),
    ...sampleRows.map((r) => r.map(escapeCell).join(",")),
  ];

  return csvLines.join("\n");
}
