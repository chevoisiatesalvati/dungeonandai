"use client";

import { PlayerProfile } from "~~/components/game/PlayerProfile";
import { usePlayerAssets } from "~~/hooks/usePlayerAssets";

// Temporary mock data for non-NFT data - replace with real data from your backend
const mockPlayerData = {
  name: "Adventurer",
  race: "Human",
  gender: "Male",
  age: 25,
  height: "6'0\"",
  avatar: "https://m.media-amazon.com/images/I/61K9FB-yFxL._AC_SL1002_.jpg",
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
  level: 5,
  experience: 750,
};

export default function ProfilePage() {
  const { assets, isLoading, error } = usePlayerAssets();

  return (
    <main className="flex flex-col flex-1 p-4 md:p-8">
      <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto">
        <PlayerProfile {...mockPlayerData} assets={assets} assetError={error} isLoadingAssets={isLoading} />
      </div>
    </main>
  );
}
