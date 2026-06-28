/**
 * Hand-written Supabase schema types. Mirrors supabase/schema.sql.
 * (You can regenerate with `supabase gen types typescript` later.)
 *
 * NOTE: Row shapes are `type` aliases, not `interface`s, on purpose — Supabase's
 * generic constraints require them to satisfy `Record<string, unknown>`, which
 * interfaces do not (no implicit index signature). Using `interface` here makes
 * `.insert()` infer `never`.
 */

export type EmotionKind =
  | "happy"
  | "sad"
  | "excited"
  | "lonely"
  | "calm"
  | "anxious"
  | "tired";

export type SchedulePart = "morning" | "noon" | "night";
export type MemoryKind = "diary" | "conversation" | "event" | "milestone";
export type ChatRole = "user" | "assistant";

/** A single block of the day stored inside daily_schedule.slots */
export type ScheduleSlot = {
  part: SchedulePart;
  start_hour: number;
  end_hour: number;
  place: string;
  activity: string;
};

type FriendRow = {
  id: string;
  slug: string;
  name: string;
  age: number | null;
  avatar_emoji: string | null;
  personality: string;
  hobbies: string[];
  dream: string | null;
  likes: string[];
  dislikes: string[];
  speech_style: string;
  created_at: string;
};

type FriendSettingsRow = {
  friend_id: string;
  home_city: string;
  timezone: string;
  wake_hour: number;
  sleep_hour: number;
  news_categories: string[];
  news_query: string | null;
  updated_at: string;
};

type DailyScheduleRow = {
  id: string;
  friend_id: string;
  date: string;
  slots: ScheduleSlot[];
  summary: string | null;
  created_at: string;
};

type DailyStatusRow = {
  friend_id: string;
  part: SchedulePart | null;
  place: string | null;
  activity: string | null;
  resolved_at: string;
};

type DiaryRow = {
  id: string;
  friend_id: string;
  date: string;
  content: string;
  mood: EmotionKind | null;
  highlights: string[];
  created_at: string;
};

type NewsEventRow = {
  id: string;
  friend_id: string;
  date: string;
  category: string | null;
  source_title: string | null;
  source_url: string | null;
  experience: string;
  emotion: EmotionKind | null;
  created_at: string;
};

type EmotionRow = {
  id: string;
  friend_id: string;
  emotion: EmotionKind;
  intensity: number;
  reason: string | null;
  source: string | null;
  created_at: string;
};

type MemoryRow = {
  id: string;
  friend_id: string;
  user_id: string | null;
  kind: MemoryKind;
  title: string;
  content: string;
  importance: number;
  happened_at: string;
  created_at: string;
};

type ChatHistoryRow = {
  id: string;
  friend_id: string;
  user_id: string | null;
  role: ChatRole;
  content: string;
  created_at: string;
};

type UserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
};

/** Generic helper: Insert = Row minus auto columns, all optional-ish. */
type Insertable<T, AutoKeys extends keyof T> = Omit<T, AutoKeys> & Partial<Pick<T, AutoKeys>>;

type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      users: TableDef<UserRow, Insertable<UserRow, "id" | "created_at">, Partial<UserRow>>;
      friends: TableDef<FriendRow, Insertable<FriendRow, "id" | "created_at">, Partial<FriendRow>>;
      friend_settings: TableDef<
        FriendSettingsRow,
        Insertable<FriendSettingsRow, "updated_at">,
        Partial<FriendSettingsRow>
      >;
      daily_schedule: TableDef<
        DailyScheduleRow,
        Insertable<DailyScheduleRow, "id" | "created_at">,
        Partial<DailyScheduleRow>
      >;
      daily_status: TableDef<DailyStatusRow, DailyStatusRow, Partial<DailyStatusRow>>;
      diaries: TableDef<DiaryRow, Insertable<DiaryRow, "id" | "created_at">, Partial<DiaryRow>>;
      news_events: TableDef<
        NewsEventRow,
        Insertable<NewsEventRow, "id" | "created_at">,
        Partial<NewsEventRow>
      >;
      emotions: TableDef<EmotionRow, Insertable<EmotionRow, "id" | "created_at">, Partial<EmotionRow>>;
      memories: TableDef<MemoryRow, Insertable<MemoryRow, "id" | "created_at">, Partial<MemoryRow>>;
      chat_history: TableDef<
        ChatHistoryRow,
        Insertable<ChatHistoryRow, "id" | "created_at">,
        Partial<ChatHistoryRow>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      emotion_kind: EmotionKind;
      schedule_part: SchedulePart;
      memory_kind: MemoryKind;
      chat_role: ChatRole;
    };
  };
};
