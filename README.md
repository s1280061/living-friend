# Living Friend 🌱

A web app where you don't chat with a bot — you talk to **a friend who actually lives a life**.

Haru wakes up, goes to a café, reads, sees something in the world that moves them, feels
things, writes a diary at night, and remembers yesterday. When you ask *"今日何してた？"*,
they answer from their own day — never by explaining facts like an assistant.

> **The golden rule:** the friend speaks only from their own lived experience.
> News is never reported — it is transformed into *their* experience before they ever mention it.

---

## Architecture

**Feature-First modules over a clean, layered core.** Each feature owns its layers and
depends inward only (UI → service → repository → DB). Route handlers are thin adapters.

```
src/
  app/                      # Next.js App Router (presentation)
    page.tsx                #   home: the friend's current life
    chat/page.tsx           #   LINE-style chat screen
    api/
      friend|today|status|diary|chat|memory/route.ts
      cron/morning|news|night/route.ts
  features/                 # one folder per domain capability
    friend/                 #   persona  (repository + service)
    schedule/               #   daily plan generation
    status/                 #   "what are you doing right now" (derived)
    emotion/                #   mood log; current = latest
    diary/                  #   nightly diary writing
    news/                   #   provider + news→experience transformer
    memory/                 #   long-term memory + recall
    chat/                   #   promptBuilder + chat service + UI + useChat
    context/                #   lifeContextService — the orchestrator
  components/               # shared presentational components
  lib/                      # supabase clients, grok client, env, http helpers
  types/                    # Database type + domain types
  utils/                    # time (timezone-aware), Result
supabase/                   # schema.sql + seed.sql
```

### Layering (SOLID / clean)
- **Repositories** = data access only (Supabase queries). No business rules.
- **Services** = use-cases. They orchestrate repositories + Grok + other services.
- **`context/lifeContextService`** = the single application orchestrator that assembles
  the whole `LifeContext` snapshot. The home page and the prompt builder both consume it.
- **`chat/promptBuilder`** = the heart. Assembles persona → schedule → current state →
  emotion → news → diary → memories → recent chat → user input, in that exact order.
- **Dependency inversion**: the news source is behind a `NewsProvider` interface, so you
  can swap NewsAPI for anything without touching the service.

---

## Setup

### 1. Install
```bash
npm install
```

### 2. Supabase
Create a project, then in the SQL editor run, in order:
1. `supabase/schema.sql`
2. `supabase/seed.sql`   ← creates the default friend **Haru**

### 3. Environment
Copy `.env.example` → `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY` (Groq Cloud — https://console.groq.com/keys), optionally `GROQ_MODEL` (default `llama-3.3-70b-versatile`)
- `NEWS_API_KEY` (NewsAPI.org — optional; without it the friend just has fewer experiences)
- `CRON_SECRET` (any long random string)

### 4. Run
```bash
npm run dev          # http://localhost:3000
```

Seed some life before chatting (these are the cron jobs, triggered manually):
```bash
# Authorization header must match CRON_SECRET
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/morning
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/news
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/night
```

---

## Cron (Vercel)

`vercel.json` schedules (all times **UTC**; the friend lives in JST = UTC+9):

| Job       | UTC          | JST            | What it does                          |
|-----------|--------------|----------------|---------------------------------------|
| `morning` | `0 21 * * *` | ~06:00         | generate today's schedule, reset mood |
| `news`    | `0 0,9 * * *`| ~09:00 / 18:00 | ingest news → lived experiences       |
| `night`   | `0 13 * * *` | ~22:00         | write the diary, fold day into memory |

Vercel automatically sends `Authorization: Bearer $CRON_SECRET`. Set `CRON_SECRET` in the
Vercel project env. Deploy with the Vercel GitHub integration or `vercel --prod`.

---

## API

| Method | Path                | Purpose                                  |
|--------|---------------------|------------------------------------------|
| GET    | `/api/friend`       | active persona + settings                |
| GET    | `/api/today`        | today's schedule                         |
| GET    | `/api/status`       | current place/activity + emotion + time  |
| GET    | `/api/diary`        | today's diary + recent entries           |
| GET    | `/api/chat`         | recent chat history                      |
| POST   | `/api/chat`         | one conversational turn                  |
| POST   | `/api/memory`       | store a shared memory                    |
| GET/POST | `/api/cron/*`     | scheduler hooks (auth required)          |

---

## MVP implementation order (how this was built / how to extend)

1. **Foundation** — Next.js + TS + Tailwind config, env validation. ✅
2. **Database** — `schema.sql` + `seed.sql` (one friend, Haru). ✅
3. **Core libs** — typed Supabase admin client, Grok wrapper, time utils. ✅
4. **friend** feature — load persona + settings. ✅
5. **schedule** feature — Grok-generated daily plan (morning/noon/night). ✅
6. **status** feature — derive "now" from schedule + clock. ✅
7. **emotion** feature — mood log; current = latest. ✅
8. **news** feature — provider + transform headlines into experiences. ✅
9. **diary** feature — nightly entry from the day; seeds memory. ✅
10. **memory** feature — store + recall (importance/recency + keyword). ✅
11. **context** orchestrator — assemble the full `LifeContext`. ✅
12. **chat** — `promptBuilder` + service + `/api/chat`. ✅
13. **UI** — home (life snapshot) + LINE-style chat with `useChat`. ✅
14. **cron** — morning/news/night routes + `vercel.json`. ✅

### Next steps (post-MVP)
- **Multiple friends**: the schema is already friend-scoped — add a friend switcher and
  auth (`users` table is ready), route by `friend.slug`.
- **Auth & per-user memories**: wire Supabase Auth + RLS; `memories.user_id` is in place.
- **Vector recall**: swap `memory.search` for pgvector embeddings.
- **Streaming chat**: switch `grokChat` to SSE for token streaming.
- **Richer emotion dynamics**: decay over time, blend multiple sources.
```
