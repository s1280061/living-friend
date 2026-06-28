"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, Emotion } from "@/types";

export interface ChatUiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

interface ChatState {
  messages: ChatUiMessage[];
  sending: boolean;
  loadingHistory: boolean;
  emotion: Emotion | null;
  error: string | null;
}

/**
 * Client-side chat state. Owns the optimistic message list, the send lifecycle,
 * and the friend's latest emotion (so the header can react to the conversation).
 */
export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    sending: false,
    loadingHistory: true,
    emotion: null,
    error: null,
  });
  const idRef = useRef(0);
  const nextId = () => `local-${idRef.current++}`;

  // Load history on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/chat");
        const data = (await res.json()) as { messages?: ChatMessage[] };
        if (cancelled) return;
        setState((s) => ({
          ...s,
          loadingHistory: false,
          messages: (data.messages ?? []).map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          })),
        }));
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loadingHistory: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const send = useCallback(async (text: string) => {
    const message = text.trim();
    if (!message) return;

    const userMsg: ChatUiMessage = { id: nextId(), role: "user", content: message };
    const typingMsg: ChatUiMessage = {
      id: nextId(),
      role: "assistant",
      content: "…",
      pending: true,
    };

    setState((s) => ({
      ...s,
      sending: true,
      error: null,
      messages: [...s.messages, userMsg, typingMsg],
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await res.json()) as {
        reply?: string;
        emotion?: Emotion | null;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "送信に失敗しちゃった");

      setState((s) => ({
        ...s,
        sending: false,
        emotion: data.emotion ?? s.emotion,
        messages: s.messages.map((m) =>
          m.id === typingMsg.id
            ? { ...m, content: data.reply ?? "...", pending: false }
            : m
        ),
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "エラーが起きたよ";
      setState((s) => ({
        ...s,
        sending: false,
        error: msg,
        messages: s.messages.filter((m) => m.id !== typingMsg.id),
      }));
    }
  }, []);

  return { ...state, send };
}
