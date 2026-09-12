import { requireAuth } from "@/lib/auth/session";
import { getItems } from "@/lib/services/items.service";
import { RecommendationService } from "@/lib/services/recommendations.service";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await requireAuth();

  const [continueItems, recentItems, quickWins, recommendations] =
    await Promise.all([
      RecommendationService.getContinueConsuming(session.id, 4),
      getItems({
        userId: session.id,
        limit: 6,
        sortBy: "savedAt",
        sortOrder: "desc",
      }),
      RecommendationService.getQuickWins(session.id, 6),
      RecommendationService.getRecommendations(session.id, 6),
    ]);

  return (
    <DashboardClient
      initialContinueItems={continueItems}
      initialRecentItems={recentItems}
      initialQuickWins={quickWins}
      initialRecommendations={recommendations}
    />
  );
}
