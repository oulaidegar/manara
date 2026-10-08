import { NextRequest, NextResponse } from "next/server";
import { ingestPostFromUrl } from "@/lib/social/quick-ingest";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid URL string is required" },
        { status: 400 }
      );
    }

    const postData = await ingestPostFromUrl(url);
    return NextResponse.json(postData);
  } catch (error) {
    console.error("Quick Ingest Error:", error);
    return NextResponse.json(
      { error: "Failed to extract and analyze post content" },
      { status: 500 }
    );
  }
}
