import { friendService } from "@/features/friend/service";
import { ChatWindow } from "@/features/chat/components/ChatWindow";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const friend = await friendService.getActiveFriend();
  return <ChatWindow friend={friend} />;
}
