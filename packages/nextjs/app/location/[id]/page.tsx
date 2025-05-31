"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { LocationChat } from "../../../components/game/LocationChat";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { ArrowLeft } from "lucide-react";

interface Activity {
  name: string;
  description: string;
  action: string;
}

// This would typically come from a database or API
const locationData: Record<
  string,
  {
    name: string;
    description: string;
    activities: Activity[];
    npcName: string;
  }
> = {
  "town-square": {
    name: "Town Square",
    description: "The bustling center of town. A safe place to meet other adventurers.",
    activities: [
      {
        name: "Chat with NPCs",
        description: "Talk to the townspeople and learn about the world.",
        action: "Greetings! I'd like to chat with the locals.",
      },
      {
        name: "Check Notice Board",
        description: "Look for quests and announcements.",
        action: "I'd like to check the notice board for any quests.",
      },
    ],
    npcName: "Town Crier",
  },
  "mystic-tavern": {
    name: "Mystic Tavern",
    description: "A cozy tavern where adventurers share tales and receive quests.",
    activities: [
      {
        name: "Order a Drink",
        description: "Rest and recover while enjoying a refreshing beverage.",
        action: "I would like to order a drink, good barkeep.",
      },
      {
        name: "Listen to Tales",
        description: "Hear stories from other adventurers and learn about hidden treasures.",
        action: "I'd like to hear some tales from your patrons.",
      },
    ],
    npcName: "Tavern Keeper",
  },
  "dark-forest": {
    name: "Dark Forest",
    description: "A dangerous forest filled with monsters and treasures.",
    activities: [
      {
        name: "Explore the Woods",
        description: "Venture into the depths of the forest.",
        action: "I wish to explore these woods. What should I be wary of?",
      },
      {
        name: "Hunt for Treasure",
        description: "Search for hidden treasures and artifacts.",
        action: "I've heard there are treasures hidden in these woods. Can you tell me more?",
      },
    ],
    npcName: "Forest Guide",
  },
  // Add more locations as needed
};

export default function LocationPage() {
  const params = useParams();
  const locationId = params.id as string;
  const location = locationData[locationId as keyof typeof locationData];

  if (!location) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="p-8">
          <h1 className="text-2xl font-bold mb-4">Location Not Found</h1>
          <p className="mb-4">This location doesn&apos;t exist in our world.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Map
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <main className="flex flex-col flex-1 p-4 md:p-8">
      <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto">
        <Link href="/" className="inline-block mb-4">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Map
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
          {/* Chat Section - Takes 3/4 of the space */}
          <div className="lg:col-span-3 min-h-0">
            <LocationChat locationId={locationId} npcName={location.npcName} />
          </div>

          {/* Actions Panel - Takes 1/4 of the space */}
          <Card className="p-6 bg-[#2c1810] border-[#d4af37] min-h-0 overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-4 text-[#d4af37]">Available Actions</h2>
            <div className="space-y-4">
              {location.activities.map((activity, index) => (
                <Card key={index} className="p-4 bg-[#1a0f0a] border-[#d4af37]/30">
                  <h3 className="text-xl font-semibold mb-2 text-[#d4af37]">{activity.name}</h3>
                  <p className="text-[#d4af37]/80 mb-4">{activity.description.replace("'", "&apos;")}</p>
                  <Button
                    className="w-full bg-[#d4af37] text-[#2c1810] hover:bg-[#d4af37]/90"
                    onClick={() => {
                      // This will be handled by the chat component
                      const event = new CustomEvent("location-action", {
                        detail: { action: activity.action },
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    {activity.name}
                  </Button>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
