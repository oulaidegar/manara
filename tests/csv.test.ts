import { describe, it, expect } from "vitest";
import {
  parseCsv,
  suggestColumnMapping,
  validateAndMapRows,
  generateCanonicalTemplateCsv,
  CANONICAL_FIELDS,
} from "../lib/csv";

describe("CSV Import Utilities (Section 21)", () => {
  it("parses simple CSV correctly", () => {
    const csv = `title,date,views\nInvestigation 1,2026-03-01,1500\nVideo 2,2026-03-02,2800`;
    const { headers, rows } = parseCsv(csv);
    expect(headers).toEqual(["title", "date", "views"]);
    expect(rows).toHaveLength(2);
    expect(rows[0].title).toBe("Investigation 1");
    expect(rows[0].views).toBe("1500");
    expect(rows[1].title).toBe("Video 2");
  });

  it("handles commas and escaped quotes within quoted fields", () => {
    const csv = `title,text,date\n"Investigation: High-Level, Direct Impact","He said ""no comment"" to reporters.",2026-03-05`;
    const { headers, rows } = parseCsv(csv);
    expect(headers).toEqual(["title", "text", "date"]);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Investigation: High-Level, Direct Impact");
    expect(rows[0].text).toBe('He said "no comment" to reporters.');
  });

  it("handles UTF-8 BOM automatically", () => {
    const csv = `\uFEFFdate,title\n2026-03-01,BOM Test`;
    const { headers, rows } = parseCsv(csv);
    expect(headers[0]).toBe("date");
    expect(rows[0].title).toBe("BOM Test");
  });

  it("auto-suggests column mappings using alias heuristics", () => {
    const headers = [
      "Published_At",
      "Content_Title",
      "Post_ID",
      "Network",
      "Total_Impressions",
      "Video_Views",
      "Reposts",
      "Link",
    ];
    const mapping = suggestColumnMapping(headers);

    expect(mapping["Published_At"]).toBe("date");
    expect(mapping["Content_Title"]).toBe("title");
    expect(mapping["Post_ID"]).toBe("external_id");
    expect(mapping["Network"]).toBe("platform");
    expect(mapping["Total_Impressions"]).toBe("impressions");
    expect(mapping["Video_Views"]).toBe("views");
    expect(mapping["Reposts"]).toBe("shares");
    expect(mapping["Link"]).toBe("url");
  });

  it("validates valid and invalid rows correctly", () => {
    const rawRows = [
      {
        PubDate: "2026-03-10",
        Headline: "Solid Investigation Report",
        Views: "12,500",
        Shares: "450",
      },
      {
        PubDate: "not-a-valid-date",
        Headline: "Broken Date Post",
        Views: "100",
        Shares: "10",
      },
      {
        PubDate: "2026-03-12",
        Headline: "", // missing required title
        Views: "50",
        Shares: "2",
      },
    ];

    const mapping = {
      PubDate: "date",
      Headline: "title",
      Views: "views",
      Shares: "shares",
    };

    const { validRows, invalidRows, summary } = validateAndMapRows(rawRows, mapping);

    expect(summary.total).toBe(3);
    expect(summary.valid).toBe(1);
    expect(summary.invalid).toBe(2);

    expect(validRows[0].data.title).toBe("Solid Investigation Report");
    expect(validRows[0].data.views).toBe(12500);
    expect(validRows[0].data.shares).toBe(450);

    expect(invalidRows[0].errors).toContain('Invalid date format "not-a-valid-date"');
    expect(invalidRows[1].errors).toContain("Missing required field 'title'");
  });

  it("generates a canonical template CSV with valid structure", () => {
    const template = generateCanonicalTemplateCsv();
    const { headers, rows } = parseCsv(template);

    expect(headers).toContain("date");
    expect(headers).toContain("platform");
    expect(headers).toContain("title");
    expect(headers).toContain("impressions");
    expect(headers).toContain("shares");
    expect(rows.length).toBeGreaterThanOrEqual(3);

    // Verify template passes validation
    const mapping: Record<string, string> = {};
    CANONICAL_FIELDS.forEach((f) => {
      mapping[f.key] = f.key;
    });

    const { validRows, invalidRows } = validateAndMapRows(rows, mapping);
    expect(invalidRows).toHaveLength(0);
    expect(validRows.length).toBe(rows.length);
  });
});
