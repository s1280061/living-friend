import { grokJson } from "@/lib/grok/client";
import { friendService } from "@/features/friend/service";
import { emotionService } from "@/features/emotion/service";
import { todayInZone } from "@/utils/time";
import type { EmotionKind, Friend, NewsEvent } from "@/types";
import { newsRepository } from "./repository";
import { getNewsProvider, type Headline, type NewsProvider } from "./provider";

interface TransformedNews {
  experience: string;
  emotion: EmotionKind;
}

type NewsInsertRow = Parameters<typeof newsRepository.insertMany>[0][number];

export const newsService = {
  getToday(friendId: string, timezone: string): Promise<NewsEvent[]> {
    return newsRepository.getByDate(friendId, todayInZone(timezone));
  },

  getRecent: newsRepository.getRecent,

  /**
   * The core rule of the app: news is NEVER reported. It is transformed into
   * the friend's own lived experience. Called by the news cron.
   */
  async ingestForToday(
    friendId: string,
    provider: NewsProvider = getNewsProvider()
  ): Promise<NewsEvent[]> {
    const friend = await friendService.getById(friendId);
    if (!friend) throw new Error(`Friend ${friendId} not found`);
    const settings = await friendService.getSettings(friendId);
    const date = todayInZone(settings.timezone);

    const headlines = await provider.fetchHeadlines({
      categories: settings.news_categories,
      query: settings.news_query,
      limit: 4,
    });
    if (headlines.length === 0) return [];

    const transformed: NewsInsertRow[] = [];
    for (const h of headlines) {
      try {
        const t = await grokJson<TransformedNews>({
          messages: [{ role: "user", content: buildPrompt(friend, h) }],
          temperature: 0.9,
          maxTokens: 250,
        });
        transformed.push({
          friendId,
          date,
          category: h.category,
          sourceTitle: h.title,
          sourceUrl: h.url,
          experience: t.experience,
          emotion: emotionService.isValid(t.emotion) ? t.emotion : null,
        });
      } catch {
        // Skip a single bad transform; don't fail the whole batch.
      }
    }

    const saved = await newsRepository.insertMany(transformed);

    // The most recent piece of news nudges the friend's current emotion.
    const last = saved[0];
    if (last?.emotion) {
      await emotionService
        .shift({
          friendId,
          emotion: last.emotion,
          intensity: 3,
          reason: last.experience.slice(0, 140),
          source: "news",
        })
        .catch(() => undefined);
    }

    return saved;
  },
};

function buildPrompt(friend: Friend, headline: Headline): string {
  return [
    `You are ${friend.name}. Personality: ${friend.personality}`,
    `Interests: ${friend.hobbies.join(", ")}.`,
    `Speech style: ${friend.speech_style}`,
    "",
    "You just came across this in the world today:",
    `TITLE: ${headline.title}`,
    headline.description ? `DETAIL: ${headline.description}` : "",
    "",
    "Turn this into YOUR OWN small lived experience — what you did with it, how it",
    "made you feel, a personal thought. Do NOT report the news. Do NOT say",
    `"there was a report that...". Speak as yourself, first person, 1-2 sentences.`,
    "",
    "Respond ONLY with JSON:",
    `{ "experience": "...", "emotion": "happy|sad|excited|lonely|calm|anxious|tired" }`,
  ]
    .filter(Boolean)
    .join("\n");
}
