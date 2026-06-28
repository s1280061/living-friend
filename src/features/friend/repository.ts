import { getAdminClient } from "@/lib/supabase/admin";
import type { Friend, FriendSettings } from "@/types";

/**
 * Data access for the persona. No business logic here — just queries.
 */
export const friendRepository = {
  async getBySlug(slug: string): Promise<Friend | null> {
    const { data, error } = await getAdminClient()
      .from("friends")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Friend | null> {
    const { data, error } = await getAdminClient()
      .from("friends")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async listAll(): Promise<Friend[]> {
    const { data, error } = await getAdminClient()
      .from("friends")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async getSettings(friendId: string): Promise<FriendSettings | null> {
    const { data, error } = await getAdminClient()
      .from("friend_settings")
      .select("*")
      .eq("friend_id", friendId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};
