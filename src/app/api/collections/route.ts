import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUserCollections, createCollection } from "@/lib/services/collections.service";
import { z } from "zod";

const createCollectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collections = await getUserCollections(session.id);
    return NextResponse.json({ collections });
  } catch (error: any) {
    console.error("GET collections error:", error);
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
    const parsed = createCollectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const collection = await createCollection(session.id, parsed.data);
    return NextResponse.json({ success: true, collection }, { status: 201 });
  } catch (error: any) {
    console.error("POST collection error:", error);
    return NextResponse.json({ error: error.message || "Failed to create collection" }, { status: 500 });
  }
}
