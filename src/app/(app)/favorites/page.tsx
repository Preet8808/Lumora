import { requireAuth } from "@/lib/auth/session";
import { getItems } from "@/lib/services/items.service";
import { getUserTags } from "@/lib/services/tags.service";
import { InboxClient } from "../inbox/InboxClient";
import { Star } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function FavoritesPage() {
  const session = await requireAuth();

  const [items, tags] = await Promise.all([
    getItems({ userId: session.id, isFavorite: true, sortBy: "savedAt", sortOrder: "desc" }),
    getUserTags(session.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-zinc-800/80">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
          <Star className="w-4 h-4 fill-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Favorites</h1>
          <p className="text-xs text-zinc-400">Your starred, high-priority saves</p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No favorites yet"
          description="Click the star icon on any card to pin your favorite items here for fast access."
        />
      ) : (
        <InboxClient initialItems={items} availableTags={tags} />
      )}
    </div>
  );
}
