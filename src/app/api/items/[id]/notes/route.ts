import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getItemNote, upsertItemNote } from "@/lib/services/notes.service";
import { z } from "zod";

const noteSchema = z.object({
  content: z.string().min(1, "Content cannot be empty"),
});

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const note = await getItemNote(id, session.id);
    return NextResponse.json({ note });
  } catch (error: any) {
    console.error("GET note error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
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
    const parsed = noteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const note = await upsertItemNote(id, session.id, parsed.data.content);
    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    console.error("POST note error:", error);
    return NextResponse.json({ error: error.message || "Failed to update note" }, { status: 500 });
  }
}
