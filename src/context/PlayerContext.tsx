'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Player } from '@/types/types';

type PlayerContextType = {
  player: Player;
  setPlayer: (player: Player) => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player>({
    name: 'anonymous',
    avatar: undefined
  });

  useEffect(() => {
    const storedPlayer = localStorage.getItem('player');
    if (storedPlayer) {
      setPlayer(JSON.parse(storedPlayer));
    }
  }, []);

  // Custom setter that updates both state and localStorage
  const handleSetPlayer = (player: Player) => {
    setPlayer(player);
    localStorage.setItem('player', JSON.stringify(player));
  };

  return (
    <PlayerContext.Provider value={{
        player,
        setPlayer: handleSetPlayer
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}