"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Friend } from "@/types";
import { EmotionBadge } from "@/components/EmotionBadge";
import { useChat } from "../hooks/useChat";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";

export function ChatWindow({ friend }: { friend: Friend }) {
  const { messages, send, sending, loadingHistory, emotion, error } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const avatar = friend.avatar_emoji ?? "😊";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-black/5 bg-haru-card px-4 py-3 shadow-sm">
        <Link href="/" className="text-xl text-gray-400">
          ‹
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-haru-bg text-xl">
          {avatar}
        </div>
        <div className="flex-1">
          <p className="font-semibold leading-tight">{friend.name}</p>
          <p className="text-xs text-gray-400">オンライン</p>
        </div>
        <EmotionBadge emotion={emotion?.emotion} />
      </header>

      {/* Messages */}
      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
        {loadingHistory ? (
          <p className="pt-10 text-center text-sm text-gray-400">読み込み中…</p>
        ) : messages.length === 0 ? (
          <p className="pt-10 text-center text-sm text-gray-400">
            「今日何してた？」って聞いてみて 👋
          </p>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} avatar={avatar} />)
        )}
        {error && <p className="text-center text-xs text-red-500">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={send} disabled={sending} />
    </div>
  );
}
