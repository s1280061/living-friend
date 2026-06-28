/**
 * Domain-facing types. These are what features and the UI speak in.
 * They re-export DB primitives and add a few composite "view" types.
 */
import type {
  Database,
  EmotionKind,
  SchedulePart,
  MemoryKind,
  ChatRole,
  ScheduleSlot,
} from "./database";

type T = Database["public"]["Tables"];

export type Friend = T["friends"]["Row"];
export type FriendSettings = T["friend_settings"]["Row"];
export type DailySchedule = T["daily_schedule"]["Row"];
export type DailyStatus = T["daily_status"]["Row"];
export type Diary = T["diaries"]["Row"];
export type NewsEvent = T["news_events"]["Row"];
export type Emotion = T["emotions"]["Row"];
export type Memory = T["memories"]["Row"];
export type ChatMessage = T["chat_history"]["Row"];

export type {
  EmotionKind,
  SchedulePart,
  MemoryKind,
  ChatRole,
  ScheduleSlot,
};

// Re-export with snake_case alias used by utils/time.ts
export type schedule_part = SchedulePart;

/**
 * The full "life context" assembled for the prompt builder and the home page.
 * This single object is the snapshot of the friend's current life.
 */
export interface LifeContext {
  friend: Friend;
  settings: FriendSettings;
  localTime: string; // "21:05"
  today: string; // "2026-06-28"
  schedule: DailySchedule | null;
  status: {
    part: SchedulePart;
    place: string;
    activity: string;
  } | null;
  emotion: Emotion | null;
  todaysDiary: Diary | null;
  recentDiaries: Diary[];
  recentNews: NewsEvent[];
  memories: Memory[];
  recentChat: ChatMessage[];
}
