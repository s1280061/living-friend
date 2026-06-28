import { grokJson } from "@/lib/grok/client";
import { friendService } from "@/features/friend/service";
import { todayInZone } from "@/utils/time";
import type { DailySchedule, Friend, ScheduleSlot } from "@/types";
import { scheduleRepository } from "./repository";

interface GeneratedSchedule {
  summary: string;
  morning: { place: string; activity: string };
  noon: { place: string; activity: string };
  night: { place: string; activity: string };
}

function buildPrompt(friend: Friend, weekdayHint: string): string {
  return [
    `You are ${friend.name}, age ${friend.age ?? "?"}.`,
    `Personality: ${friend.personality}`,
    `Hobbies: ${friend.hobbies.join(", ")}`,
    `Likes: ${friend.likes.join(", ")}. Dislikes: ${friend.dislikes.join(", ")}.`,
    "",
    `Plan a realistic, ordinary day for yourself (${weekdayHint}). Small and human — `,
    "not an epic adventure. Three blocks: morning, noon, night. Each block has a place ",
    "and an activity that fits your personality and hobbies.",
    "",
    "Respond ONLY with JSON of this exact shape:",
    `{
  "summary": "one short sentence describing the day's vibe",
  "morning": { "place": "...", "activity": "..." },
  "noon": { "place": "...", "activity": "..." },
  "night": { "place": "...", "activity": "..." }
}`,
  ].join("\n");
}

export const scheduleService = {
  async getToday(friendId: string, timezone: string): Promise<DailySchedule | null> {
    return scheduleRepository.getByDate(friendId, todayInZone(timezone));
  },

  /**
   * Generate (or regenerate) today's schedule via Grok and persist it.
   * Called by the morning cron.
   */
  async generateForToday(friendId: string): Promise<DailySchedule> {
    const friend = await friendService.getById(friendId);
    if (!friend) throw new Error(`Friend ${friendId} not found`);
    const settings = await friendService.getSettings(friendId);
    const date = todayInZone(settings.timezone);

    const generated = await grokJson<GeneratedSchedule>({
      messages: [{ role: "user", content: buildPrompt(friend, `date ${date}`) }],
      temperature: 0.9,
    });

    const slots: ScheduleSlot[] = [
      { part: "morning", start_hour: settings.wake_hour, end_hour: 11, ...generated.morning },
      { part: "noon", start_hour: 11, end_hour: 17, ...generated.noon },
      { part: "night", start_hour: 17, end_hour: settings.sleep_hour, ...generated.night },
    ];

    return scheduleRepository.upsert({
      friendId,
      date,
      slots,
      summary: generated.summary,
    });
  },
};
