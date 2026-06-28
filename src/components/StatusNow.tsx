import type { LifeContext } from "@/types";

export function StatusNow({
  status,
  localTime,
}: {
  status: LifeContext["status"];
  localTime: string;
}) {
  return (
    <div className="rounded-2xl bg-haru-card p-4 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-haru-accent">今</span>
        <span className="text-xs text-gray-400">{localTime}</span>
      </div>
      {status ? (
        <p className="text-[15px] leading-relaxed">
          {status.place}で{status.activity}してるよ。
        </p>
      ) : (
        <p className="text-[15px] text-gray-500">今日はまだ予定を立ててないみたい…</p>
      )}
    </div>
  );
}
