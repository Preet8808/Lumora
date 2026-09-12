import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUserTags, createTag } from "@/lib/services/tags.service";
import { z } from "zod";

const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  color: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tags = await getUserTags(session.id);
    return NextResponse.json({ tags });
  } catch (error: any) {
    console.error("GET tags error:", error);
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
    const parsed = createTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const tag = await createTag(session.id, parsed.data.name, parsed.data.color);
    return NextResponse.json({ success: true, tag }, { status: 201 });
  } catch (error: any) {
    console.error("POST tag error:", error);
    return NextResponse.json({ error: error.message || "Failed to create tag" }, { status: 500 });
  }
}
