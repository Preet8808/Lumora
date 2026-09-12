import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { bulkUpdateStatus, bulkDelete, bulkAddTag } from "@/lib/services/items.service";
import { z } from "zod";

const bulkSchema = z.object({
  action: z.enum(["archive", "status", "delete", "addTag"]),
  itemIds: z.array(z.string()).min(1, "At least one item required"),
  status: z.enum(["INBOX", "WANT_TO_READ", "IN_PROGRESS", "FINISHED", "ARCHIVED"]).optional(),
  tagId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { action, itemIds, status, tagId } = parsed.data;

    let affectedCount = 0;

    if (action === "archive") {
      affectedCount = await bulkUpdateStatus(itemIds, session.id, "ARCHIVED");
    } else if (action === "status" && status) {
      affectedCount = await bulkUpdateStatus(itemIds, session.id, status);
    } else if (action === "delete") {
      affectedCount = await bulkDelete(itemIds, session.id);
    } else if (action === "addTag" && tagId) {
      affectedCount = await bulkAddTag(itemIds, session.id, tagId);
    }

    return NextResponse.json({ success: true, affectedCount });
  } catch (error: any) {
    console.error("Bulk action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
