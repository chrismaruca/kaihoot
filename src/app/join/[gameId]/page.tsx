"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { joinGame } from '../../../utils/api';
import { database } from '../../../lib/firebase';
import { ref, get } from 'firebase/database';
import { usePlayer } from '@/context/PlayerContext';
import Image from 'next/image';
import { getAvatarPath } from '@/utils/api';

export default function JoinPage() {
  // @ts-ignore
  const { gameId } = useParams();
  const router = useRouter();

  console.log("Game ID from params:", gameId);

  const { player, setPlayer } = usePlayer();

  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize values after mount to avoid hydration mismatch
  useEffect(() => {
    // Set initial name from player context
    setName(player.name !== 'anonymous' ? player.name : '');
    
    // Initialize avatar - either from context or pick a default (0)
    if (player.avatar) {
      const parsedAvatar = parseInt(player.avatar);
      setSelectedAvatar(isNaN(parsedAvatar) ? 0 : parsedAvatar);
    } else {
      // Using a fixed initial value instead of random to avoid hydration mismatch
      setSelectedAvatar(0); 
    }
    
    setIsInitialized(true);
  }, [player]);

  // Separate effect to randomize avatar after initial hydration
  useEffect(() => {
    if (isInitialized && !player.avatar) {
      // Now it's safe to set a random avatar (after hydration)
      setSelectedAvatar(Math.floor(Math.random() * 6));
    }
  }, [isInitialized, player.avatar]);

  // Debug function to check state changes
  useEffect(() => {
    console.log("Selected avatar changed to:", selectedAvatar);
  }, [selectedAvatar]);

  useEffect(() => {
    if (!gameId) {
      alert('Invalid game ID. Please check the URL.');
      router.push('/');
    }
  }, [gameId, router]);

  const handleJoinGame = async () => {
    if (!name) {
      alert('Please enter a name.');
      return;
    }

    try {
      const gameRef = ref(database, `games/${gameId}`);
      const snapshot = await get(gameRef);

      if (!snapshot.exists()) {
        alert('Game lobby does not exist. Please check the game code.');
        return;
      }

      setPlayer({
        name,
        avatar: selectedAvatar.toString(),
      });
      await joinGame(gameId, name, selectedAvatar.toString());
      router.push(`/game/${gameId}`);
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Failed to join room. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-12 text-white drop-shadow-md">Join a room</h1>

      <div className="flex flex-col items-center w-full max-w-md gap-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 max-w-md mx-auto space-y-4">
        {/* <h2 className="text-2xl font-semibold text-center text-gray-800">Your name</h2> */}
        <input
          type="text"
          placeholder="Your name"
          className="flex-1 p-2 text-lg text-gray-600 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* <div className="w-full border-t border-gray-400 my-4"></div> */}

        <div>
        {/* <h2 className="text-2xl font-semibold text-center mb-4 text-gray-800">Your avatar</h2> */}
          <div className="grid grid-cols-3 gap-4">
            {/* Create 6 avatar options (indexes 0-5) */}
            {Array.from({ length: 6 }).map((_, index) => (
              <div 
                key={index}
                className={`cursor-pointer relative rounded-full overflow-hidden transition-all
                  ${selectedAvatar === index ? 'ring-4 ring-green-500 scale-105' : 'hover:scale-105'}`}
                onClick={() => setSelectedAvatar(index)}
              >
                <div className="aspect-square relative">
                  <Image
                    src={getAvatarPath(index)}
                    alt={`Avatar ${index + 1}`}
                    width={150}
                    height={150}
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>


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
