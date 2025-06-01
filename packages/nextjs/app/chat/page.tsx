"use client";

import { ChatClient } from "../../components/game/ChatClient";

export default function ChatPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex-1 p-4">
        <ChatClient />
      </div>
    </main>
  );
} 