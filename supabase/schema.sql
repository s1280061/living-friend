-- ════════════════════════════════════════════════════════════════════
--  Living Friend — Database Schema (PostgreSQL / Supabase)
--  Run this in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────
--  ENUMS
-- ─────────────────────────────────────────────
do $$ begin
  create type emotion_kind as enum ('happy', 'sad', 'excited', 'lonely', 'calm', 'anxious', 'tired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type schedule_part as enum ('morning', 'noon', 'night');
exception when duplicate_object then null; end $$;

do $$ begin
  create type memory_kind as enum ('diary', 'conversation', 'event', 'milestone');
exception when duplicate_object then null; end $$;

do $$ begin
  create type chat_role as enum ('user', 'assistant');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────
--  users  (kept minimal; ready for future auth)
-- ─────────────────────────────────────────────
create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique,
  display_name text,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
--  friends  (the persona — the heart of the app)
-- ─────────────────────────────────────────────
create table if not exists friends (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  age           int,
  avatar_emoji  text default '😊',
  personality   text not null,        -- free-form character description
  hobbies       text[] default '{}',
  dream         text,
  likes         text[] default '{}',
  dislikes      text[] default '{}',
  speech_style  text not null,        -- how they talk (tone, first-person, casualness)
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────
--  friend_settings  (per-friend runtime config)
-- ─────────────────────────────────────────────
create table if not exists friend_settings (
  friend_id      uuid primary key references friends(id) on delete cascade,
  home_city      text default 'Tokyo',
  timezone       text not null default 'Asia/Tokyo',
  wake_hour      int not null default 7,
  sleep_hour     int not null default 23,
  news_categories text[] default '{technology,science}',
  news_query     text,                 -- optional free-text query for the news provider
  updated_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────────
--  daily_schedule  (one row per friend per day)
--  slots: [{ part, start_hour, end_hour, place, activity }]
-- ─────────────────────────────────────────────
create table if not exists daily_schedule (
  id          uuid primary key default gen_random_uuid(),
  friend_id   uuid not null references friends(id) on delete cascade,
  date        date not null,
  slots       jsonb not null default '[]'::jsonb,
  summary     text,
  created_at  timestamptz not null default now(),
  unique (friend_id, date)
);

-- ─────────────────────────────────────────────
--  daily_status  (cache of the *currently resolved* state)
--  Computed from daily_schedule; upserted whenever status is read.
-- ─────────────────────────────────────────────
create table if not exists daily_status (
  friend_id     uuid primary key references friends(id) on delete cascade,
  part          schedule_part,
  place         text,
  activity      text,
  resolved_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────
--  diaries  (one per friend per day)
-- ─────────────────────────────────────────────
create table if not exists diaries (
  id          uuid primary key default gen_random_uuid(),
  friend_id   uuid not null references friends(id) on delete cascade,
  date        date not null,
  content     text not null,
  mood        emotion_kind,
  highlights  jsonb default '[]'::jsonb,  -- short bullet memories of the day
  created_at  timestamptz not null default now(),
  unique (friend_id, date)
);

-- ─────────────────────────────────────────────
--  news_events  (news transformed into the friend's *experience*)
-- ─────────────────────────────────────────────
create table if not exists news_events (
  id            uuid primary key default gen_random_uuid(),
  friend_id     uuid not null references friends(id) on delete cascade,
  date          date not null,
  category      text,
  source_title  text,
  source_url    text,
  experience    text not null,        -- first-person lived reaction (never raw news)
  emotion       emotion_kind,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────
--  emotions  (an append-only log; current emotion = latest row)
-- ─────────────────────────────────────────────
create table if not exists emotions (
  id          uuid primary key default gen_random_uuid(),
  friend_id   uuid not null references friends(id) on delete cascade,
  emotion     emotion_kind not null,
  intensity   int not null default 3 check (intensity between 1 and 5),
  reason      text,
  source      text,                   -- 'news' | 'chat' | 'diary' | 'schedule'
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
--  memories  (long-term memory store)
-- ─────────────────────────────────────────────
create table if not exists memories (
  id          uuid primary key default gen_random_uuid(),
  friend_id   uuid not null references friends(id) on delete cascade,
  user_id     uuid references users(id) on delete set null,
  kind        memory_kind not null default 'event',
  title       text not null,
  content     text not null,
  importance  int not null default 3 check (importance between 1 and 5),
  happened_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
--  chat_history
-- ─────────────────────────────────────────────
create table if not exists chat_history (
  id          uuid primary key default gen_random_uuid(),
  friend_id   uuid not null references friends(id) on delete cascade,
  user_id     uuid references users(id) on delete set null,
  role        chat_role not null,
  content     text not null,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
--  Indexes for the hot read paths
-- ─────────────────────────────────────────────
create index if not exists idx_chat_history_friend_time on chat_history (friend_id, created_at desc);
create index if not exists idx_emotions_friend_time on emotions (friend_id, created_at desc);
create index if not exists idx_diaries_friend_date on diaries (friend_id, date desc);
create index if not exists idx_news_friend_date on news_events (friend_id, date desc);
create index if not exists idx_memories_friend_importance on memories (friend_id, importance desc, happened_at desc);

-- ─────────────────────────────────────────────
--  Privileges — the app accesses everything server-side with the
--  service_role key. Grant it explicitly (Supabase's auto-grant doesn't
--  always apply to tables created via the SQL editor). The public anon key
--  is intentionally NOT granted access.
-- ─────────────────────────────────────────────
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
