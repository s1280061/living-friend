import { getAdminClient } from "@/lib/supabase/admin";
import type { ChatMessage, ChatRole } from "@/types";

export const chatRepository = {
  /** Most recent messages, returned in chronological (oldest-first) order. */
  async getRecent(friendId: string, limit = 12): Promise<ChatMessage[]> {
    const { data, error } = await getAdminClient()
      .from("chat_history")
      .select("*")
      .eq("friend_id", friendId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).reverse();
  },

  async add(input: {
    friendId: string;
    userId?: string | null;
    role: ChatRole;
    content: string;
  }): Promise<ChatMessage> {
    const { data, error } = await getAdminClient()
      .from("chat_history")
      .insert({
        friend_id: input.friendId,
        user_id: input.userId ?? null,
        role: input.role,
        content: input.content,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },
};
