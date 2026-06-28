import type { ChatUiMessage } from "../hooks/useChat";

export function MessageBubble({
  message,
  avatar,
}: {
  message: ChatUiMessage;
  avatar: string;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-haru-bubble px-3.5 py-2 text-[15px] leading-relaxed shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm">
        {avatar}
      </div>
      <div
        className={`max-w-[78%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 text-[15px] leading-relaxed shadow-sm ${
          message.pending ? "animate-pulse text-gray-400" : ""
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
