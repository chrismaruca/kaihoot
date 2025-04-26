'use client';

import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '@/lib/firebase';

interface LeaderboardProps {
  gameId: string;
  currentPlayerName: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ gameId, currentPlayerName }) => {
  const [players, setPlayers] = useState<Array<{ name: string; score: number }>>([]);

  useEffect(() => {
    const database = getDatabase(app);
    const playersRef = ref(database, `games/${gameId}/players`);

    const unsubscribe = onValue(playersRef, (snapshot) => {
      if (snapshot.exists()) {
        const playersData = snapshot.val();
        const playersArray = Object.entries(playersData).map(([name, data]: [string, any]) => ({
          name,
          score: data.score || 0
        }));

        // Sort players by score (highest first)
        playersArray.sort((a, b) => b.score - a.score);
        setPlayers(playersArray);
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  const getPositionStyle = (index: number) => {
    if (index === 0) return 'bg-yellow-400 text-gray-800';
    if (index === 1) return 'bg-gray-300 text-gray-800';
    if (index === 2) return 'bg-amber-700 text-white';
    return 'bg-white text-gray-800';
  };

  const getOpacity = (index: number) => {
    const maxOpacity = 1;
    const minOpacity = 0.7;

    // Fix: Handle edge cases to prevent NaN
    if (players.length <= 1) {
      return maxOpacity;
    }

    const opacityStep = (maxOpacity - minOpacity) / Math.max(1, players.length - 1);
    return Math.max(minOpacity, maxOpacity - (index * opacityStep));
  };

  if (players.length === 0) {
    return <div className="text-center p-4 text-gray-500">No players have joined yet...</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg">
      <table className="w-full">
        <thead>
          <tr className="bg-blue-600 text-white">
            <th className="py-3 px-4 text-left">Rank</th>
            <th className="py-3 px-4 text-left">Player</th>
            <th className="py-3 px-4 text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr
              key={player.name}
              className={`
                border-b border-gray-200
                ${player.name === currentPlayerName ? 'bg-blue-50 font-semibold' : ''}
                transition-all hover:bg-gray-100
              `}
              style={{ opacity: getOpacity(index) }}
            >
              <td className="py-3 px-4 text-left">
                <div className="flex items-center">
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ${getPositionStyle(index)} font-bold mr-2`}>
                    {index + 1}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 text-left text-gray-800">
                {player.name}
                {player.name === currentPlayerName && <span className="text-blue-600 ml-1">(You)</span>}
              </td>
              <td className="py-3 px-4 text-right font-bold text-gray-800">{player.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
