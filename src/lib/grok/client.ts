import { serverEnv } from "@/lib/env";
import type { GrokChatOptions, GrokChatResult } from "./types";

/**
 * Thin wrapper over Grok's OpenAI-compatible Chat Completions endpoint.
 * Server-only. Keeps all transport/error concerns out of the services.
 */
export async function grokChat(options: GrokChatOptions): Promise<GrokChatResult> {
  const { messages, temperature = 0.85, maxTokens = 800, json = false } = options;

  const res = await fetch(`${serverEnv.groqBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serverEnv.groqApiKey}`,
    },
    body: JSON.stringify({
      model: serverEnv.groqModel,
      messages,
      temperature,
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
    // Grok can be slow; give it room but stay under serverless limits.
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Grok API error ${res.status}: ${detail.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  return { content: content.trim(), raw: data };
}

/** Convenience: call Grok expecting a JSON object back, parsed and typed. */
export async function grokJson<T>(options: Omit<GrokChatOptions, "json">): Promise<T> {
  const { content } = await grokChat({ ...options, json: true });
  try {
    return JSON.parse(content) as T;
  } catch {
    // Some models wrap JSON in prose or code fences — recover the object.
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error(`Grok did not return valid JSON: ${content.slice(0, 300)}`);
  }
}
