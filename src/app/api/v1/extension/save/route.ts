import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { users, apiKeys } from "@/lib/db/schema";
import { extractMetadata } from "@/lib/metadata/extractor";
import { isSafeUrl } from "@/lib/metadata/ssrf";
import { createItem } from "@/lib/services/items.service";
import { eq } from "drizzle-orm";
import { z } from "zod";

const extensionSaveSchema = z.object({
  url: z.string().url("A valid URL is required"),
  note: z.string().optional(),
  tagNames: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    let userId: string | null = null;

    // 1. Check Bearer Token / API key in Authorization header
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const db = await getDb();
      // Check if matches an API key or user token
      const [keyRecord] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.keyHash, token))
        .limit(1);

      if (keyRecord) {
        userId = keyRecord.userId;
      }
    }

    // 2. Fallback to active browser session cookie
    if (!userId) {
      const session = await getSession();
      if (session) {
        userId = session.id;
      }
    }

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized: Please provide a valid Bearer token or sign in to your browser session",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = extensionSaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { url, note, tagNames } = parsed.data;

    // Validate URL against SSRF
    const safeCheck = isSafeUrl(url);
    if (!safeCheck.safe) {
      return NextResponse.json(
        { error: safeCheck.reason || "Target URL violates security policy" },
        { status: 400 }
      );
    }

    // Extract rich metadata automatically
    const metadata = await extractMetadata(url);

    // Save directly to user's Inbox
    const item = await createItem({
      userId,
      url: metadata.url,
      title: metadata.title,
      description: metadata.description,
      domain: metadata.domain,
      type: metadata.type,
      thumbnailUrl: metadata.thumbnailUrl,
      faviconUrl: metadata.faviconUrl,
      author: metadata.author,
      duration: metadata.duration,
      status: "INBOX",
      isFavorite: false,
      tagNames: tagNames || [],
      note,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Saved to Lumora inbox",
        item,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Extension save error:", error);
    return NextResponse.json({ error: error.message || "Failed to process save" }, { status: 500 });
  }
}
