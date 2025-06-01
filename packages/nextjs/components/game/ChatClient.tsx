"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const ChatWithNoSSR = dynamic(
  () => import('./Chat').then((mod) => {
    const ChatComponent = mod.Chat;
    return function ChatWrapper() {
      const serverUrl = `ws://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3030`;
      
      // Generate a random player ID for this session
      const playerId = Math.random().toString(36).substring(2, 15);
      
      return (
        <ChatComponent
          playerName="Player Name" // TODO: Replace with actual player name
          playerId={playerId}
          serverUrl={serverUrl}
          onUserMessage={async (message: string) => {
            try {
              // Call the GM API endpoint with the user's message
              const response = await fetch('/api/gm', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userInput: message }),
              });

              if (!response.ok) {
                throw new Error('Failed to get GM response');
              }

              const data = await response.json();
              
              // The WebSocket server will handle broadcasting the GM's response
              // We don't need to do anything here as the response will come through
              // the WebSocket connection like any other message
            } catch (error) {
              console.error('Error getting GM response:', error);
            }
          }}
        />
      );
    };
  }),
  { ssr: false }
);

export function ChatClient() {
  return <ChatWithNoSSR />;
} 