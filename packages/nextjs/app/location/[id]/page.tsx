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
  "mystic-tavern": {
    name: "Mystic Tavern",
    description: "A cozy tavern where adventurers share tales and receive quests.",
    activities: [
      {
        name: "Enter",
        description: "Enter the tavern",
        action: "Entering the tavern...",
      },
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
      {
        name: "Talk to the Barkeep",
        description: "Talk to the barkeep and learn about the tavern.",
        action: "I'd like to talk to the barkeep.",
      },
    ],
    npcName: "Tavern Keeper",
  },
  "dark-forest": {
    name: "Dark Forest",
    description: "A dangerous forest filled with monsters and treasures.",
    activities: [
      {
        name: "Enter",
        description: "Enter the Dark Forest",
        action: "Entering the Dark Forest...",
      },
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
      {
        name: "Talk to the Forest Guide",
        description: "Talk to the forest guide and learn about the forest.",
        action: "I'd like to talk to the forest guide.",
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
          <Button variant="outline" className="cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Map
          </Button>
        </Link>

        <div className="flex-1 min-h-0">
          <LocationChat locationId={locationId} npcName={location.npcName} activities={location.activities} />
        </div>
      </div>
    </main>
  );
}
