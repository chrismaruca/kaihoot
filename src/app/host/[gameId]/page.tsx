'use client';

import { useState } from 'react';
import PlayerList from '@/components/PlayerList';

interface HostGamePageProps {
  params: {
    gameId: string;
  };
}

export default function HostGamePage({ params }: HostGamePageProps) {
  const [players, setPlayers] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'waiting' | 'active' | 'completed'>('waiting');

  const startGame = () => {
    setGameState('active');
    // TODO: Implement game start logic
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Game Room: {params.gameId}</h1>
        {gameState === 'waiting' && (
          <button
            onClick={startGame}
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600"
            disabled={players.length === 0}
          >
            Start Game
          </button>
        )}
      </div>
      <PlayerList players={players} />
    </div>
  );
}
