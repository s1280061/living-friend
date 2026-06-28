import type { Memory, MemoryKind } from "@/types";
import { memoryRepository } from "./repository";

export const memoryService = {
  remember(input: {
    friendId: string;
    userId?: string | null;
    kind: MemoryKind;
    title: string;
    content: string;
    importance?: number;
    happenedAt?: string;
  }): Promise<Memory> {
    return memoryRepository.add({
      ...input,
      importance: Math.min(5, Math.max(1, input.importance ?? 3)),
    });
  },

  recall: memoryRepository.recall,

  /**
   * Build the memory set for a chat turn: a few salient long-term memories
   * plus any that the user's message seems to reference.
   */
  async recallForChat(friendId: string, userMessage: string): Promise<Memory[]> {
    const [salient, related] = await Promise.all([
      memoryRepository.recall(friendId, 5),
      userMessage.trim().length >= 3
        ? memoryRepository.search(friendId, userMessage.trim().slice(0, 40), 3)
        : Promise.resolve<Memory[]>([]),
    ]);
    // De-dupe by id, related first (more relevant to the turn).
    const seen = new Set<string>();
    return [...related, ...salient].filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  },
};
