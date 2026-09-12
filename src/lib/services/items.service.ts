import { getDb } from "@/lib/db";
import {
  savedItems,
  itemTags,
  tags,
  itemCollections,
  collections,
  notes,
  type SavedItem,
  type NewSavedItem,
} from "@/lib/db/schema";
import { eq, and, desc, asc, inArray, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface ItemWithDetails extends SavedItem {
  tags: Array<{ id: string; name: string; color: string | null }>;
  collections: Array<{ id: string; name: string; color: string | null; icon: string | null }>;
  notes?: Array<{ id: string; content: string; updatedAt: Date }>;
}

export interface GetItemsOptions {
  userId: string;
  status?: string;
  isFavorite?: boolean;
  type?: string;
  tagId?: string;
  collectionId?: string;
  domain?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "savedAt" | "title" | "progress";
  sortOrder?: "asc" | "desc";
}

export async function createItem(
  data: {
    userId: string;
    url: string;
    title: string;
    description?: string;
    domain: string;
    type?: string;
    thumbnailUrl?: string | null;
    faviconUrl?: string | null;
    author?: string | null;
    duration?: number | null;
    status?: string;
    isFavorite?: boolean;
    tagIds?: string[];
    tagNames?: string[];
    collectionIds?: string[];
    note?: string;
  }
): Promise<ItemWithDetails> {
  const db = await getDb();
  const itemId = randomUUID();

  const newItem: NewSavedItem = {
    id: itemId,
    userId: data.userId,
    url: data.url,
    title: data.title,
    description: data.description || "",
    domain: data.domain,
    type: data.type || "website",
    thumbnailUrl: data.thumbnailUrl || null,
    faviconUrl: data.faviconUrl || null,
    author: data.author || null,
    duration: data.duration || null,
    status: data.status || "INBOX",
    isFavorite: data.isFavorite || false,
    progress: 0,
    savedAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(savedItems).values(newItem);

  // Handle Tags
  const resolvedTagIds: string[] = [...(data.tagIds || [])];
  if (data.tagNames && data.tagNames.length > 0) {
    for (const rawName of data.tagNames) {
      const name = rawName.trim().replace(/^#/, "");
      if (!name) continue;
      // Check if tag exists for this user
      const [existingTag] = await db
        .select()
        .from(tags)
        .where(and(eq(tags.userId, data.userId), eq(tags.name, name)))
        .limit(1);

      if (existingTag) {
        if (!resolvedTagIds.includes(existingTag.id)) {
          resolvedTagIds.push(existingTag.id);
        }
      } else {
        const newTagId = randomUUID();
        await db.insert(tags).values({
          id: newTagId,
          userId: data.userId,
          name,
          color: getRandomTagColor(),
        });
        resolvedTagIds.push(newTagId);
      }
    }
  }

  for (const tagId of resolvedTagIds) {
    await db.insert(itemTags).values({ itemId, tagId }).onConflictDoNothing();
  }

  // Handle Collections
  if (data.collectionIds && data.collectionIds.length > 0) {
    for (const collectionId of data.collectionIds) {
      await db.insert(itemCollections).values({ itemId, collectionId }).onConflictDoNothing();
    }
  }

  // Handle Note
  if (data.note && data.note.trim()) {
    await db.insert(notes).values({
      id: randomUUID(),
      itemId,
      content: data.note.trim(),
    });
  }

  return (await getItemById(itemId, data.userId))!;
}

export async function getItemById(itemId: string, userId: string): Promise<ItemWithDetails | null> {
  const db = await getDb();

  const [item] = await db
    .select()
    .from(savedItems)
    .where(and(eq(savedItems.id, itemId), eq(savedItems.userId, userId)))
    .limit(1);

  if (!item) return null;

  // Fetch Tags
  const tagsResult = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(itemTags)
    .innerJoin(tags, eq(itemTags.tagId, tags.id))
    .where(eq(itemTags.itemId, itemId));

  // Fetch Collections
  const collectionsResult = await db
    .select({
      id: collections.id,
      name: collections.name,
      color: collections.color,
      icon: collections.icon,
    })
    .from(itemCollections)
    .innerJoin(collections, eq(itemCollections.collectionId, collections.id))
    .where(eq(itemCollections.itemId, itemId));

  // Fetch Notes
  const notesResult = await db
    .select({
      id: notes.id,
      content: notes.content,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(eq(notes.itemId, itemId))
    .orderBy(desc(notes.updatedAt));

  return {
    ...item,
    tags: tagsResult,
    collections: collectionsResult,
    notes: notesResult,
  };
}

export async function getItems(options: GetItemsOptions): Promise<ItemWithDetails[]> {
  const db = await getDb();

  const conditions = [eq(savedItems.userId, options.userId)];

  if (options.status) {
    conditions.push(eq(savedItems.status, options.status));
  }

  if (options.isFavorite !== undefined) {
    conditions.push(eq(savedItems.isFavorite, options.isFavorite));
  }

  if (options.type) {
    conditions.push(eq(savedItems.type, options.type));
  }

  if (options.domain) {
    conditions.push(eq(savedItems.domain, options.domain));
  }

  let query = db.select().from(savedItems).where(and(...conditions));

  const sortCol =
    options.sortBy === "title"
      ? savedItems.title
      : options.sortBy === "progress"
      ? savedItems.progress
      : savedItems.savedAt;

  const orderFn = options.sortOrder === "asc" ? asc : desc;
  query = query.orderBy(orderFn(sortCol));

  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.offset(options.offset);
  }

  const items = await query;
  if (!items.length) return [];

  // Batch fetch tags and collections for these items
  const itemIds = items.map((i: any) => i.id);

  const allItemTags = await db
    .select({
      itemId: itemTags.itemId,
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(itemTags)
    .innerJoin(tags, eq(itemTags.tagId, tags.id))
    .where(inArray(itemTags.itemId, itemIds));

  const allItemCollections = await db
    .select({
      itemId: itemCollections.itemId,
      id: collections.id,
      name: collections.name,
      color: collections.color,
      icon: collections.icon,
    })
    .from(itemCollections)
    .innerJoin(collections, eq(itemCollections.collectionId, collections.id))
    .where(inArray(itemCollections.itemId, itemIds));

  // Map into items
  let enrichedItems: ItemWithDetails[] = items.map((item: any) => {
    const itemTagsList = allItemTags
      .filter((t: any) => t.itemId === item.id)
      .map((t: any) => ({ id: t.id, name: t.name, color: t.color }));

    const itemCollectionsList = allItemCollections
      .filter((c: any) => c.itemId === item.id)
      .map((c: any) => ({ id: c.id, name: c.name, color: c.color, icon: c.icon }));

    return {
      ...item,
      tags: itemTagsList,
      collections: itemCollectionsList,
    };
  });

  // Filter in memory for tagId or collectionId if specified
  if (options.tagId) {
    enrichedItems = enrichedItems.filter((item) =>
      item.tags.some((t) => t.id === options.tagId)
    );
  }

  if (options.collectionId) {
    enrichedItems = enrichedItems.filter((item) =>
      item.collections.some((c) => c.id === options.collectionId)
    );
  }

  return enrichedItems;
}

export async function updateItem(
  itemId: string,
  userId: string,
  updates: {
    title?: string;
    description?: string;
    status?: string;
    isFavorite?: boolean;
    progress?: number;
    duration?: number | null;
    tagIds?: string[];
    collectionIds?: string[];
  }
): Promise<ItemWithDetails | null> {
  const db = await getDb();

  // Verify ownership
  const [existing] = await db
    .select()
    .from(savedItems)
    .where(and(eq(savedItems.id, itemId), eq(savedItems.userId, userId)))
    .limit(1);

  if (!existing) return null;

  const itemUpdates: Partial<SavedItem> = {
    updatedAt: new Date(),
  };

  if (updates.title !== undefined) itemUpdates.title = updates.title;
  if (updates.description !== undefined) itemUpdates.description = updates.description;
  if (updates.status !== undefined) itemUpdates.status = updates.status;
  if (updates.isFavorite !== undefined) itemUpdates.isFavorite = updates.isFavorite;
  if (updates.progress !== undefined) itemUpdates.progress = Math.min(100, Math.max(0, updates.progress));
  if (updates.duration !== undefined) itemUpdates.duration = updates.duration;

  await db
    .update(savedItems)
    .set(itemUpdates)
    .where(and(eq(savedItems.id, itemId), eq(savedItems.userId, userId)));

  // Update tags if passed
  if (updates.tagIds !== undefined) {
    await db.delete(itemTags).where(eq(itemTags.itemId, itemId));
    for (const tagId of updates.tagIds) {
      await db.insert(itemTags).values({ itemId, tagId }).onConflictDoNothing();
    }
  }

  // Update collections if passed
  if (updates.collectionIds !== undefined) {
    await db.delete(itemCollections).where(eq(itemCollections.itemId, itemId));
    for (const collectionId of updates.collectionIds) {
      await db.insert(itemCollections).values({ itemId, collectionId }).onConflictDoNothing();
    }
  }

  return getItemById(itemId, userId);
}

export async function deleteItem(itemId: string, userId: string): Promise<boolean> {
  const db = await getDb();
  const res = await db
    .delete(savedItems)
    .where(and(eq(savedItems.id, itemId), eq(savedItems.userId, userId)));
  return true;
}

// Bulk Actions
export async function bulkUpdateStatus(
  itemIds: string[],
  userId: string,
  status: string
): Promise<number> {
  if (!itemIds.length) return 0;
  const db = await getDb();
  await db
    .update(savedItems)
    .set({ status, updatedAt: new Date() })
    .where(and(inArray(savedItems.id, itemIds), eq(savedItems.userId, userId)));
  return itemIds.length;
}

export async function bulkDelete(itemIds: string[], userId: string): Promise<number> {
  if (!itemIds.length) return 0;
  const db = await getDb();
  await db
    .delete(savedItems)
    .where(and(inArray(savedItems.id, itemIds), eq(savedItems.userId, userId)));
  return itemIds.length;
}

export async function bulkAddTag(
  itemIds: string[],
  userId: string,
  tagId: string
): Promise<number> {
  if (!itemIds.length) return 0;
  const db = await getDb();
  // Ensure tag belongs to user
  const [tag] = await db
    .select()
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .limit(1);

  if (!tag) return 0;

  for (const itemId of itemIds) {
    await db.insert(itemTags).values({ itemId, tagId }).onConflictDoNothing();
  }
  return itemIds.length;
}

export async function getStats(userId: string) {
  const db = await getDb();

  const allItems = await db
    .select({
      id: savedItems.id,
      status: savedItems.status,
      isFavorite: savedItems.isFavorite,
      progress: savedItems.progress,
    })
    .from(savedItems)
    .where(eq(savedItems.userId, userId));

  const allTags = await db.select({ id: tags.id }).from(tags).where(eq(tags.userId, userId));
  const allCollections = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.userId, userId));

  const inboxCount = allItems.filter((i: any) => i.status === "INBOX").length;
  const continueCount = allItems.filter(
    (i: any) => i.status === "IN_PROGRESS" || (i.progress > 0 && i.status !== "FINISHED" && i.status !== "ARCHIVED")
  ).length;
  const favoritesCount = allItems.filter((i: any) => i.isFavorite).length;
  const archiveCount = allItems.filter((i: any) => i.status === "ARCHIVED").length;

  return {
    inbox: inboxCount,
    continue: continueCount,
    favorites: favoritesCount,
    collections: allCollections.length,
    tags: allTags.length,
    archive: archiveCount,
    total: allItems.length,
  };
}

function getRandomTagColor(): string {
  const colors = [
    "#6366f1", // indigo
    "#3b82f6", // blue
    "#06b6d4", // cyan
    "#10b981", // emerald
    "#84cc16", // lime
    "#f59e0b", // amber
    "#f97316", // orange
    "#ec4899", // pink
    "#8b5cf6", // purple
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
