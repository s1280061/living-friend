import { serverEnv } from "@/lib/env";

export interface Headline {
  title: string;
  description: string | null;
  url: string | null;
  category: string;
}

/**
 * News source abstraction. Implementations are interchangeable — the service
 * never knows which one it's using (dependency inversion).
 */
export interface NewsProvider {
  fetchHeadlines(input: {
    categories: string[];
    query?: string | null;
    limit: number;
  }): Promise<Headline[]>;
}

// ──────────────────────────────────────────────────────────────
//  RSS provider (default) — Yahoo!ニュース。No API key, works in prod, 日本語.
// ──────────────────────────────────────────────────────────────
const YAHOO_BASE = "https://news.yahoo.co.jp/rss/topics";

/** Map our generic category names → Yahoo topic feed slugs. */
const YAHOO_FEED: Record<string, string> = {
  top: "top-picks",
  technology: "it",
  tech: "it",
  it: "it",
  science: "science",
  business: "business",
  economy: "business",
  world: "world",
  international: "world",
  domestic: "domestic",
  entertainment: "entertainment",
  sports: "sports",
};

export const rssProvider: NewsProvider = {
  async fetchHeadlines({ categories, limit }) {
    // Resolve up to 3 feeds from the friend's categories (fallback: 主要).
    const slugs = Array.from(
      new Set(
        (categories.length ? categories : ["top"]).map((c) => YAHOO_FEED[c.toLowerCase()] ?? "top-picks")
      )
    ).slice(0, 3);

    const perFeed = Math.max(2, Math.ceil(limit / slugs.length));
    const results = await Promise.all(
      slugs.map((slug) => fetchFeed(`${YAHOO_BASE}/${slug}.xml`, slug, perFeed))
    );

    // Flatten, de-dupe by title, cap to limit.
    const seen = new Set<string>();
    const merged: Headline[] = [];
    for (const item of results.flat()) {
      if (seen.has(item.title)) continue;
      seen.add(item.title);
      merged.push(item);
      if (merged.length >= limit) break;
    }
    return merged;
  },
};

async function fetchFeed(url: string, category: string, limit: number): Promise<Headline[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "LivingFriend/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return [];
    return parseRss(await res.text(), category, limit);
  } catch {
    return [];
  }
}

/** Minimal, dependency-free RSS 2.0 parser (handles CDATA + entities). */
function parseRss(xml: string, category: string, limit: number): Headline[] {
  const out: Headline[] = [];
  const items = xml.split(/<item[\s>]/i).slice(1);
  for (const chunk of items) {
    const body = chunk.split(/<\/item>/i)[0];
    const title = extractTag(body, "title");
    if (!title) continue;
    out.push({
      title,
      description: extractTag(body, "description"),
      url: extractTag(body, "link"),
      category,
    });
    if (out.length >= limit) break;
  }
  return out;
}

function extractTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!m) return null;
  let v = m[1].trim();
  v = v.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"); // unwrap CDATA
  v = v.replace(/<[^>]+>/g, ""); // strip nested HTML
  v = v
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
  v = v.trim();
  return v.length ? v : null;
}

// ──────────────────────────────────────────────────────────────
//  NewsAPI.org provider (optional alternative; free tier = dev only).
// ──────────────────────────────────────────────────────────────
export const newsApiProvider: NewsProvider = {
  async fetchHeadlines({ categories, query, limit }) {
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
      .map((a) => ({ title: a.title, description: a.description, url: a.url, category }));
  },
};

// ──────────────────────────────────────────────────────────────
//  Factory — choose provider via NEWS_PROVIDER env (default: rss).
// ──────────────────────────────────────────────────────────────
export function getNewsProvider(): NewsProvider {
  return serverEnv.newsProvider === "newsapi" ? newsApiProvider : rssProvider;
}
