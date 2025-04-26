'use client';

import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '@/lib/firebase';

interface LeaderboardProps {
  gameId: string;
  currentPlayerName?: string;
}

interface PlayerScore {
  name: string;
  score: number;
}

export default function Leaderboard({ gameId, currentPlayerName }: LeaderboardProps) {
  const [players, setPlayers] = useState<PlayerScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const database = getDatabase(app);
    const playersRef = ref(database, `games/${gameId}/players`);

    const unsubscribe = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to array and sort by score
        const playersArray = Object.entries(data).map(([name, details]: [string, any]) => ({
          name,
          score: details.score || 0
        }));

        // Sort by score (highest first)
        playersArray.sort((a, b) => b.score - a.score);

        setPlayers(playersArray);
        setLoading(false);
      } else {
        setPlayers([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  if (loading) {
    return (
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-bold text-center">Loading leaderboard...</h3>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-3">Leaderboard</h3>
      <div className="bg-gray-50 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-3 text-left">Rank</th>
              <th className="p-3 text-left">Player</th>
              <th className="p-3 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {players.length > 0 ? (
              players.map((player, index) => (
                <tr
                  key={player.name}
                  className={`border-t border-gray-200 ${player.name === currentPlayerName ? 'bg-blue-50' : ''}`}
                >
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3 font-medium">
                    {player.name}
                    {player.name === currentPlayerName && <span className="text-blue-600 ml-1">(You)</span>}
                  </td>
                  <td className="p-3 text-right">{player.score}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  No players yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
