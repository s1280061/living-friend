import type { Emotion, EmotionKind } from "@/types";
import { emotionRepository } from "./repository";

const VALID: EmotionKind[] = [
  "happy",
  "sad",
  "excited",
  "lonely",
  "calm",
  "anxious",
  "tired",
];

export const emotionService = {
  getCurrent(friendId: string): Promise<Emotion | null> {
    return emotionRepository.getLatest(friendId);
  },

  /** Record an emotional shift. Invalid labels fall back to "calm". */
  async shift(input: {
    friendId: string;
    emotion: string;
    intensity?: number;
    reason?: string;
    source?: string;
  }): Promise<Emotion> {
    const emotion = (VALID.includes(input.emotion as EmotionKind)
      ? input.emotion
      : "calm") as EmotionKind;
    const intensity = Math.min(5, Math.max(1, input.intensity ?? 3));
    return emotionRepository.add({
      friendId: input.friendId,
      emotion,
      intensity,
      reason: input.reason,
      source: input.source,
    });
  },

  isValid(value: string): value is EmotionKind {
    return VALID.includes(value as EmotionKind);
  },
};
