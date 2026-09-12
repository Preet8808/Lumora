import { requireAuth } from "@/lib/auth/session";
import { getItems } from "@/lib/services/items.service";
import { getUserTags } from "@/lib/services/tags.service";
import { InboxClient } from "../inbox/InboxClient";
import { Archive } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ArchivePage() {
  const session = await requireAuth();

  const [items, tags] = await Promise.all([
    getItems({ userId: session.id, status: "ARCHIVED", sortBy: "savedAt", sortOrder: "desc" }),
    getUserTags(session.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-zinc-800/80">
        <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/50 text-zinc-400 flex items-center justify-center">
          <Archive className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Archive</h1>
          <p className="text-xs text-zinc-400">Items you&apos;ve completed or moved out of the inbox</p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="Archive is empty"
          description="Archived items are kept safe here without cluttering your inbox or continue sections."
        />
      ) : (
        <InboxClient initialItems={items} availableTags={tags} />
      )}
    </div>
  );
}
