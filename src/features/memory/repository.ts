import { getAdminClient } from "@/lib/supabase/admin";
import type { Memory, MemoryKind } from "@/types";

export const memoryRepository = {
  async add(input: {
    friendId: string;
    userId?: string | null;
    kind: MemoryKind;
    title: string;
    content: string;
    importance: number;
    happenedAt?: string;
  }): Promise<Memory> {
    const { data, error } = await getAdminClient()
      .from("memories")
      .insert({
        friend_id: input.friendId,
        user_id: input.userId ?? null,
        kind: input.kind,
        title: input.title,
        content: input.content,
        importance: input.importance,
        happened_at: input.happenedAt ?? new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  /** Recall by importance then recency — the cheap MVP retrieval. */
  async recall(friendId: string, limit = 6): Promise<Memory[]> {
    const { data, error } = await getAdminClient()
      .from("memories")
      .select("*")
      .eq("friend_id", friendId)
      .order("importance", { ascending: false })
      .order("happened_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  /** Naive keyword search for memories matching a user's message. */
  async search(friendId: string, query: string, limit = 4): Promise<Memory[]> {
    const { data, error } = await getAdminClient()
      .from("memories")
      .select("*")
      .eq("friend_id", friendId)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order("importance", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
};
