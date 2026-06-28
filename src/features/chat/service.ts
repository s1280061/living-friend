import { grokChat } from "@/lib/grok/client";
import { lifeContextService } from "@/features/context/lifeContextService";
import { emotionService } from "@/features/emotion/service";
import { memoryService } from "@/features/memory/service";
import type { ChatMessage, LifeContext } from "@/types";
import { chatRepository } from "./repository";
import { buildChatMessages } from "./promptBuilder";

export interface ChatTurnResult {
  reply: string;
  context: LifeContext;
}

export const chatService = {
  history(friendId: string, limit?: number): Promise<ChatMessage[]> {
    return chatRepository.getRecent(friendId, limit);
  },

  /**
   * One conversational turn:
   *  assemble life context → build prompt → ask Grok → persist both messages.
   */
  async send(userMessage: string, userId?: string | null): Promise<ChatTurnResult> {
    const message = userMessage.trim();
    if (!message) throw new Error("Empty message");

    const context = await lifeContextService.assemble({ userMessage: message });
    const messages = buildChatMessages(context, message);

    const { content } = await grokChat({ messages, temperature: 0.9, maxTokens: 500 });
    const reply = content || "...ごめん、ちょっとぼーっとしてた。もう一回言って？";

    const friendId = context.friend.id;
    await Promise.all([
      chatRepository.add({ friendId, userId, role: "user", content: message }),
      chatRepository.add({ friendId, userId, role: "assistant", content: reply }),
    ]);

    // Light-touch life effects: remember notable exchanges (fire-and-forget).
    if (message.length > 24) {
      void memoryService
        .remember({
          friendId,
          userId,
          kind: "conversation",
          title: `Talked about: ${message.slice(0, 40)}`,
          content: `User said: "${message}" — I replied: "${reply.slice(0, 120)}"`,
          importance: 2,
        })
        .catch(() => undefined);
    }

    return { reply, context };
  },

  /** Allow callers (and the prompt-effects layer) to nudge mood from chat. */
  shiftEmotion: emotionService.shift,
};
