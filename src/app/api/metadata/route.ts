import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { extractMetadata } from "@/lib/metadata/extractor";
import { isSafeUrl } from "@/lib/metadata/ssrf";
import { z } from "zod";

const metadataSchema = z.object({
  url: z.string().min(1, "URL is required"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = metadataSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid URL input" }, { status: 400 });
    }

    const safeCheck = isSafeUrl(parsed.data.url);
    if (!safeCheck.safe) {
      return NextResponse.json(
        {
          error: safeCheck.reason || "URL violates security policy (private or loopback IP)",
          blocked: true,
        },
        { status: 400 }
      );
    }

    const metadata = await extractMetadata(parsed.data.url);
    return NextResponse.json({ success: true, metadata });
  } catch (error: any) {
    console.error("Metadata extraction error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to extract metadata",
        fallback: true,
      },
      { status: 200 }
    );
  }
}
