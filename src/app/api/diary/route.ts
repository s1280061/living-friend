import { friendService } from "@/features/friend/service";
import { diaryService } from "@/features/diary/service";
import { handler, json } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/diary — today's diary plus a few recent entries.
export const GET = handler(async () => {
  const friend = await friendService.getActiveFriend();
  const settings = await friendService.getSettings(friend.id);
  const [today, recent] = await Promise.all([
    diaryService.getToday(friend.id, settings.timezone),
    diaryService.getRecent(friend.id, 7),
  ]);
  return json({ today, recent });
});
