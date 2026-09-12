import { getDb } from "@/lib/db";
import { collections, itemCollections, type Collection } from "@/lib/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface CollectionWithCount extends Collection {
  itemCount: number;
}

export async function getUserCollections(userId: string): Promise<CollectionWithCount[]> {
  const db = await getDb();

  const userCollections = await db
    .select()
    .from(collections)
    .where(eq(collections.userId, userId))
    .orderBy(asc(collections.name));

  if (!userCollections.length) return [];

  // Count items per collection
  const counts = await db
    .select({
      collectionId: itemCollections.collectionId,
      count: sql<number>`count(${itemCollections.itemId})::int`,
    })
    .from(itemCollections)
    .groupBy(itemCollections.collectionId);

  const countMap = new Map<string, number>();
  counts.forEach((c: any) => countMap.set(c.collectionId, Number(c.count) || 0));

  return userCollections.map((col: Collection) => ({
    ...col,
    itemCount: countMap.get(col.id) || 0,
  }));
}

export async function getCollectionById(collectionId: string, userId: string): Promise<CollectionWithCount | null> {
  const db = await getDb();

  const [col] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, collectionId), eq(collections.userId, userId)))
    .limit(1);

  if (!col) return null;

  const [countResult] = await db
    .select({
      count: sql<number>`count(${itemCollections.itemId})::int`,
    })
    .from(itemCollections)
    .where(eq(itemCollections.collectionId, collectionId));

  return {
    ...col,
    itemCount: Number(countResult?.count) || 0,
  };
}

export async function createCollection(
  userId: string,
  data: { name: string; description?: string; color?: string; icon?: string }
): Promise<Collection> {
  const name = data.name.trim();
  if (!name) throw new Error("Collection name is required");

  const db = await getDb();
  const id = randomUUID();

  const [newCol] = await db
    .insert(collections)
    .values({
      id,
      userId,
      name,
      description: data.description?.trim() || null,
      color: data.color || "#3b82f6",
      icon: data.icon || "folder",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newCol;
}

export async function updateCollection(
  collectionId: string,
  userId: string,
  data: { name?: string; description?: string; color?: string; icon?: string }
): Promise<Collection | null> {
  const db = await getDb();

  const updates: Partial<Collection> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.description !== undefined) updates.description = data.description.trim() || null;
  if (data.color !== undefined) updates.color = data.color;
  if (data.icon !== undefined) updates.icon = data.icon;

  const [updated] = await db
    .update(collections)
    .set(updates)
    .where(and(eq(collections.id, collectionId), eq(collections.userId, userId)))
    .returning();

  return updated || null;
}

export async function deleteCollection(collectionId: string, userId: string): Promise<boolean> {
  const db = await getDb();
  await db
    .delete(collections)
    .where(and(eq(collections.id, collectionId), eq(collections.userId, userId)));
  return true;
}
