import { grokJson } from "@/lib/grok/client";
import { friendService } from "@/features/friend/service";
import { scheduleService } from "@/features/schedule/service";
import { emotionService } from "@/features/emotion/service";
import { newsService } from "@/features/news/service";
import { memoryService } from "@/features/memory/service";
import { todayInZone } from "@/utils/time";
import type { Diary, EmotionKind, Friend } from "@/types";
import { diaryRepository } from "./repository";

interface GeneratedDiary {
  content: string;
  mood: EmotionKind;
  highlights: string[];
}

export const diaryService = {
  getToday(friendId: string, timezone: string): Promise<Diary | null> {
    return diaryRepository.getByDate(friendId, todayInZone(timezone));
  },

  getRecent: diaryRepository.getRecent,

  /**
   * Write tonight's diary from everything that "happened" today:
   * the schedule, the news the friend reacted to, and their mood.
   * Called by the night cron. Also seeds a memory of the day.
   */
  async writeForToday(friendId: string): Promise<Diary> {
    const friend = await friendService.getById(friendId);
    if (!friend) throw new Error(`Friend ${friendId} not found`);
    const settings = await friendService.getSettings(friendId);
    const date = todayInZone(settings.timezone);

    const [schedule, news, emotion] = await Promise.all([
      scheduleService.getToday(friendId, settings.timezone),
      newsService.getToday(friendId, settings.timezone),
      emotionService.getCurrent(friendId),
    ]);

    const generated = await grokJson<GeneratedDiary>({
      messages: [{ role: "user", content: buildPrompt(friend, { schedule, news, emotion, date }) }],
      temperature: 0.9,
      maxTokens: 600,
    });

    const diary = await diaryRepository.upsert({
      friendId,
      date,
      content: generated.content,
      mood: emotionService.isValid(generated.mood) ? generated.mood : null,
      highlights: generated.highlights ?? [],
    });

    // The day becomes a long-term memory.
    await memoryService
      .remember({
        friendId,
        kind: "diary",
        title: `Diary — ${date}`,
        content: generated.content,
        importance: 2,
      })
      .catch(() => undefined);

    return diary;
  },
};

function buildPrompt(
  friend: Friend,
  ctx: {
    schedule: Awaited<ReturnType<typeof scheduleService.getToday>>;
    news: Awaited<ReturnType<typeof newsService.getToday>>;
    emotion: Awaited<ReturnType<typeof emotionService.getCurrent>>;
    date: string;
  }
): string {
  const lines: string[] = [
    `You are ${friend.name}. Tonight you write your private diary for ${ctx.date}.`,
    `Speech style: ${friend.speech_style}`,
    "",
  ];
  if (ctx.schedule) {
    lines.push("Today you went through:");
    for (const s of ctx.schedule.slots) {
      lines.push(`- ${s.part}: ${s.activity} at ${s.place}`);
    }
  }
  if (ctx.news.length) {
    lines.push("", "Things that moved you today:");
    for (const n of ctx.news) lines.push(`- ${n.experience}`);
  }
  if (ctx.emotion) {
    lines.push("", `You currently feel ${ctx.emotion.emotion}.`);
  }
  lines.push(
    "",
    "Write a short, honest diary entry in YOUR voice (first person, 3-6 sentences).",
    "It is a real human day, not a summary of events. Reflect a little.",
    "",
    "Respond ONLY with JSON:",
    `{
  "content": "the diary entry text",
  "mood": "happy|sad|excited|lonely|calm|anxious|tired",
  "highlights": ["1-3 short memory bullets"]
}`
  );
  return lines.join("\n");
}
