"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinGame } from '../../utils/api';
import { database } from '../../lib/firebase';
import { ref, get } from 'firebase/database';

export default function JoinPage() {
  const [gameCode, setGameCode] = useState('');
  const [nickname, setNickname] = useState('');
  const router = useRouter();

  const handleJoinGame = async () => {
    if (!gameCode || !nickname) {
      alert('Please enter both game code and nickname.');
      return;
    }

    try {
      const gameRef = ref(database, `games/${gameCode}`);
      const snapshot = await get(gameRef);

      if (!snapshot.exists()) {
        alert('Game lobby does not exist. Please check the game code.');
        return;
      }

      await joinGame(gameCode, nickname);
      router.push(`/game/${gameCode}?player=${nickname}`);
    } catch (error) {
      console.error('Failed to join game:', error);
      alert('Failed to join game. Please try again later.');
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Join a Game</h1>
      <div className="max-w-md mx-auto space-y-4">
        <input
          type="text"
          placeholder="Enter game code"
          className="w-full p-3 border rounded-lg"
          value={gameCode}
          onChange={(e) => setGameCode(e.target.value)}
        />
        <input
          type="text"
          placeholder="Your nickname"
          className="w-full p-3 border rounded-lg"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <button
          onClick={handleJoinGame}
          className="w-full bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600"
        >
          Join Game
        </button>
      </div>
    </div>
  );
}
