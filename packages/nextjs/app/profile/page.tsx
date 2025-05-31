"use client";

import { PlayerProfile } from "~~/components/game/PlayerProfile";

// Temporary mock data - replace with real data from your backend/blockchain
const mockPlayerData = {
  name: "Adventurer",
  race: "Human",
  gender: "Male",
  age: 25,
  height: "6'0\"",
  avatar: "https://placehold.co/400x400/2c1810/d4af37?text=Avatar",
  stats: {
    strength: 10,
    intelligence: 8,
    dexterity: 12,
    constitution: 9,
    wisdom: 7,
    charisma: 11,
  },
  skills: [
    { name: "Sword Fighting", level: 3, experience: 450, category: "combat" as const },
    { name: "Archery", level: 2, experience: 200, category: "combat" as const },
    { name: "Alchemy", level: 1, experience: 50, category: "crafting" as const },
  ],
  assets: [
    {
      id: "1",
      name: "Steel Sword",
      type: "weapon" as const,
      rarity: "uncommon" as const,
      image: "https://placehold.co/200x200/2c1810/d4af37?text=Sword",
      description: "A well-crafted steel sword",
      tokenId: "0.0.123456",
    },
    {
      id: "2",
      name: "Leather Armor",
      type: "armor" as const,
      rarity: "common" as const,
      image: "https://placehold.co/200x200/2c1810/d4af37?text=Armor",
      description: "Basic leather protection",
      tokenId: "0.0.123457",
    },
    {
      id: "3",
      name: "Health Potion",
      type: "consumable" as const,
      rarity: "common" as const,
      image: "https://placehold.co/200x200/2c1810/d4af37?text=Potion",
      description: "Restores 50 health points",
      tokenId: "0.0.123458",
    },
  ],
  level: 5,
  experience: 750,
};

export default function ProfilePage() {
  return (
    <main className="flex flex-col flex-1 p-4 md:p-8">
      <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto">
        <PlayerProfile {...mockPlayerData} />
      </div>
    </main>
  );
}
