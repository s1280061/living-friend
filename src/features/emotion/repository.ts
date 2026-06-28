import { getAdminClient } from "@/lib/supabase/admin";
import type { Emotion, EmotionKind } from "@/types";

export const emotionRepository = {
  /** Current emotion = most recent row. */
  async getLatest(friendId: string): Promise<Emotion | null> {
    const { data, error } = await getAdminClient()
      .from("emotions")
      .select("*")
      .eq("friend_id", friendId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async add(input: {
    friendId: string;
    emotion: EmotionKind;
    intensity: number;
    reason?: string;
    source?: string;
  }): Promise<Emotion> {
    const { data, error } = await getAdminClient()
      .from("emotions")
      .insert({
        friend_id: input.friendId,
        emotion: input.emotion,
        intensity: input.intensity,
        reason: input.reason ?? null,
        source: input.source ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },
};
