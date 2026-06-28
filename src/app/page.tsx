import Link from "next/link";
import { lifeContextService } from "@/features/context/lifeContextService";
import { FriendCard } from "@/components/FriendCard";
import { StatusNow } from "@/components/StatusNow";
import { ScheduleList } from "@/components/ScheduleList";

// Always render fresh — the friend's life moves with the clock.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  let ctx;
  try {
    ctx = await lifeContextService.assemble();
  } catch (e) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-4xl">😴</p>
        <p className="text-sm text-gray-500">
          まだ友達がいないみたい。
          <br />
          Supabase の <code>schema.sql</code> と <code>seed.sql</code> を実行してね。
        </p>
        <p className="text-xs text-gray-400">{e instanceof Error ? e.message : ""}</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <FriendCard friend={ctx.friend} emotion={ctx.emotion} />
      <StatusNow status={ctx.status} localTime={ctx.localTime} />
      <ScheduleList schedule={ctx.schedule} />

      {ctx.todaysDiary && (
        <div className="rounded-2xl bg-haru-card p-4 shadow-sm">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-haru-accent">
            今日の日記
          </h2>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-gray-700">
            {ctx.todaysDiary.content}
          </p>
        </div>
      )}

      <Link
        href="/chat"
        className="mt-2 rounded-full bg-haru-accent py-3 text-center font-semibold text-white shadow-sm transition active:scale-[0.98]"
      >
        {ctx.friend.name}と話す 💬
      </Link>
    </main>
  );
}
