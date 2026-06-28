import type { DailySchedule, SchedulePart } from "@/types";

const PART_LABEL: Record<SchedulePart, string> = {
  morning: "朝",
  noon: "昼",
  night: "夜",
};

const PART_ICON: Record<SchedulePart, string> = {
  morning: "🌅",
  noon: "☀️",
  night: "🌙",
};

export function ScheduleList({ schedule }: { schedule: DailySchedule | null }) {
  return (
    <div className="rounded-2xl bg-haru-card p-4 shadow-sm">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-haru-accent">
        今日の予定
      </h2>
      {schedule && schedule.slots.length > 0 ? (
        <ul className="space-y-3">
          {schedule.slots.map((slot) => (
            <li key={slot.part} className="flex items-start gap-3">
              <span className="text-lg">{PART_ICON[slot.part]}</span>
              <div>
                <p className="text-xs font-medium text-gray-400">{PART_LABEL[slot.part]}</p>
                <p className="text-[15px] leading-snug">
                  {slot.activity}
                  <span className="text-gray-400"> @ {slot.place}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[15px] text-gray-500">まだ今日の予定がないよ。</p>
      )}
    </div>
  );
}
