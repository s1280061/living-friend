import { friendService } from "@/features/friend/service";
import { scheduleService } from "@/features/schedule/service";
import { emotionService } from "@/features/emotion/service";
import { newsService } from "@/features/news/service";
import { cronHandler, json } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Morning cron (≈06:00 JST / 21:00 UTC) — the "wake up" tick.
 * On the free Vercel plan we get one daily run per job, so the morning job
 * does the whole start-of-day: generate today's schedule, reset the mood,
 * and ingest the day's news as lived experiences.
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

  // News ingestion shouldn't fail the whole tick if a provider hiccups.
  const news = await newsService.ingestForToday(friend.id).catch(() => []);

  return json({
    ok: true,
    scheduled: schedule.date,
    slots: schedule.slots.length,
    news: news.length,
  });
});

// Allow manual triggering via POST too.
export const POST = GET;
