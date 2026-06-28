import type { schedule_part } from "@/types";

/**
 * Time helpers that respect the *friend's* timezone, not the server's.
 * Vercel runs in UTC, so all "what day/hour is it for Haru" logic lives here.
 */

/** Current parts (year/month/day/hour) in a given IANA timezone. */
export function nowInZone(timezone: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: string;
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "long",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === "24" ? "0" : parts.hour),
    minute: Number(parts.minute),
    weekday: parts.weekday,
  };
}

/** ISO date string (YYYY-MM-DD) for "today" in the friend's timezone. */
export function todayInZone(timezone: string): string {
  const { year, month, day } = nowInZone(timezone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Which part of the day a given hour falls into. */
export function partForHour(hour: number): schedule_part {
  if (hour < 11) return "morning";
  if (hour < 17) return "noon";
  return "night";
}

/** Friendly clock label, e.g. "21:05". */
export function clockLabel(timezone: string): string {
  const { hour, minute } = nowInZone(timezone);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
