"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Castle, Home, MapPin, Store, Swords, Trees } from "lucide-react";

interface Location {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  position: { x: number; y: number };
  difficulty: "safe" | "moderate" | "dangerous";
  enabled: boolean;
}

const locations: Record<string, Location> = {
  townSquare: {
    id: "town-square",
    name: "Town Square",
    description: "The bustling center of town. A safe place to meet other adventurers.",
    icon: <Home className="w-6 h-6" />,
    position: { x: 50, y: 50 },
    difficulty: "safe",
    enabled: false,
  },
  mysticTavern: {
    id: "mystic-tavern",
    name: "Mystic Tavern",
    description: "A cozy tavern where adventurers share tales and receive quests.",
    icon: <MapPin className="w-6 h-6" />,
    position: { x: 30, y: 40 },
    difficulty: "safe",
    enabled: true,
  },
  darkForest: {
    id: "dark-forest",
    name: "Dark Forest",
    description: "A dangerous forest filled with monsters and treasures.",
    icon: <Trees className="w-6 h-6" />,
    position: { x: 70, y: 30 },
    difficulty: "dangerous",
    enabled: true,
  },
  merchantShop: {
    id: "merchant-shop",
    name: "Merchant's Shop",
    description: "Trade your loot for better equipment and supplies.",
    icon: <Store className="w-6 h-6" />,
    position: { x: 40, y: 60 },
    difficulty: "safe",
    enabled: false,
  },
  castleGates: {
    id: "castle-gates",
    name: "Castle Gates",
    description: "The entrance to the royal castle. Only the brave may enter.",
    icon: <Castle className="w-6 h-6" />,
    position: { x: 50, y: 20 },
    difficulty: "moderate",
    enabled: false,
  },
  arena: {
    id: "arena",
    name: "Battle Arena",
    description: "Test your skills against other warriors in combat.",
    icon: <Swords className="w-6 h-6" />,
    position: { x: 65, y: 55 },
    difficulty: "moderate",
    enabled: false,
  },
};

export const WorldMap: React.FC = () => {
  const router = useRouter();
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  const handleLocationClick = (locationId: string) => {
    router.push(`/location/${locationId}`);
  };

  const getDifficultyColor = (difficulty: Location["difficulty"]) => {
    switch (difficulty) {
      case "safe":
        return "text-green-500 border-green-500 hover:bg-green-500/10";
      case "moderate":
        return "text-yellow-500 border-yellow-500 hover:bg-yellow-500/10";
      case "dangerous":
        return "text-red-500 border-red-500 hover:bg-red-500/10";
    }
  };

  return (
    <div className="relative w-full h-full min-h-[600px] bg-[#2c1810]">
      {/* Medieval Map Background */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23d4af37' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Map Title */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
        <h1 className="text-4xl font-bold text-[#d4af37] text-center mb-2 font-medieval">World of D&AI</h1>
        <p className="text-[#d4af37]/80 text-center">Choose your destination</p>
      </div>

      {/* Location Markers */}
      <TooltipProvider>
        {Object.values(locations).map(location => (
          <Tooltip key={location.id}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-3 transition-all duration-200 ${
                  location.enabled
                    ? getDifficultyColor(location.difficulty)
                    : "text-gray-500 border-gray-500 cursor-not-allowed"
                } ${hoveredLocation === location.id ? "scale-110 z-10" : ""}`}
                style={{
                  left: `${location.position.x}%`,
                  top: `${location.position.y}%`,
                }}
                onClick={() => location.enabled && handleLocationClick(location.id)}
                onMouseEnter={() => setHoveredLocation(location.id)}
                onMouseLeave={() => setHoveredLocation(null)}
                disabled={!location.enabled}
              >
                {location.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="p-2">
                <h3 className="font-bold text-sm">{location.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{location.description}</p>
                <p
                  className={`text-xs mt-2 font-semibold ${
                    location.difficulty === "safe"
                      ? "text-green-400"
                      : location.difficulty === "moderate"
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  Difficulty: {location.difficulty.charAt(0).toUpperCase() + location.difficulty.slice(1)}
                </p>
                {!location.enabled && <p className="text-xs mt-2 text-gray-500">Coming soon...</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>

      {/* Legend */}
      <Card className="absolute bottom-4 right-4 p-4 bg-black/80 border-[#d4af37]">
        <h3 className="text-[#d4af37] font-bold mb-2">Legend</h3>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-[#d4af37]">Safe Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-[#d4af37]">Moderate Danger</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-[#d4af37]">High Danger</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
