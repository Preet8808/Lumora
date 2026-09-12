import { requireAuth } from "@/lib/auth/session";
import { getUserCollections } from "@/lib/services/collections.service";
import { CollectionsClient } from "./CollectionsClient";

export default async function CollectionsPage() {
  const session = await requireAuth();
  const collections = await getUserCollections(session.id);

  return <CollectionsClient initialCollections={collections} />;
}
