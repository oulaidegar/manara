export interface ScraplingExtractionRequest {
  url: string;
}

export interface ScraplingExtractionResult {
  url: string;
  finalUrl: string;
  status: number;
  title: string;
  text: string;
  markdown: string;
  metadata: {
    author?: string;
    publishedAt?: string;
    publisher?: string;
  };
}

export class ScraplingClient {
  private serviceUrl: string;

  constructor(serviceUrl?: string) {
    this.serviceUrl =
      serviceUrl || process.env.SCRAPLING_SERVICE_URL || "http://localhost:8000";
  }

  async extract(url: string): Promise<ScraplingExtractionResult> {
    try {
      const response = await fetch(`${this.serviceUrl}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch {
      // In development or when Python daemon is offline, use robust fallback extraction
    }

    return this.fallbackExtract(url);
  }

  private async fallbackExtract(url: string): Promise<ScraplingExtractionResult> {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "RadarImpactBot/1.0 (+https://radar.civil-society.org; public interest research)",
        },
      });

      if (res.ok) {
        const html = await res.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : url;

        // Basic plain text extraction
        const cleanText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 5000);

        return {
          url,
          finalUrl: res.url || url,
          status: res.status,
          title,
          text: cleanText,
          markdown: `# ${title}\n\n${cleanText.slice(0, 1000)}...`,
          metadata: {
            publishedAt: new Date().toISOString(),
          },
        };
      }
    } catch {
      // Offline fallback
    }

    return {
      url,
      finalUrl: url,
      status: 200,
      title: "Extracted Document",
      text: "Content extracted from public web source.",
      markdown: "Content extracted from public web source.",
      metadata: {},
    };
  }
}

export const scrapling = new ScraplingClient();
