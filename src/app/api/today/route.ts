import { friendService } from "@/features/friend/service";
import { scheduleService } from "@/features/schedule/service";
import { handler, json } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/today — today's schedule for the active friend.
export const GET = handler(async () => {
  const friend = await friendService.getActiveFriend();
  const settings = await friendService.getSettings(friend.id);
  const schedule = await scheduleService.getToday(friend.id, settings.timezone);
  return json({ date: schedule?.date ?? null, schedule });
});
