import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { searchItems } from "@/lib/services/search.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || undefined;
    const type = searchParams.get("type") || undefined;
    const status = searchParams.get("status") || undefined;
    const tagId = searchParams.get("tagId") || undefined;
    const collectionId = searchParams.get("collectionId") || undefined;
    const domain = searchParams.get("domain") || undefined;
    const favoriteParam = searchParams.get("favorite");
    const isFavorite = favoriteParam !== null ? favoriteParam === "true" : undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

    const results = await searchItems(session.id, {
      query,
      type,
      status,
      tagId,
      collectionId,
      domain,
      isFavorite,
      limit,
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
