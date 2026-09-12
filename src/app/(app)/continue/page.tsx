import { requireAuth } from "@/lib/auth/session";
import { getItems } from "@/lib/services/items.service";
import { InboxClient } from "../inbox/InboxClient";
import { getUserTags } from "@/lib/services/tags.service";
import { Play } from "lucide-react";

export default async function ContinuePage() {
  const session = await requireAuth();

  const [allItems, tags] = await Promise.all([
    getItems({ userId: session.id, sortBy: "savedAt", sortOrder: "desc" }),
    getUserTags(session.id),
  ]);

  const continueItems = allItems.filter(
    (i) =>
      (i.status === "IN_PROGRESS" || (i.progress > 0 && i.progress < 100)) &&
      i.status !== "ARCHIVED" &&
      i.status !== "FINISHED"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-zinc-800/80">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <Play className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Continue Consuming</h1>
          <p className="text-xs text-zinc-400">Pick up right where you left off</p>
        </div>
      </div>

      <InboxClient
        initialItems={continueItems}
        availableTags={tags}
        emptyTitle="No items in progress"
        emptyDescription="When you start reading or watching content, items with progress will appear here for instant resumption."
        emptyIcon="play"
      />
    </div>
  );
}
