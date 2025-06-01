"use client";

import React, { useEffect, useRef, useState } from "react";
import { GM_Response } from "../../../../dnagent_gm";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Send } from "lucide-react";
import { usernameGenerator } from "../../lib/usernameGenerator";

// Function to generate random name
const generateRandomName = () => {
  const vowels = 'aeiou';
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  const length = Math.floor(Math.random() * 4) + 4;
  let name = '';
  
  for (let i = 0; i < length; i++) {
    if (i % 2 === 0) {
      name += consonants[Math.floor(Math.random() * consonants.length)];
    } else {
      name += vowels[Math.floor(Math.random() * vowels.length)];
    }
  }
  
  return name.charAt(0).toUpperCase() + name.slice(1);
};

interface Message {
  id: string;
  content: string;
  sender: "player" | "npc" | "system";
  timestamp: Date;
  senderName?: string;
  senderId?: string;
  type: "message" | "action" | "join" | "leave";
}

interface GMMessage {
  id: string;
  content: string;
  timestamp: Date;
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

// Component for GM messages
const GMMessageDisplay: React.FC<{ message: GMMessage }> = ({ message }) => {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg p-4 bg-[#1a0f0a] text-[#d4af37] border-2 border-[#d4af37]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold">GM</span>
        </div>
        <div className="prose prose-invert max-w-none">
          <div className="space-y-2">
            {message.content.split("\n").map((line, index) => (
              <p key={index} className="mb-2 last:mb-0 whitespace-pre-line">{line}</p>
            ))}
          </div>
        </div>
        <span className="text-xs opacity-50 mt-2 block">{message.timestamp.toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

// Component for user messages
const UserMessageDisplay: React.FC<{ 
  message: Message; 
  isCurrentUser: boolean;
  playerName: string;
}> = ({ message, isCurrentUser, playerName }) => {
  if (message.type === "action") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%]">
          <div className="text-[#90EE90]/90 italic text-sm">
            {message.senderName || playerName} {message.content}
          </div>
          <span className="text-xs opacity-50 mt-1 block">{message.timestamp.toLocaleTimeString()}</span>
        </div>
      </div>
    );
  }

  if (message.type === "join" || message.type === "leave") {
    return (
      <div className="flex justify-center">
        <div className="max-w-[80%] text-center">
          <div className="text-[#d4af37]/70 italic text-sm">
            {message.content}
          </div>
          <span className="text-xs opacity-50 mt-1 block">{message.timestamp.toLocaleTimeString()}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-lg p-4 ${
        isCurrentUser
          ? "bg-[#d4af37] text-[#2c1810]"
          : "bg-[#1a0f0a] text-[#d4af37] border border-[#d4af37]/30"
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold">{message.senderName || playerName}</span>
        </div>
        <p className="text-sm">{message.content}</p>
        <span className="text-xs opacity-50 mt-2 block">{message.timestamp.toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export const LocationChat: React.FC<LocationChatProps> = ({
  locationId,
  npcName,
  playerName: propPlayerName,
  playerId,
  activities,
}) => {
  const username = useRef(propPlayerName || usernameGenerator.generateUniqueName()).current;
  
  const [userMessages, setUserMessages] = useState<Message[]>([]);
  const [gmMessages, setGMMessages] = useState<GMMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isActionMode, setIsActionMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const hasConnectedRef = useRef(false);

  const formattedLocationName = locationId
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const handleGMMessage = async (userMessage: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': playerId || 'anonymous',
          'x-is-gm-response': 'true',
          'x-is-user-message': 'false'
        },
        body: JSON.stringify({
          message: userMessage,
          locationId,
          isAction: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get GM response');
      }

      const data = await response.json();
      
      // Add GM message directly to gmMessages
      const gmMessage: GMMessage = {
        id: Date.now().toString(),
        content: data.content,
        timestamp: new Date(data.timestamp)
      };
      
      setGMMessages(prev => [...prev, gmMessage]);
      
      // Send GM response through WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error getting GM response:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    try {
      // First, send message to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': playerId || 'anonymous',
          'x-is-gm-response': 'false',
          'x-is-user-message': 'true'
        },
        body: JSON.stringify({
          message: inputMessage,
          locationId,
          isAction: isActionMode
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add user message to userMessages
      const userMessage: Message = {
        id: Date.now().toString(),
        content: inputMessage,
        sender: 'player',
        senderName: username,
        senderId: playerId,
        timestamp: new Date(),
        type: isActionMode ? 'action' : 'message'
      };
      
      setUserMessages(prev => [...prev, userMessage]);

      // Send message through WebSocket
      wsRef.current.send(JSON.stringify(data));
      setInputMessage("");

      // Get GM response for our message
      await handleGMMessage(inputMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Listen for action events
  useEffect(() => {
    const handleAction = async (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      const customEvent = event as CustomEvent<{ action: string }>;
      
      try {
        // Send action to API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': playerId || 'anonymous',
            'x-is-gm-response': 'false',
            'x-is-user-message': 'true'
          },
          body: JSON.stringify({
            message: customEvent.detail.action,
            locationId,
            isAction: true
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send action');
        }

        const data = await response.json();

        // Add action to userMessages
        const actionMessage: Message = {
          id: Date.now().toString(),
          content: customEvent.detail.action,
          sender: 'player',
          senderName: username,
          senderId: playerId,
          timestamp: new Date(),
          type: 'action'
        };
        
        setUserMessages(prev => [...prev, actionMessage]);

        // Send action through WebSocket
        wsRef.current.send(JSON.stringify(data));

        // Get GM response for our action
        await handleGMMessage(customEvent.detail.action);
      } catch (error) {
        console.error('Error sending action:', error);
      }
    };

    window.addEventListener("location-action", handleAction);
    return () => window.removeEventListener("location-action", handleAction);
  }, [playerId, locationId, username]);

  // WebSocket connection
  useEffect(() => {
    if (hasConnectedRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const serverUrl = `ws://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3030`;
    const ws = new WebSocket(serverUrl);
    wsRef.current = ws;
    hasConnectedRef.current = true;

    ws.onopen = () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      
      // Send join message with stored username
      ws.send(JSON.stringify({
        type: 'join',
        name: username,
        locationId
      }));
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      // Only process messages for this location
      if (data.locationId && data.locationId !== locationId) {
        return;
      }
      
      // Handle different message types
      if (data.type === 'join' || data.type === 'leave') {
        setUserMessages(prev => [...prev, {
          id: data.id,
          content: data.content,
          sender: 'system',
          senderName: data.sender,
          senderId: data.senderId,
          timestamp: new Date(data.timestamp),
          type: data.type
        }]);
      } else if (data.type === 'message' && !data.isGMResponse) {
        // Add user message to chat
        setUserMessages(prev => [...prev, {
          id: data.id,
          content: data.content,
          sender: 'player',
          senderName: data.sender,
          senderId: data.senderId,
          timestamp: new Date(data.timestamp),
          type: data.isAction ? 'action' : 'message'
        }]);

        // Only trigger GM response for non-GM messages
        if (data.sender !== 'GM' && 
            data.sender !== 'system' && 
            !data.isGMResponse && 
            data.type === 'message') {
          await handleGMMessage(data.content);
        }
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
      wsRef.current = null;
      hasConnectedRef.current = false;
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      wsRef.current = null;
      hasConnectedRef.current = false;
    };

    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        wsRef.current = null;
        hasConnectedRef.current = false;
      }
    };
  }, [locationId, username]);

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
    setUserMessages([greeting]);
  }, [formattedLocationName, npcName]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [userMessages, gmMessages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
              {/* Combine and sort messages by timestamp */}
              {[...userMessages, ...gmMessages]
                .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
                .map(message => {
                  // Check if it's a GM message by looking for specific properties
                  if ('content' in message && !('type' in message)) {
                    return <GMMessageDisplay key={message.id} message={message as GMMessage} />;
                  }
                  return (
                    <UserMessageDisplay
                      key={message.id}
                      message={message as Message}
                      isCurrentUser={(message as Message).senderId === playerId}
                      playerName={username}
                    />
                  );
                })}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Actions Bar */}
      <div className="p-4 border-t border-[#d4af37]/30 flex-shrink-0">
        <div className="flex flex-wrap gap-2 mb-4">
          {activities.map((activity, index) => (
            <Button
              key={index}
              type="button"
              className="bg-[#1a0f0a] text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37] hover:text-[#2c1810] transition-colors relative group"
              onClick={(e) => {
                e.preventDefault();
                const event = new CustomEvent("location-action", {
                  detail: { action: activity.action },
                  bubbles: true,
                  cancelable: true
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
            disabled={!isConnected}
          />
          <Button
            onClick={() => setIsActionMode(!isActionMode)}
            className={`bg-[#1a0f0a] hover:bg-[#322c1b40] hover:text-[#2c1810] border border-[#d4af37]/30 transition-colors`}
            disabled={!isConnected}
          >
            {isActionMode ? "💬" : "🎭"}
          </Button>
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
