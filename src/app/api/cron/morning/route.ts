import { friendService } from "@/features/friend/service";
import { scheduleService } from "@/features/schedule/service";
import { emotionService } from "@/features/emotion/service";
import { cronHandler, json } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Morning cron (≈06:00 JST / 21:00 UTC):
 * generate today's schedule and reset the friend into a fresh-day mood.
 */
export const GET = cronHandler(async () => {
  const friend = await friendService.getActiveFriend();
  const schedule = await scheduleService.generateForToday(friend.id);
  await emotionService
    .shift({
      friendId: friend.id,
      emotion: "calm",
      intensity: 3,
      reason: "A new day is starting.",
      source: "schedule",
    })
    .catch(() => undefined);
  return json({ ok: true, scheduled: schedule.date, slots: schedule.slots.length });
});

// Allow manual triggering via POST too.
export const POST = GET;
