import type { EmotionKind } from "@/types";

const FACE: Record<EmotionKind, string> = {
  happy: "😊",
  sad: "😢",
  excited: "🤩",
  lonely: "🥺",
  calm: "😌",
  anxious: "😟",
  tired: "😴",
};

const LABEL_COLOR: Record<EmotionKind, string> = {
  happy: "bg-yellow-100 text-yellow-800",
  sad: "bg-blue-100 text-blue-800",
  excited: "bg-pink-100 text-pink-800",
  lonely: "bg-indigo-100 text-indigo-800",
  calm: "bg-emerald-100 text-emerald-800",
  anxious: "bg-orange-100 text-orange-800",
  tired: "bg-slate-200 text-slate-700",
};

export function EmotionBadge({ emotion }: { emotion: EmotionKind | null | undefined }) {
  const e = emotion ?? "calm";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${LABEL_COLOR[e]}`}
    >
      <span>{FACE[e]}</span>
      <span className="capitalize">{e}</span>
    </span>
  );
}
