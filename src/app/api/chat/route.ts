import { z } from "zod";
import { chatService } from "@/features/chat/service";
import { friendService } from "@/features/friend/service";
import { fail, json } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Grok calls can be slow.

// GET /api/chat — recent message history for the active friend.
export async function GET() {
  try {
    const friend = await friendService.getActiveFriend();
    const messages = await chatService.history(friend.id, 30);
    return json({ messages });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to load history", 500);
  }
}

const BodySchema = z.object({
  message: z.string().min(1).max(2000),
  userId: z.string().uuid().optional(),
});

// POST /api/chat — one conversational turn with the friend.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid request", 400);
  }

  try {
    const { reply, context } = await chatService.send(parsed.data.message, parsed.data.userId);
    return json({
      reply,
      status: context.status,
      emotion: context.emotion,
      localTime: context.localTime,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Chat failed";
    return fail(msg, 500);
  }
}
