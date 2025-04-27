"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGame } from "../utils/api";
import { database } from "../lib/firebase";
import { ref, get } from 'firebase/database';

export default function Home() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [gameCode, setGameCode] = useState("");

  const handleCreateGame = async () => {
    setIsCreating(true);
    try {
      const gameId = await createGame('host');
      router.push(`/host/game/${gameId}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!gameCode) {
      alert("Please enter a room code.");
      return;
    }
    const code = gameCode.trim().toUpperCase();

    if (code.length !== 6) {
      alert("Please enter a valid room code.");
      return;
    }
    try {
      const gameRef = ref(database, `games/${code}`);
      const snapshot = await get(gameRef);

      if (!snapshot.exists()) {
        alert('Room lobby does not exist. Please check the room code.');
        return;
      }

      router.push(`/join/${code}`);
    } catch (error) {
      console.error("Failed to join game:", error);
      alert('Failed to join room. Please check your code and try again.');
    }
    setGameCode("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
    <h1 className="text-4xl font-bold mb-12 text-white drop-shadow-md">k-AI-hoot!</h1>
    <div className="flex flex-col items-center w-full max-w-md gap-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
      {/* Join a game section */}
      <div className="flex flex-col gap-4 w-full">
        <h2 className="text-2xl font-semibold text-center text-gray-800">Join a room</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value)}
            placeholder="Enter room code"
            className="flex-1 p-4 text-lg text-gray-600  border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            onKeyDown={(e) => e.key === "Enter" && handleJoinGame()}
          />
          <button
            onClick={handleJoinGame}
            className="w-full sm:w-auto bg-green-500 text-white px-8 py-4 text-lg rounded-lg font-bold hover:bg-green-600 transition-colors"
          >
            Join
          </button>
        </div>
      </div>

      <div className="w-full border-t border-gray-400 my-4"></div>

      {/* Host a game section */}
      <div className="w-full">
        <h2 className="text-2xl font-semibold text-center mb-4 text-gray-800">Create a new room</h2>
        <button
          onClick={handleCreateGame}
          disabled={isCreating}
          className="bg-blue-500 text-white px-8 py-4 text-lg rounded-lg font-bold hover:bg-blue-600 disabled:bg-blue-300 w-full transition-colors"
        >
          {isCreating ? "Creating..." : "Host"}
        </button>
      </div>
    </div>
  </div>
  );
}
