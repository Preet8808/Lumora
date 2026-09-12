import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createItem, getItems, getStats } from "@/lib/services/items.service";
import { z } from "zod";

const createItemSchema = z.object({
  url: z.string().url("Valid URL required"),
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  domain: z.string().min(1),
  type: z.string().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  faviconUrl: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  duration: z.number().nullable().optional(),
  status: z.enum(["INBOX", "WANT_TO_READ", "IN_PROGRESS", "FINISHED", "ARCHIVED"]).optional(),
  isFavorite: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
  tagNames: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const isFavoriteParam = searchParams.get("favorite");
    const isFavorite = isFavoriteParam !== null ? isFavoriteParam === "true" : undefined;
    const type = searchParams.get("type") || undefined;
    const tagId = searchParams.get("tagId") || undefined;
    const collectionId = searchParams.get("collectionId") || undefined;
    const domain = searchParams.get("domain") || undefined;
    const sortBy = (searchParams.get("sortBy") as any) || "savedAt";
    const sortOrder = (searchParams.get("sortOrder") as any) || "desc";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined;

    const items = await getItems({
      userId: session.id,
      status,
      isFavorite,
      type,
      tagId,
      collectionId,
      domain,
      sortBy,
      sortOrder,
      limit,
      offset,
    });

    const stats = await getStats(session.id);

    return NextResponse.json({ items, stats });
  } catch (error: any) {
    console.error("GET items error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const item = await createItem({
      ...parsed.data,
      userId: session.id,
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error("POST items error:", error);
    return NextResponse.json({ error: error.message || "Failed to create item" }, { status: 500 });
  }
}
