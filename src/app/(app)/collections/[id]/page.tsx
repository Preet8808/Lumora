import { requireAuth } from "@/lib/auth/session";
import { getCollectionById } from "@/lib/services/collections.service";
import { getItems } from "@/lib/services/items.service";
import { getUserTags } from "@/lib/services/tags.service";
import { InboxClient } from "../../inbox/InboxClient";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Folder } from "lucide-react";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;

  const collection = await getCollectionById(id, session.id);
  if (!collection) {
    notFound();
  }

  const [items, tags] = await Promise.all([
    getItems({ userId: session.id, collectionId: id, sortBy: "savedAt", sortOrder: "desc" }),
    getUserTags(session.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-zinc-800/80">
        <Link
          href="/collections"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Collections</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: `${collection.color || "#6366f1"}20`, color: collection.color || "#6366f1" }}
          >
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">{collection.name}</h1>
            {collection.description && (
              <p className="text-xs text-zinc-400 mt-0.5">{collection.description}</p>
            )}
          </div>
        </div>
      </div>

      <InboxClient initialItems={items} availableTags={tags} />
    </div>
  );
}
