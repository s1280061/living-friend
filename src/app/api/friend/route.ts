import { friendService } from "@/features/friend/service";
import { handler, json } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/friend — the active persona + its settings.
export const GET = handler(async () => {
  const friend = await friendService.getActiveFriend();
  const settings = await friendService.getSettings(friend.id);
  return json({ friend, settings });
});
