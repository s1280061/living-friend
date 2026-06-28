import { getAdminClient } from "@/lib/supabase/admin";
import type { DailyStatus, SchedulePart } from "@/types";

export const statusRepository = {
  /** Cache the currently-resolved status (history + quick reads). */
  async upsert(input: {
    friendId: string;
    part: SchedulePart;
    place: string;
    activity: string;
  }): Promise<DailyStatus> {
    const { data, error } = await getAdminClient()
      .from("daily_status")
      .upsert(
        {
          friend_id: input.friendId,
          part: input.part,
          place: input.place,
          activity: input.activity,
          resolved_at: new Date().toISOString(),
        },
        { onConflict: "friend_id" }
      )
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },
};
