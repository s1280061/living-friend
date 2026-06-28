import { friendService } from "@/features/friend/service";
import { statusService } from "@/features/status/service";
import { emotionService } from "@/features/emotion/service";
import { clockLabel } from "@/utils/time";
import { handler, json } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/status — where the friend is & what they're doing right now.
export const GET = handler(async () => {
  const friend = await friendService.getActiveFriend();
  const settings = await friendService.getSettings(friend.id);
  const [status, emotion] = await Promise.all([
    statusService.getCurrent(friend.id),
    emotionService.getCurrent(friend.id),
  ]);
  return json({
    localTime: clockLabel(settings.timezone),
    status,
    emotion,
  });
});
