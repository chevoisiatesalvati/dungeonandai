"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const NAMES = {
  male: [
    "Arthur",
    "Gandalf",
    "Thorin",
    "Legolas",
    "Aragorn"
  ],
  female: [
    "Galadriel",
    "Arwen",
    "Eowyn",
    "Luna",
    "Morgana"
  ]
};

const ChatWithNoSSR = dynamic(
  () => import('./Chat').then((mod) => {
    const ChatComponent = mod.Chat;
    return function ChatWrapper() {
      const [playerName, setPlayerName] = useState<string>("");
      
      useEffect(() => {
        // Randomly choose between male and female names
        const gender = Math.random() < 0.5 ? 'male' : 'female';
        const names = NAMES[gender];
        const randomName = names[Math.floor(Math.random() * names.length)];
        setPlayerName(randomName);
      }, []);

      const serverUrl = `ws://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3030`;
      return (
        <ChatComponent
          playerName={playerName}
          playerId="player123" // TODO: Replace with actual player ID
          serverUrl={serverUrl}
        />
      );
    };
  }),
  { ssr: false }
);

export function ChatClient() {
  return <ChatWithNoSSR />;
} 