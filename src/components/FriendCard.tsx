import type { Emotion, Friend } from "@/types";
import { EmotionBadge } from "./EmotionBadge";

export function FriendCard({
  friend,
  emotion,
}: {
  friend: Friend;
  emotion: Emotion | null;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-haru-card p-4 shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-haru-bg text-3xl">
        {friend.avatar_emoji ?? "😊"}
      </div>
      <div className="flex-1">
        <h1 className="text-lg font-bold">{friend.name}</h1>
        <p className="line-clamp-1 text-xs text-gray-500">{friend.hobbies.join(" · ")}</p>
      </div>
      <EmotionBadge emotion={emotion?.emotion} />
    </div>
  );
}
