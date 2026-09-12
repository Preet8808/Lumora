import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getItems, getStats } from "@/lib/services/items.service";
import { RecommendationService } from "@/lib/services/recommendations.service";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [continueItems, quickWins, recommendations, recentItems, stats] = await Promise.all([
      RecommendationService.getContinueConsuming(session.id, 4),
      RecommendationService.getQuickWins(session.id, 4),
      RecommendationService.getRecommendations(session.id, 4),
      getItems({ userId: session.id, limit: 6, sortBy: "savedAt", sortOrder: "desc" }),
      getStats(session.id),
    ]);

    return NextResponse.json({
      continueItems,
      quickWins,
      recommendations,
      recentItems,
      stats,
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
