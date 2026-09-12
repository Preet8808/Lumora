import { getDb } from "@/lib/db";
import {
  savedItems,
  itemTags,
  tags,
  itemCollections,
  collections,
  notes,
} from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { ItemWithDetails } from "./items.service";

export interface SearchFilters {
  query?: string;
  type?: string;
  status?: string;
  tagId?: string;
  collectionId?: string;
  domain?: string;
  isFavorite?: boolean;
  limit?: number;
}

export interface SearchResultItem extends ItemWithDetails {
  matchScore: number;
  matchSnippet?: string;
}

export async function searchItems(userId: string, filters: SearchFilters): Promise<SearchResultItem[]> {
  const db = await getDb();

  // 1. Fetch base items for this user
  const conditions = [eq(savedItems.userId, userId)];

  if (filters.status) {
    conditions.push(eq(savedItems.status, filters.status));
  }
  if (filters.isFavorite !== undefined) {
    conditions.push(eq(savedItems.isFavorite, filters.isFavorite));
  }
  if (filters.type) {
    conditions.push(eq(savedItems.type, filters.type));
  }
  if (filters.domain) {
    conditions.push(eq(savedItems.domain, filters.domain));
  }

  const items = await db
    .select()
    .from(savedItems)
    .where(and(...conditions))
    .orderBy(desc(savedItems.savedAt));

  if (!items.length) return [];

  const itemIds = items.map((i: any) => i.id);

  // 2. Fetch tags for all items
  const allTags = await db
    .select({
      itemId: itemTags.itemId,
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(itemTags)
    .innerJoin(tags, eq(itemTags.tagId, tags.id))
    .where(inArray(itemTags.itemId, itemIds));

  // 3. Fetch collections for all items
  const allCollections = await db
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

  // 4. Fetch notes for all items
  const allNotes = await db
    .select({
      itemId: notes.itemId,
      id: notes.id,
      content: notes.content,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(inArray(notes.itemId, itemIds));

  // Assemble enriched items
  let enriched: SearchResultItem[] = items.map((item: any) => {
    const itemTagsList = allTags
      .filter((t: any) => t.itemId === item.id)
      .map((t: any) => ({ id: t.id, name: t.name, color: t.color }));

    const itemCollectionsList = allCollections
      .filter((c: any) => c.itemId === item.id)
      .map((c: any) => ({ id: c.id, name: c.name, color: c.color, icon: c.icon }));

    const itemNotesList = allNotes
      .filter((n: any) => n.itemId === item.id)
      .map((n: any) => ({ id: n.id, content: n.content, updatedAt: n.updatedAt }));

    return {
      ...item,
      tags: itemTagsList,
      collections: itemCollectionsList,
      notes: itemNotesList,
      matchScore: 0,
    };
  });

  // Filter by tagId if provided
  if (filters.tagId) {
    enriched = enriched.filter((i) => i.tags.some((t) => t.id === filters.tagId));
  }

  // Filter by collectionId if provided
  if (filters.collectionId) {
    enriched = enriched.filter((i) => i.collections.some((c) => c.id === filters.collectionId));
  }

  const rawQuery = filters.query?.trim().toLowerCase();
  if (!rawQuery) {
    // If no text query, return results with recency default
    return enriched.slice(0, filters.limit || 50);
  }

  const tokens = rawQuery.split(/\s+/).filter(Boolean);

  // Scoring heuristic:
  // Title match: +15 points per token
  // Tag match: +10 points per token
  // Collection match: +8 points per token
  // Domain match: +6 points per token
  // Note match: +5 points per token
  // Description match: +3 points per token
  const scoredResults: SearchResultItem[] = [];

  for (const item of enriched) {
    let score = 0;
    let snippet: string | undefined;

    const titleLower = item.title.toLowerCase();
    const descLower = (item.description || "").toLowerCase();
    const domainLower = item.domain.toLowerCase();
    const tagsLower = item.tags.map((t) => t.name.toLowerCase()).join(" ");
    const collectionsLower = item.collections.map((c) => c.name.toLowerCase()).join(" ");
    const notesLower = (item.notes || []).map((n) => n.content.toLowerCase()).join(" ");

    for (const token of tokens) {
      if (titleLower.includes(token)) {
        score += 15;
      }
      if (tagsLower.includes(token)) {
        score += 10;
      }
      if (collectionsLower.includes(token)) {
        score += 8;
      }
      if (domainLower.includes(token)) {
        score += 6;
      }
      if (notesLower.includes(token)) {
        score += 5;
        // extract small snippet from note
        const idx = notesLower.indexOf(token);
        const start = Math.max(0, idx - 20);
        const end = Math.min(notesLower.length, idx + 40);
        snippet = `Note: "...${notesLower.slice(start, end)}..."`;
      }
      if (descLower.includes(token)) {
        score += 3;
      }
    }

    if (score > 0) {
      scoredResults.push({
        ...item,
        matchScore: score,
        matchSnippet: snippet,
      });
    }
  }

  // Sort descending by matchScore, then by savedAt
  scoredResults.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
  });

  return scoredResults.slice(0, filters.limit || 50);
}
