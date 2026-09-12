import { requireAuth } from "@/lib/auth/session";
import { getUserTags } from "@/lib/services/tags.service";
import { TagsClient } from "./TagsClient";

export default async function TagsPage() {
  const session = await requireAuth();
  const tags = await getUserTags(session.id);

  return <TagsClient initialTags={tags} />;
}
