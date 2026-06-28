import { getAdminClient } from "@/lib/supabase/admin";
import type { EmotionKind, NewsEvent } from "@/types";

export const newsRepository = {
  async getByDate(friendId: string, date: string): Promise<NewsEvent[]> {
    const { data, error } = await getAdminClient()
      .from("news_events")
      .select("*")
      .eq("friend_id", friendId)
      .eq("date", date)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getRecent(friendId: string, limit = 5): Promise<NewsEvent[]> {
    const { data, error } = await getAdminClient()
      .from("news_events")
      .select("*")
      .eq("friend_id", friendId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async insertMany(
    rows: Array<{
      friendId: string;
      date: string;
      category: string | null;
      sourceTitle: string | null;
      sourceUrl: string | null;
      experience: string;
      emotion: EmotionKind | null;
    }>
  ): Promise<NewsEvent[]> {
    if (rows.length === 0) return [];
    const { data, error } = await getAdminClient()
      .from("news_events")
      .insert(
        rows.map((r) => ({
          friend_id: r.friendId,
          date: r.date,
          category: r.category,
          source_title: r.sourceTitle,
          source_url: r.sourceUrl,
          experience: r.experience,
          emotion: r.emotion,
        }))
      )
      .select("*");
    if (error) throw error;
    return data ?? [];
  },
};
