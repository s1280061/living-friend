import { friendService } from "@/features/friend/service";
import { scheduleService } from "@/features/schedule/service";
import { statusService } from "@/features/status/service";
import { emotionService } from "@/features/emotion/service";
import { diaryService } from "@/features/diary/service";
import { newsService } from "@/features/news/service";
import { memoryService } from "@/features/memory/service";
import { chatRepository } from "@/features/chat/repository";
import { clockLabel, todayInZone } from "@/utils/time";
import type { LifeContext } from "@/types";

/**
 * Application-layer orchestrator. Composes every feature into the single
 * snapshot of the friend's life that both the home page and the prompt
 * builder consume. This is the one place that knows about all features.
 */
export const lifeContextService = {
  async assemble(opts?: { userMessage?: string }): Promise<LifeContext> {
    const friend = await friendService.getActiveFriend();
    const settings = await friendService.getSettings(friend.id);
    const tz = settings.timezone;

    const [status, emotion, schedule, todaysDiary, recentDiaries, recentNews, memories, recentChat] =
      await Promise.all([
        statusService.getCurrent(friend.id),
        emotionService.getCurrent(friend.id),
        scheduleService.getToday(friend.id, tz),
        diaryService.getToday(friend.id, tz),
        diaryService.getRecent(friend.id, 4),
        newsService.getRecent(friend.id, 4),
        opts?.userMessage
          ? memoryService.recallForChat(friend.id, opts.userMessage)
          : memoryService.recall(friend.id, 5),
        chatRepository.getRecent(friend.id, 10),
      ]);

    return {
      friend,
      settings,
      localTime: clockLabel(tz),
      today: todayInZone(tz),
      schedule,
      status: status
        ? { part: status.part, place: status.place, activity: status.activity }
        : null,
      emotion,
      todaysDiary,
      recentDiaries: recentDiaries.filter((d) => d.date !== todayInZone(tz)),
      recentNews,
      memories,
      recentChat,
    };
  },
};
