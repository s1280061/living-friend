import { friendService } from "@/features/friend/service";
import { newsService } from "@/features/news/service";
import { cronHandler, json } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * News cron (twice daily): pull headlines and transform each into the
 * friend's own lived experience, nudging their emotion.
 */
export const GET = cronHandler(async () => {
  const friend = await friendService.getActiveFriend();
  const events = await newsService.ingestForToday(friend.id);
  return json({ ok: true, ingested: events.length });
});

export const POST = GET;
