"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { Send } from "lucide-react";
import { AgentContext, BlockchainAgent, LocationGameMaster, NPCAgent } from "~~/lib/agents";

interface Message {
  id: string;
  content: string;
  sender: "player" | "npc";
  timestamp: Date;
  senderName?: string;
  senderId?: string;
  type: "message" | "action" | "blockchain";
}

interface LocationChatProps {
  locationId: string;
  npcName: string;
  playerName?: string;
  playerId?: string;
  activities: {
    name: string;
    description: string;
    action: string;
  }[];
}

export const LocationChat: React.FC<LocationChatProps> = ({
  locationId,
  npcName,
  playerName = "You",
  playerId,
  activities,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isActionMode, setIsActionMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gameMasterRef = useRef<LocationGameMaster | null>(null);
  const npcAgentRef = useRef<NPCAgent | null>(null);
  const blockchainAgentRef = useRef<BlockchainAgent | null>(null);

  const formattedLocationName = locationId
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Initialize agents
  useEffect(() => {
    const context: AgentContext = {
      locationId,
      npcName,
      playerName,
      playerId,
    };

    gameMasterRef.current = new LocationGameMaster(context);
    npcAgentRef.current = new NPCAgent(context);
    blockchainAgentRef.current = new BlockchainAgent(context);
  }, [locationId, npcName, playerName, playerId]);

  // Initial greeting message
  useEffect(() => {
    const greeting: Message = {
      id: "1",
      content: `Welcome to the ${formattedLocationName}! How may I assist you today?`,
      sender: "npc" as const,
      senderName: npcName,
      timestamp: new Date(),
      type: "message",
    };
    setMessages([greeting]);
  }, [formattedLocationName, npcName]);

  // Listen for action events
  useEffect(() => {
    const handleAction = async (event: Event) => {
      const customEvent = event as CustomEvent<{ action: string }>;
      const playerMessage: Message = {
        id: Date.now().toString(),
        content: customEvent.detail.action,
        sender: "player",
        senderName: playerName,
        senderId: playerId,
        timestamp: new Date(),
        type: "action",
      };
      setMessages(prev => [...prev, playerMessage]);

      // Process with all agents
      const [gmResponse, npcResponse, blockchainResponse] = await Promise.all([
        gameMasterRef.current?.processMessage(customEvent.detail.action),
        npcAgentRef.current?.processMessage(customEvent.detail.action),
        blockchainAgentRef.current?.processMessage(customEvent.detail.action),
      ]);

      // Add GM response if it should respond
      if (gmResponse?.shouldRespond) {
        const gmMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: gmResponse.content,
          sender: "npc",
          senderName: "Game Master",
          timestamp: new Date(),
          type: gmResponse.type,
        };
        setMessages(prev => [...prev, gmMessage]);
      }

      // Add NPC response if it should respond
      if (npcResponse?.shouldRespond) {
        const npcMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: npcResponse.content,
          sender: "npc",
          senderName: npcName,
          timestamp: new Date(),
          type: npcResponse.type,
        };
        setMessages(prev => [...prev, npcMessage]);
      }

      // Add blockchain response if it should respond
      if (blockchainResponse?.shouldRespond) {
        const blockchainMessage: Message = {
          id: (Date.now() + 3).toString(),
          content: blockchainResponse.content,
          sender: "npc",
          senderName: "Blockchain",
          timestamp: new Date(),
          type: "blockchain",
        };
        setMessages(prev => [...prev, blockchainMessage]);
      }
    };

    window.addEventListener("location-action", handleAction);
    return () => window.removeEventListener("location-action", handleAction);
  }, [npcName, playerName, playerId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const playerMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "player",
      senderName: playerName,
      senderId: playerId,
      timestamp: new Date(),
      type: isActionMode ? "action" : "message",
    };
    setMessages(prev => [...prev, playerMessage]);
    setInputMessage("");

    // Process with all agents
    const [gmResponse, npcResponse, blockchainResponse] = await Promise.all([
      gameMasterRef.current?.processMessage(inputMessage),
      npcAgentRef.current?.processMessage(inputMessage),
      blockchainAgentRef.current?.processMessage(inputMessage),
    ]);

    // Add GM response if it should respond
    if (gmResponse?.shouldRespond) {
      const gmMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: gmResponse.content,
        sender: "npc",
        senderName: "Game Master",
        timestamp: new Date(),
        type: gmResponse.type,
      };
      setMessages(prev => [...prev, gmMessage]);
    }

    // Add NPC response if it should respond
    if (npcResponse?.shouldRespond) {
      const npcMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: npcResponse.content,
        sender: "npc",
        senderName: npcName,
        timestamp: new Date(),
        type: npcResponse.type,
      };
      setMessages(prev => [...prev, npcMessage]);
    }

    // Add blockchain response if it should respond
    if (blockchainResponse?.shouldRespond) {
      const blockchainMessage: Message = {
        id: (Date.now() + 3).toString(),
        content: blockchainResponse.content,
        sender: "npc",
        senderName: "Blockchain",
        timestamp: new Date(),
        type: "blockchain",
      };
      setMessages(prev => [...prev, blockchainMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content: string) => {
    // Split into lines and process them
    const lines = content.split("\n");
    const processedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip lines that don't contain any letters or are just dashes
      if (!/[a-zA-Z]/.test(line) || /^[\s-]+$/.test(line)) {
        continue;
      }

      // Check if current line is an enumeration (e.g., "1.", "2.", etc.) or starts with "-"
      if (/^\d+\./.test(line) || /^-/.test(line)) {
        // If there's a next line, join it with current line
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          // Only join if next line has letters and isn't another enumeration or dash line
          if (
            nextLine &&
            /[a-zA-Z]/.test(nextLine) &&
            !/^\d+\./.test(nextLine) &&
            !/^-/.test(nextLine) &&
            !/^[\s-]+$/.test(nextLine)
          ) {
            processedLines.push(`${line} ${nextLine}`);
            i++; // Skip the next line since we've joined it
            continue;
          }
        }
      }

      processedLines.push(line);
    }

    // Join lines back together
    const cleanedContent = processedLines.join("\n");

    // Split content into paragraphs and format them
    return cleanedContent.split("\n\n").map((paragraph, index) => {
      // Add newline before bold text if it's not at the start of paragraph
      const withNewlinesBeforeBold = paragraph.replace(/([^\n])\*\*(.*?)\*\*/g, "$1\n**$2**");
      // Format bold text
      const formattedParagraph = withNewlinesBeforeBold.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Format italic text
      const formattedWithItalic = formattedParagraph.replace(/\*(.*?)\*/g, "<em>$1</em>");

      // Process the formatted text to handle "-" before bold words
      const finalText = formattedWithItalic
        .split("\n")
        .map(line => {
          // Skip lines that are just dashes
          if (/^[\s-]+$/.test(line.trim())) {
            return "";
          }
          // If line starts with "-" and contains bold text, keep it as is
          if (line.trim().startsWith("-") && line.includes("<strong>")) {
            return line;
          }
          // If line contains bold text but doesn't start with "-", add "-" at the start
          if (line.includes("<strong>") && !line.trim().startsWith("-")) {
            return `- ${line}`;
          }
          return line;
        })
        .filter(line => line !== "") // Remove empty lines
        .join("\n");

      return (
        <p key={index} className="mb-2 last:mb-0 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: finalText }} />
      );
    });
  };

  return (
    <Card className="w-full h-[calc(100vh-2rem)] bg-[#2c1810] border-[#d4af37] flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-[#d4af37]/30 flex-shrink-0">
        <h2 className="text-[#d4af37] font-bold text-lg">{formattedLocationName}</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto" ref={scrollRef}>
          <div className="p-4">
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "player" ? "justify-end" : "justify-start"}`}
                >
                  {message.type === "action" ? (
                    <div className="max-w-[80%]">
                      <div className="text-[#90EE90]/90 italic text-sm">
                        {message.sender === "player" ? `${playerName} ` : `${npcName} `}
                        {message.content}
                      </div>
                      <span className="text-xs opacity-50 mt-1 block">{message.timestamp.toLocaleTimeString()}</span>
                    </div>
                  ) : message.type === "blockchain" ? (
                    <div className="max-w-[80%]">
                      <div className="text-[#b19cd9] text-sm">{message.content}</div>
                      <span className="text-xs opacity-50 mt-1 block">{message.timestamp.toLocaleTimeString()}</span>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.sender === "player"
                          ? "bg-[#d4af37] text-[#2c1810]"
                          : "bg-[#1a0f0a] text-[#d4af37] border border-[#d4af37]/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {message.sender === "player" && message.senderId ? (
                          <Link href={`/profile/${message.senderId}`} className="text-sm font-semibold hover:underline">
                            {message.senderName}
                          </Link>
                        ) : (
                          <span className="text-sm font-semibold">{message.senderName}</span>
                        )}
                      </div>
                      <div className="prose prose-invert max-w-none">
                        {message.sender === "npc" ? (
                          <div className="space-y-2">{formatMessage(message.content)}</div>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                      </div>
                      <span className="text-xs opacity-50 mt-2 block">{message.timestamp.toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="p-4 border-t border-[#d4af37]/30 flex-shrink-0">
        <div className="flex flex-wrap gap-2 mb-4">
          {activities.map((activity, index) => (
            <Button
              key={index}
              className="bg-[#1a0f0a] text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37] hover:text-[#2c1810] transition-colors relative group"
              onClick={() => {
                const event = new CustomEvent("location-action", {
                  detail: { action: activity.action },
                });
                window.dispatchEvent(event);
              }}
            >
              {activity.name}
              <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-[#2c1810] text-[#d4af37] text-sm rounded-lg border border-[#d4af37]/30 opacity-0 pointer-events-none max-w-[200px] break-words hover:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:transition-opacity">
                <p className="whitespace-normal">{activity.description}</p>
              </div>
            </Button>
          ))}
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isActionMode ? "Describe your action..." : "Type your message..."}
            className="bg-[#1a0f0a] border-[#d4af37]/30 text-[#d4af37] placeholder:text-[#d4af37]/50"
          />
          <Button
            onClick={() => setIsActionMode(!isActionMode)}
            className={`bg-[#1a0f0a] hover:bg-[#322c1b40] hover:text-[#2c1810] border border-[#d4af37]/30 transition-colors`}
          >
            {isActionMode ? "💬" : "🎭"}
          </Button>
          <Button onClick={handleSendMessage} className="bg-[#d4af37] text-[#2c1810] hover:bg-[#d4af37]/90">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
