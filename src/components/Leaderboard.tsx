'use client';

import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '@/lib/firebase';
import { Player } from '@/types/types';
import Image from 'next/image';
import { getAvatarPath } from '@/utils/api';

interface LeaderboardProps {
  gameId: string;
  currentPlayerName: string;
}

interface LeaderboardPlayer extends Player {
  score: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ gameId, currentPlayerName }) => {
  const [players, setPlayers] = useState<Array<LeaderboardPlayer>>([]);

  useEffect(() => {
    const database = getDatabase(app);
    const playersRef = ref(database, `games/${gameId}/players`);

    const unsubscribe = onValue(playersRef, (snapshot) => {
      if (snapshot.exists()) {
        const playersData = snapshot.val();
        const playersArray = Object.entries(playersData).map(([name, data]: [string, any]) => ({
          name,
          score: data.score || 0,
          avatar: data.avatar || "0" // Default to first avatar if none exists
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

  // Mobile view - card-based layout
  const renderMobileView = () => (
    <div className="space-y-2 md:hidden">
      {players.map((player, index) => (
        <div 
          key={player.name}
          className={`
            p-3 rounded-lg border border-gray-200 shadow-sm
            ${player.name === currentPlayerName ? 'bg-blue-50 border-blue-200' : 'bg-white'}
          `}
          style={{ opacity: getOpacity(index) }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className={`h-8 w-8 rounded-full flex items-center justify-center ${getPositionStyle(index)} font-bold`}>
                {index + 1}
              </span>
              
              <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-gray-200">
                <Image 
                  src={getAvatarPath(parseInt(player.avatar || "0"))}
                  alt={`${player.name}'s avatar`}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
              
              <span className="font-medium">
                {player.name}
                {player.name === currentPlayerName && <span className="text-blue-600 ml-1">(You)</span>}
              </span>
            </div>
            
            <div className="font-bold text-lg text-gray-800">
              {player.score}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Desktop view - table layout
  const renderDesktopView = () => (
    <div className="hidden md:block overflow-hidden rounded-lg">
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
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full overflow-hidden mr-3 border-2 border-gray-200">
                    <Image 
                      src={getAvatarPath(parseInt(player.avatar || "0"))}
                      alt={`${player.name}'s avatar`}
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                  <span>
                    {player.name}
                    {player.name === currentPlayerName && <span className="text-blue-600 ml-1">(You)</span>}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 text-right font-bold text-gray-800">{player.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
      {renderMobileView()}
      {renderDesktopView()}
    </div>
  );
};

export default Leaderboard;
