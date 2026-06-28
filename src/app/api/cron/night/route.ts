import { friendService } from "@/features/friend/service";
import { diaryService } from "@/features/diary/service";
import { cronHandler, json } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Night cron (≈22:00 JST / 13:00 UTC):
 * write today's diary from the day's schedule, news and mood, and
 * fold the day into long-term memory.
 */
export const GET = cronHandler(async () => {
  const friend = await friendService.getActiveFriend();
  const diary = await diaryService.writeForToday(friend.id);
  return json({ ok: true, date: diary.date });
});

export const POST = GET;
