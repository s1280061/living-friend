"use client";

import { useState } from "react";

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  return (
    <div className="flex items-center gap-2 border-t border-black/5 bg-haru-bg/80 p-3 backdrop-blur">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="メッセージを入力…"
        className="flex-1 rounded-full border border-black/10 bg-white px-4 py-2.5 text-[15px] outline-none focus:border-haru-accent"
      />
      <button
        onClick={submit}
        disabled={disabled || value.trim().length === 0}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-haru-accent text-white shadow-sm transition active:scale-95 disabled:opacity-40"
        aria-label="送信"
      >
        ↑
      </button>
    </div>
  );
}
