import { serverEnv } from "@/lib/env";
import type { Friend, FriendSettings } from "@/types";
import { friendRepository } from "./repository";

/** Default settings used if a friend has no settings row yet. */
const FALLBACK_SETTINGS: Omit<FriendSettings, "friend_id"> = {
  home_city: "Tokyo",
  timezone: "Asia/Tokyo",
  wake_hour: 7,
  sleep_hour: 23,
  news_categories: ["technology", "science"],
  news_query: null,
  updated_at: new Date().toISOString(),
};

export const friendService = {
  /** The single active friend for the MVP (configurable via env slug). */
  async getActiveFriend(): Promise<Friend> {
    const bySlug = await friendRepository.getBySlug(serverEnv.defaultFriendSlug);
    if (bySlug) return bySlug;
    const all = await friendRepository.listAll();
    if (all.length === 0) {
      throw new Error(
        "No friend found. Did you run supabase/seed.sql to create the default friend?"
      );
    }
    return all[0];
  },

  async getSettings(friendId: string): Promise<FriendSettings> {
    const settings = await friendRepository.getSettings(friendId);
    return settings ?? { friend_id: friendId, ...FALLBACK_SETTINGS };
  },

  getById: friendRepository.getById,
  listAll: friendRepository.listAll,
};
