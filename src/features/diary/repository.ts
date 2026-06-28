import { getAdminClient } from "@/lib/supabase/admin";
import type { Diary, EmotionKind } from "@/types";

export const diaryRepository = {
  async getByDate(friendId: string, date: string): Promise<Diary | null> {
    const { data, error } = await getAdminClient()
      .from("diaries")
      .select("*")
      .eq("friend_id", friendId)
      .eq("date", date)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getRecent(friendId: string, limit = 5): Promise<Diary[]> {
    const { data, error } = await getAdminClient()
      .from("diaries")
      .select("*")
      .eq("friend_id", friendId)
      .order("date", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async upsert(input: {
    friendId: string;
    date: string;
    content: string;
    mood: EmotionKind | null;
    highlights: string[];
  }): Promise<Diary> {
    const { data, error } = await getAdminClient()
      .from("diaries")
      .upsert(
        {
          friend_id: input.friendId,
          date: input.date,
          content: input.content,
          mood: input.mood,
          highlights: input.highlights,
        },
        { onConflict: "friend_id,date" }
      )
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },
};
