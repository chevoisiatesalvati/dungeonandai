"use client";

import { WorldMap } from "../components/game/WorldMap";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24">
      <WorldMap />
    </main>
  );
}
