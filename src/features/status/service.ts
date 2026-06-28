import { friendService } from "@/features/friend/service";
import { scheduleService } from "@/features/schedule/service";
import { nowInZone, partForHour } from "@/utils/time";
import type { SchedulePart, ScheduleSlot } from "@/types";

export interface ResolvedStatus {
  part: SchedulePart;
  place: string;
  activity: string;
  asleep: boolean;
}

/**
 * The friend's *current* state is derived from today's schedule + the clock.
 * We don't store it as the source of truth (the schedule is); we just cache
 * it into daily_status for history.
 */
export const statusService = {
  async getCurrent(friendId: string): Promise<ResolvedStatus | null> {
    const settings = await friendService.getSettings(friendId);
    const { hour } = nowInZone(settings.timezone);

    // Sleeping window.
    const asleep = hour >= settings.sleep_hour || hour < settings.wake_hour;

    const schedule = await scheduleService.getToday(friendId, settings.timezone);
    if (!schedule || schedule.slots.length === 0) {
      return asleep
        ? { part: "night", place: "home", activity: "sleeping", asleep: true }
        : null;
    }

    const part = partForHour(hour);
    const slot =
      schedule.slots.find((s: ScheduleSlot) => hour >= s.start_hour && hour < s.end_hour) ??
      schedule.slots.find((s: ScheduleSlot) => s.part === part) ??
      schedule.slots[schedule.slots.length - 1];

    if (asleep) {
      return { part: "night", place: "home", activity: "sleeping", asleep: true };
    }

    // Best-effort cache; never let a cache failure break a read.
    const { statusRepository } = await import("./repository");
    await statusRepository
      .upsert({ friendId, part: slot.part, place: slot.place, activity: slot.activity })
      .catch(() => undefined);

    return { part: slot.part, place: slot.place, activity: slot.activity, asleep: false };
  },
};
