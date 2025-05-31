"use client";

import React, { useEffect, useRef, useState } from "react";
import { GM_Response } from "../../../../dnagent_gm";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Send } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "player" | "npc";
  timestamp: Date;
}

interface LocationChatProps {
  locationId: string;
  npcName: string;
}

export const LocationChat: React.FC<LocationChatProps> = ({ locationId, npcName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const formattedLocationName = locationId
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Initial greeting message
  useEffect(() => {
    const greeting: Message = {
      id: "1",
      content: `Welcome to the ${formattedLocationName}! How may I assist you today?`,
      sender: "npc" as const,
      timestamp: new Date(),
    };
    setMessages([greeting]);
  }, [formattedLocationName, npcName]);

  // Listen for action events
  useEffect(() => {
    const handleAction = (event: CustomEvent<{ action: string }>) => {
      const playerMessage: Message = {
        id: Date.now().toString(),
        content: event.detail.action,
        sender: "player",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, playerMessage]);

      // TODO: Here we'll add the AI response logic based on the action
      setTimeout(async () => {
        const npcResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: await GM_Response(event.detail.action),
          sender: "npc",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, npcResponse]);
      }, 1000);
    };

    window.addEventListener("location-action", handleAction as EventListener);
    return () => window.removeEventListener("location-action", handleAction as EventListener);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add player message
    const playerMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "player",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, playerMessage]);
    setInputMessage("");

    // Get AI response
    const npcResponse: Message = {
      id: (Date.now() + 1).toString(),
      content: await GM_Response(inputMessage),
      sender: "npc",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, npcResponse]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full h-full bg-[#2c1810] border-[#d4af37] flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-[#d4af37]/30">
        <h2 className="text-[#d4af37] font-bold text-lg">{formattedLocationName}</h2>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.sender === "player" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === "player"
                    ? "bg-[#d4af37] text-[#2c1810]"
                    : "bg-[#1a0f0a] text-[#d4af37] border border-[#d4af37]/30"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <span className="text-xs opacity-50 mt-1 block">{message.timestamp.toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-[#d4af37]/30">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="bg-[#1a0f0a] border-[#d4af37]/30 text-[#d4af37] placeholder:text-[#d4af37]/50"
          />
          <Button onClick={handleSendMessage} className="bg-[#d4af37] text-[#2c1810] hover:bg-[#d4af37]/90">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
