"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Send } from "lucide-react";
import Link from "next/link";

interface ChatMessage {
  id: string;
  type: 'message' | 'join' | 'leave';
  sender: string;
  senderId: string;
  content: string;
  timestamp: Date;
}

interface ChatProps {
  playerName: string;
  playerId?: string;
  serverUrl: string;
}

export const Chat: React.FC<ChatProps> = ({ playerName, playerId, serverUrl }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const ws = new WebSocket(serverUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      // Send join message
      ws.send(JSON.stringify({
        type: 'join',
        name: playerName
      }));
    };

    ws.onmessage = (event) => {
      const message: ChatMessage = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);
    };

    ws.onclose = () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [serverUrl, playerName]);

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
    if (!inputMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: 'message',
      content: inputMessage
    }));

    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleTimeString();
  };

  return (
    <Card className="w-full h-[calc(100vh-2rem)] bg-[#2c1810] border-[#d4af37] flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-[#d4af37]/30 flex-shrink-0 flex justify-between items-center">
        <h2 className="text-[#d4af37] font-bold text-lg">Chat</h2>
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
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.senderId === playerId
                        ? "bg-[#d4af37] text-[#2c1810]"
                        : "bg-[#1a0f0a] text-[#d4af37] border border-[#d4af37]/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {message.senderId && message.senderId !== playerId ? (
                        <Link href={`/profile/${message.senderId}`} className="text-sm font-semibold hover:underline">
                          {message.sender}
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold">{message.sender}</span>
                      )}
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <span className="text-xs opacity-50 mt-2 block">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#d4af37]/30 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="bg-[#1a0f0a] border-[#d4af37]/30 text-[#d4af37] placeholder:text-[#d4af37]/50"
            disabled={!isConnected}
          />
          <Button 
            onClick={handleSendMessage} 
            className="bg-[#d4af37] text-[#2c1810] hover:bg-[#d4af37]/90"
            disabled={!isConnected}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}; 