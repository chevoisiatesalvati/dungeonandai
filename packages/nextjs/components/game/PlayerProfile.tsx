"use client";

import React from "react";
import Image from "next/image";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Backpack, BookOpen, Brain, Footprints, Heart, Shield, Sword, User, Zap } from "lucide-react";

interface PlayerStats {
  strength: number;
  intelligence: number;
  dexterity: number;
  constitution: number;
  wisdom: number;
  charisma: number;
}

interface PlayerSkill {
  name: string;
  level: number;
  experience: number;
  category: "combat" | "magic" | "crafting" | "social";
}

interface PlayerAsset {
  id: string;
  name: string;
  type: "weapon" | "armor" | "consumable" | "quest" | "currency";
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  image: string;
  description: string;
  tokenId?: string; // Hedera token ID
}

export interface PlayerProfileProps {
  name: string;
  race: string;
  gender: string;
  age: number;
  height: string;
  avatar: string;
  stats: PlayerStats;
  skills: PlayerSkill[];
  assets: PlayerAsset[];
  level: number;
  experience: number;
  assetError?: string | null;
  isLoadingAssets?: boolean;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({
  name,
  race,
  gender,
  age,
  height,
  avatar,
  stats,
  skills,
  assets,
  level,
  experience,
  assetError,
  isLoadingAssets,
}) => {
  const getRarityColor = (rarity: PlayerAsset["rarity"]) => {
    switch (rarity) {
      case "common":
        return "text-gray-400";
      case "uncommon":
        return "text-green-400";
      case "rare":
        return "text-blue-400";
      case "epic":
        return "text-purple-400";
      case "legendary":
        return "text-yellow-400";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card className="bg-[#2c1810] border-[#d4af37]/20 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column - Avatar and Basic Info */}
          <div className="w-full md:w-1/3">
            <div className="relative">
              <Image
                src={avatar}
                alt={`${name}'s avatar`}
                width={400}
                height={400}
                className="w-full aspect-square rounded-lg object-cover border-2 border-[#d4af37]/20"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 rounded-b-lg">
                <h2 className="text-[#d4af37] text-xl font-bold text-center">{name}</h2>
                <p className="text-[#d4af37]/80 text-sm text-center">
                  Level {level} {race}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-[#d4af37]">
                <span>Gender:</span>
                <span>{gender}</span>
              </div>
              <div className="flex justify-between text-[#d4af37]">
                <span>Age:</span>
                <span>{age}</span>
              </div>
              <div className="flex justify-between text-[#d4af37]">
                <span>Height:</span>
                <span>{height}</span>
              </div>
            </div>

            {/* Experience Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[#d4af37] text-sm mb-1">
                <span>Experience</span>
                <span>{experience} / 1000</span>
              </div>
              <div className="w-full h-2 bg-[#d4af37]/20 rounded-full">
                <div className="h-full bg-[#d4af37] rounded-full" style={{ width: `${(experience / 1000) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Right Column - Stats, Skills, and Inventory */}
          <div className="w-full md:w-2/3">
            <Tabs defaultValue="character" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-[#2c1810] border border-[#d4af37]/20">
                <TabsTrigger
                  value="character"
                  className="text-[#d4af37] data-[state=active]:bg-[#d4af37]/20 data-[state=active]:text-white hover:bg-[#d4af37]/10 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 mr-2" />
                  Character
                </TabsTrigger>
                <TabsTrigger
                  value="skills"
                  className="text-[#d4af37] data-[state=active]:bg-[#d4af37]/20 data-[state=active]:text-white hover:bg-[#d4af37]/10 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Skills
                </TabsTrigger>
                <TabsTrigger
                  value="inventory"
                  className="text-[#d4af37] data-[state=active]:bg-[#d4af37]/20 data-[state=active]:text-white hover:bg-[#d4af37]/10 transition-colors cursor-pointer"
                >
                  <Backpack className="w-4 h-4 mr-2" />
                  Inventory
                </TabsTrigger>
              </TabsList>

              {/* Character Stats Tab */}
              <TabsContent value="character" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-[#d4af37]">
                    <Sword className="w-5 h-5" />
                    <span>Strength:</span>
                    <span className="ml-auto">{stats.strength}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#d4af37]">
                    <Brain className="w-5 h-5" />
                    <span>Intelligence:</span>
                    <span className="ml-auto">{stats.intelligence}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#d4af37]">
                    <Zap className="w-5 h-5" />
                    <span>Dexterity:</span>
                    <span className="ml-auto">{stats.dexterity}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#d4af37]">
                    <Heart className="w-5 h-5" />
                    <span>Constitution:</span>
                    <span className="ml-auto">{stats.constitution}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#d4af37]">
                    <Shield className="w-5 h-5" />
                    <span>Wisdom:</span>
                    <span className="ml-auto">{stats.wisdom}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#d4af37]">
                    <Footprints className="w-5 h-5" />
                    <span>Charisma:</span>
                    <span className="ml-auto">{stats.charisma}</span>
                  </div>
                </div>
              </TabsContent>

              {/* Skills Tab */}
              <TabsContent value="skills" className="mt-4">
                <div className="grid grid-cols-1 gap-2">
                  {skills.map((skill, index) => (
                    <div key={index} className="bg-black/20 p-3 rounded-lg">
                      <div className="flex justify-between items-center text-[#d4af37]">
                        <span className="font-semibold">{skill.name}</span>
                        <span>Level {skill.level}</span>
                      </div>
                      <div className="mt-1">
                        <div className="flex justify-between text-[#d4af37]/80 text-sm mb-1">
                          <span>Experience</span>
                          <span>{skill.experience} / 1000</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#d4af37]/20 rounded-full">
                          <div
                            className="h-full bg-[#d4af37] rounded-full"
                            style={{ width: `${(skill.experience / 1000) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isLoadingAssets ? (
                    <div className="col-span-full text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d4af37] mx-auto"></div>
                      <p className="mt-2 text-gray-400">Loading assets...</p>
                    </div>
                  ) : assetError ? (
                    <div className="col-span-full text-center py-8">
                      <p className="text-red-500">{assetError}</p>
                    </div>
                  ) : assets.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-400">No assets found</p>
                    </div>
                  ) : (
                    assets.map(asset => (
                      <div
                        key={asset.id}
                        className="bg-black/20 p-3 rounded-lg border border-[#d4af37]/20 hover:border-[#d4af37]/40 transition-colors"
                      >
                        <Image
                          src={asset.image}
                          alt={asset.name}
                          width={300}
                          height={300}
                          className="w-full aspect-square object-cover rounded-lg mb-2"
                        />
                        <h3 className={`font-semibold ${getRarityColor(asset.rarity)}`}>{asset.name}</h3>
                        <p className="text-[#d4af37]/80 text-sm mt-1">{asset.description}</p>
                        {asset.tokenId && <p className="text-[#d4af37]/60 text-xs mt-2">Token ID: {asset.tokenId}</p>}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Card>
    </div>
  );
};
