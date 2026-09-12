import { getDb } from "@/lib/db";
import { notes, savedItems, type Note } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function getItemNote(itemId: string, userId: string): Promise<Note | null> {
  const db = await getDb();

  // Verify item ownership
  const [item] = await db
    .select({ id: savedItems.id })
    .from(savedItems)
    .where(and(eq(savedItems.id, itemId), eq(savedItems.userId, userId)))
    .limit(1);

  if (!item) return null;

  const [note] = await db
    .select()
    .from(notes)
    .where(eq(notes.itemId, itemId))
    .orderBy(desc(notes.updatedAt))
    .limit(1);

  return note || null;
}

export async function upsertItemNote(itemId: string, userId: string, content: string): Promise<Note> {
  const db = await getDb();

  // Verify item ownership
  const [item] = await db
    .select({ id: savedItems.id })
    .from(savedItems)
    .where(and(eq(savedItems.id, itemId), eq(savedItems.userId, userId)))
    .limit(1);

  if (!item) {
    throw new Error("Item not found or unauthorized");
  }

  const [existingNote] = await db
    .select()
    .from(notes)
    .where(eq(notes.itemId, itemId))
    .limit(1);

  if (existingNote) {
    const [updated] = await db
      .update(notes)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, existingNote.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(notes)
    .values({
      id: randomUUID(),
      itemId,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return created;
}
