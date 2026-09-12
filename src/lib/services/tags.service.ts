import { getDb } from "@/lib/db";
import { tags, itemTags, type Tag } from "@/lib/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface TagWithCount extends Tag {
  itemCount: number;
}

export async function getUserTags(userId: string): Promise<TagWithCount[]> {
  const db = await getDb();

  const userTags = await db
    .select()
    .from(tags)
    .where(eq(tags.userId, userId))
    .orderBy(asc(tags.name));

  if (!userTags.length) return [];

  // Count items per tag
  const counts = await db
    .select({
      tagId: itemTags.tagId,
      count: sql<number>`count(${itemTags.itemId})::int`,
    })
    .from(itemTags)
    .groupBy(itemTags.tagId);

  const countMap = new Map<string, number>();
  counts.forEach((c: any) => countMap.set(c.tagId, Number(c.count) || 0));

  return userTags.map((tag: Tag) => ({
    ...tag,
    itemCount: countMap.get(tag.id) || 0,
  }));
}

export async function createTag(userId: string, name: string, color?: string): Promise<Tag> {
  const cleanName = name.trim().replace(/^#/, "");
  if (!cleanName) throw new Error("Tag name cannot be empty");

  const db = await getDb();

  // Check if exists
  const [existing] = await db
    .select()
    .from(tags)
    .where(and(eq(tags.userId, userId), eq(tags.name, cleanName)))
    .limit(1);

  if (existing) return existing;

  const newTagId = randomUUID();
  const [tag] = await db
    .insert(tags)
    .values({
      id: newTagId,
      userId,
      name: cleanName,
      color: color || "#6366f1",
    })
    .returning();

  return tag;
}

export async function renameTag(tagId: string, userId: string, newName: string): Promise<Tag | null> {
  const cleanName = newName.trim().replace(/^#/, "");
  if (!cleanName) throw new Error("Tag name cannot be empty");

  const db = await getDb();

  const [updated] = await db
    .update(tags)
    .set({ name: cleanName })
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .returning();

  return updated || null;
}

export async function deleteTag(tagId: string, userId: string): Promise<boolean> {
  const db = await getDb();
  await db.delete(tags).where(and(eq(tags.id, tagId), eq(tags.userId, userId)));
  return true;
}
