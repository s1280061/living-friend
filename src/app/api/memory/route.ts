import { z } from "zod";
import { friendService } from "@/features/friend/service";
import { memoryService } from "@/features/memory/service";
import { fail, json } from "@/lib/http";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  kind: z.enum(["diary", "conversation", "event", "milestone"]).default("event"),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(4000),
  importance: z.number().int().min(1).max(5).optional(),
  happenedAt: z.string().datetime().optional(),
  userId: z.string().uuid().optional(),
});

// POST /api/memory — store a shared memory (e.g. "we went to Kyoto").
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
    const friend = await friendService.getActiveFriend();
    const memory = await memoryService.remember({
      friendId: friend.id,
      ...parsed.data,
    });
    return json({ memory }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to store memory";
    return fail(msg, 500);
  }
}
