import { getAdminClient } from "@/lib/supabase/admin";
import type { DailySchedule, ScheduleSlot } from "@/types";

export const scheduleRepository = {
  async getByDate(friendId: string, date: string): Promise<DailySchedule | null> {
    const { data, error } = await getAdminClient()
      .from("daily_schedule")
      .select("*")
      .eq("friend_id", friendId)
      .eq("date", date)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async upsert(input: {
    friendId: string;
    date: string;
    slots: ScheduleSlot[];
    summary: string;
  }): Promise<DailySchedule> {
    const { data, error } = await getAdminClient()
      .from("daily_schedule")
      .upsert(
        {
          friend_id: input.friendId,
          date: input.date,
          slots: input.slots,
          summary: input.summary,
        },
        { onConflict: "friend_id,date" }
      )
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },
};
