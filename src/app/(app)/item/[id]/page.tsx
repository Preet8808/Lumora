import { requireAuth } from "@/lib/auth/session";
import { getItemById } from "@/lib/services/items.service";
import { getUserTags } from "@/lib/services/tags.service";
import { getUserCollections } from "@/lib/services/collections.service";
import { ItemDetailClient } from "./ItemDetailClient";
import { notFound } from "next/navigation";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;

  const [item, tags, collections] = await Promise.all([
    getItemById(id, session.id),
    getUserTags(session.id),
    getUserCollections(session.id),
  ]);

  if (!item) {
    notFound();
  }

  return (
    <ItemDetailClient
      initialItem={item}
      availableTags={tags}
      availableCollections={collections}
    />
  );
}
