import { getItems, ItemWithDetails } from "./items.service";

export interface RecommendationScore {
  item: ItemWithDetails;
  score: number;
  reason: string;
}

export class RecommendationService {
  /**
   * Computes recommended items for a user using deterministic heuristics.
   * Can be replaced or enhanced with vector embeddings/ML model in the future.
   */
  static async getRecommendations(userId: string, limit: number = 6): Promise<ItemWithDetails[]> {
    // 1. Fetch active items (excluding archived and already finished items)
    const allItems = await getItems({ userId });
    const activeItems = allItems.filter(
      (item) => item.status !== "ARCHIVED" && item.status !== "FINISHED"
    );

    if (!activeItems.length) return [];

    // Count tag frequency across user's collection to determine user interests
    const tagFrequencies = new Map<string, number>();
    for (const item of allItems) {
      for (const tag of item.tags) {
        tagFrequencies.set(tag.id, (tagFrequencies.get(tag.id) || 0) + 1);
      }
    }

    const scoredList: RecommendationScore[] = [];

    const now = Date.now();

    for (const item of activeItems) {
      let score = 0;
      const reasons: string[] = [];

      // 1. Recency heuristic: saved in last 7 days gets higher attention
      const daysSinceSaved = (now - new Date(item.savedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceSaved <= 3) {
        score += 15;
        reasons.push("Recently saved");
      } else if (daysSinceSaved <= 7) {
        score += 8;
      }

      // 2. In-progress / unfinished items bonus
      if (item.status === "IN_PROGRESS" || (item.progress > 0 && item.progress < 100)) {
        score += 20;
        reasons.push(`${item.progress}% in progress`);
      }

      // 3. Quick wins heuristic (duration <= 15 minutes)
      if (item.duration && item.duration > 0 && item.duration <= 15) {
        score += 12;
        reasons.push(`Quick read (${item.duration}m)`);
      }

      // 4. Tag affinity: matches user's top interest tags
      let tagBonus = 0;
      for (const tag of item.tags) {
        const freq = tagFrequencies.get(tag.id) || 0;
        if (freq >= 2) {
          tagBonus += freq * 2;
        }
      }
      if (tagBonus > 0) {
        score += Math.min(tagBonus, 25);
        reasons.push("Matches your core interests");
      }

      // 5. Favorites get a priority boost
      if (item.isFavorite) {
        score += 10;
        reasons.push("Starred item");
      }

      scoredList.push({
        item,
        score,
        reason: reasons[0] || "Recommended for you",
      });
    }

    // Sort by computed score descending
    scoredList.sort((a, b) => b.score - a.score);

    return scoredList.slice(0, limit).map((s) => s.item);
  }

  /**
   * Retrieves quick wins: items with <= 15 min estimated time.
   */
  static async getQuickWins(userId: string, limit: number = 6): Promise<ItemWithDetails[]> {
    const items = await getItems({ userId });
    return items
      .filter(
        (i) =>
          i.status !== "ARCHIVED" &&
          i.status !== "FINISHED" &&
          i.duration &&
          i.duration > 0 &&
          i.duration <= 15
      )
      .slice(0, limit);
  }

  /**
   * Retrieves items the user has started consuming (status IN_PROGRESS or progress > 0).
   */
  static async getContinueConsuming(userId: string, limit: number = 6): Promise<ItemWithDetails[]> {
    const items = await getItems({ userId });
    return items
      .filter(
        (i) =>
          (i.status === "IN_PROGRESS" || (i.progress > 0 && i.progress < 100)) &&
          i.status !== "ARCHIVED" &&
          i.status !== "FINISHED"
      )
      .slice(0, limit);
  }
}
