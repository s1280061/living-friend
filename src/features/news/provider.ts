import { serverEnv } from "@/lib/env";

export interface Headline {
  title: string;
  description: string | null;
  url: string | null;
  category: string;
}

/**
 * News source abstraction. Default implementation = NewsAPI.org.
 * Swap this for any provider without touching the service.
 */
export interface NewsProvider {
  fetchHeadlines(input: {
    categories: string[];
    query?: string | null;
    limit: number;
  }): Promise<Headline[]>;
}

export const newsApiProvider: NewsProvider = {
  async fetchHeadlines({ categories, query, limit }) {
    // Without a key, return nothing — the service handles the empty case gracefully.
    if (!serverEnv.newsApiKey) return [];

    const category = categories[0] ?? "technology";
    const params = new URLSearchParams({
      apiKey: serverEnv.newsApiKey,
      language: "en",
      pageSize: String(limit),
    });
    if (query) {
      params.set("q", query);
    } else {
      params.set("category", category);
      params.set("country", "us");
    }
    const endpoint = query ? "everything" : "top-headlines";

    const res = await fetch(`${serverEnv.newsApiBaseUrl}/${endpoint}?${params.toString()}`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      articles?: Array<{ title: string; description: string | null; url: string | null }>;
    };
    return (data.articles ?? [])
      .filter((a) => a.title)
      .slice(0, limit)
      .map((a) => ({
        title: a.title,
        description: a.description,
        url: a.url,
        category,
      }));
  },
};
