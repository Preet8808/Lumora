import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getItemById, updateItem, deleteItem } from "@/lib/services/items.service";
import { z } from "zod";

const updateItemSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["INBOX", "WANT_TO_READ", "IN_PROGRESS", "FINISHED", "ARCHIVED"]).optional(),
  isFavorite: z.boolean().optional(),
  progress: z.number().min(0).max(100).optional(),
  duration: z.number().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
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
    const item = await getItemById(id, session.id);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error("GET item error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const parsed = updateItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const updated = await updateItem(id, session.id, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: "Item not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("PATCH item error:", error);
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
    await deleteItem(id, session.id);

    return NextResponse.json({ success: true, message: "Item deleted" });
  } catch (error: any) {
    console.error("DELETE item error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
