import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { renameTag, deleteTag } from "@/lib/services/tags.service";
import { z } from "zod";

const renameSchema = z.object({
  name: z.string().min(1, "Name required"),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const parsed = renameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const updated = await renameTag(id, session.id, parsed.data.name);
    if (!updated) {
      return NextResponse.json({ error: "Tag not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, tag: updated });
  } catch (error: any) {
    console.error("PATCH tag error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    await deleteTag(id, session.id);
    return NextResponse.json({ success: true, message: "Tag deleted" });
  } catch (error: any) {
    console.error("DELETE tag error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
