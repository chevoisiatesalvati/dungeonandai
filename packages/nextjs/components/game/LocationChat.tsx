"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GM_Response } from "../../../../dnagent_gm";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Send } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "player" | "npc" | "gm";
  timestamp: Date;
  senderName?: string;
  senderId?: string;
  type: "message" | "action" | "join" | "leave";
  isGMResponse?: boolean;
  locationId?: string;
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
  const [isConnected, setIsConnected] = useState(false);
  const [isWaitingForGM, setIsWaitingForGM] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const formattedLocationName = locationId
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.hostname}:3030`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      // Send join message with location ID
      ws.send(JSON.stringify({
        type: 'join',
        name: playerName,
        locationId: locationId
      }));
    };

    ws.onmessage = async (event) => {
      const message: Message = JSON.parse(event.data);
      console.log('=== Received WebSocket Message ===');
      console.log('Full message:', message);
      
      // Only process messages for this location
      if (message.locationId !== locationId) {
        console.log('Message location mismatch:', message.locationId, '!=', locationId);
        return;
      }

      // Handle different message types
      if (message.type === 'join' || message.type === 'leave') {
        console.log('Processing join/leave message');
        setMessages(prev => [...prev, message]);
        return;
      }

      // If it's a GM message, just add it to chat and unblock input
      if (message.isGMResponse || message.sender === "gm") {
        console.log('Processing GM message');
        setMessages(prev => [...prev, message]);
        setIsWaitingForGM(false);
        return;
      }

      // Add user message to chat
      console.log('Adding user message to chat');
      setMessages(prev => [...prev, message]);
    };

    ws.onclose = () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [locationId, playerName, playerId]);

  // Effect to handle GM responses based on chat history
  useEffect(() => {
    const processLastUserMessage = async () => {
      // Get the last message from chat history
      const lastMessage = messages[messages.length - 1];
      
      // Skip if no messages or if last message is from GM
      if (!lastMessage || lastMessage.sender === "gm" || lastMessage.isGMResponse) {
        return;
      }

      // Check if it's a user message or action that needs GM response
      if ((lastMessage.type === 'message' || lastMessage.type === 'action') && lastMessage.sender === 'player') {
        console.log('=== Processing Last User Message ===');
        console.log('Message:', lastMessage);
        
        setIsWaitingForGM(true);
        try {
          console.log('Calling GM_Response with:', lastMessage.content);
          const gmResponse = await GM_Response(lastMessage.content);
          console.log('GM Response received:', gmResponse);

          // Create GM message
          const gmMessage: Message = {
            id: Date.now().toString(),
            content: gmResponse,
            sender: "gm",
            senderName: "GM",
            senderId: "gm",
            timestamp: new Date(),
            type: lastMessage.type, // Keep the same type as the user message
            isGMResponse: true,
            locationId: locationId
          };

          // Add GM response to chat
          setMessages(prev => [...prev, gmMessage]);

          // Send GM response through WebSocket for other users
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(gmMessage));
          }
        } finally {
          setTimeout(() => {
            setIsWaitingForGM(false);
          }, 1000);
        }
      }
    };

    // Process the last message whenever messages change
    processLastUserMessage();
  }, [messages, locationId]);

  // Initial greeting message
  useEffect(() => {
    const greeting: Message = {
      id: "1",
      content: `Welcome to the ${formattedLocationName}! How may I assist you today?`,
      sender: "npc",
      senderName: npcName,
      timestamp: new Date(),
      type: "message",
    };
    setMessages([greeting]);
  }, [formattedLocationName, npcName]);

  // Listen for action events
  useEffect(() => {
    const handleAction = (event: CustomEvent<{ action: string }>) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || isWaitingForGM) return;

      const actionMessage: Message = {
        id: Date.now().toString(),
        content: event.detail.action,
        sender: "player",
        senderName: playerName,
        senderId: playerId,
        timestamp: new Date(),
        type: "action",
        locationId: locationId
      };

      // Add action message to chat immediately
      setMessages(prev => [...prev, actionMessage]);

      // Send action through WebSocket
      wsRef.current.send(JSON.stringify(actionMessage));
    };

    window.addEventListener("location-action", handleAction as EventListener);
    return () => window.removeEventListener("location-action", handleAction as EventListener);
  }, [npcName, playerName, playerId, locationId, isWaitingForGM]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || isWaitingForGM) return;

    const message: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "player",
      senderName: playerName,
      senderId: playerId,
      timestamp: new Date(),
      type: isActionMode ? "action" : "message",
      locationId: locationId
    };

    // Add message to chat immediately
    setMessages(prev => [...prev, message]);

    // Send message through WebSocket
    wsRef.current.send(JSON.stringify(message));
    setInputMessage("");
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
      <div className="p-4 border-b border-[#d4af37]/30 flex-shrink-0 flex justify-between items-center">
        <h2 className="text-[#d4af37] font-bold text-lg">{formattedLocationName}</h2>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-4">
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === playerId ? "justify-end" : "justify-start"}`}
                >
                  {message.type === "action" ? (
                    <div className="max-w-[80%]">
                      <div className="text-[#90EE90]/90 italic text-sm">
                        {message.senderName} {message.content}
                      </div>
                      <span className="text-xs opacity-50 mt-1 block">{message.timestamp.toLocaleTimeString()}</span>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.senderId === playerId
                          ? "bg-[#d4af37] text-[#2c1810]"
                          : message.sender === "gm"
                          ? "bg-[#1a0f0a] text-[#d4af37] border-2 border-[#d4af37]"
                          : "bg-[#1a0f0a] text-[#d4af37] border border-[#d4af37]/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {message.senderId && message.senderId !== playerId ? (
                          <Link href={`/profile/${message.senderId}`} className="text-sm font-semibold hover:underline">
                            {message.senderName}
                          </Link>
                        ) : (
                          <span className="text-sm font-semibold">{message.senderName}</span>
                        )}
                      </div>
                      <div className="prose prose-invert max-w-none">
                        {message.sender === "gm" ? (
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
        </ScrollArea>
      </div>

      {/* Input Area */}
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
              disabled={!isConnected || isWaitingForGM}
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
            disabled={!isConnected || isWaitingForGM}
          />
          <Button
            onClick={() => setIsActionMode(!isActionMode)}
            className={`bg-[#1a0f0a] hover:bg-[#322c1b40] hover:text-[#2c1810] border border-[#d4af37]/30 transition-colors`}
            disabled={!isConnected || isWaitingForGM}
          >
            {isActionMode ? "💬" : "🎭"}
          </Button>
          <Button 
            onClick={handleSendMessage} 
            className="bg-[#d4af37] text-[#2c1810] hover:bg-[#d4af37]/90"
            disabled={!isConnected || isWaitingForGM}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
