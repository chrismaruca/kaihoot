"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createGame } from "../utils/api";

export default function Home() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateGame = async () => {
    setIsCreating(true);
    try {
      const gameId = await createGame('host');
      router.push(`/host/game/${gameId}`);
    } catch (error) {
      console.error("Failed to create game:", error);
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">k-AI-hoot!</h1>
      <div className="flex gap-4">
        <button
          onClick={handleCreateGame}
          disabled={isCreating}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isCreating ? "Creating..." : "Host a Game"}
        </button>
        <Link
          href="/join"
          className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600"
        >
          Join a Game
        </Link>
      </div>
    </div>
  );
}
