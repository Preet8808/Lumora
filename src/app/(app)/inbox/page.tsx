import { requireAuth } from "@/lib/auth/session";
import { getItems } from "@/lib/services/items.service";
import { getUserTags } from "@/lib/services/tags.service";
import { InboxClient } from "./InboxClient";

export default async function InboxPage() {
  const session = await requireAuth();

  const [items, tags] = await Promise.all([
    getItems({ userId: session.id, status: "INBOX", sortBy: "savedAt", sortOrder: "desc" }),
    getUserTags(session.id),
  ]);

  return <InboxClient initialItems={items} availableTags={tags} />;
}
