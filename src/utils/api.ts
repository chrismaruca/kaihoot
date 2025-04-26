import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, off } from 'firebase/database';
import { app } from '../lib/firebase'; // Import the initialized Firebase app

// Remove the duplicate Firebase configuration and initialization
const database = getDatabase(app);

export interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

export interface Game {
  id: string;
  hostId: string;
  status: 'waiting' | 'active' | 'completed';
  players: Record<string, { name: string; score: number }>;
  currentQuestion?: Question;
}

export const createGame = async (hostId: string): Promise<string> => {
  const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
  await set(ref(database, `games/${gameId}`), {
    hostId,
    players: {},
  });
  return gameId;
};

export const joinGame = async (gameId: string, playerName: string): Promise<void> => {
  const playerRef = ref(database, `games/${gameId}/players/${playerName}`);
  await set(playerRef, { name: playerName, score: 0 });
};

export const subscribeToGame = (gameId: string, callback: (game: Game) => void) => {
  const gameRef = ref(database, `games/${gameId}`);
  onValue(gameRef, (snapshot) => {
    callback(snapshot.val() as Game);
  });
  return () => off(gameRef);
};

export const submitAnswer = async (gameId: string, playerName: string, answer: number): Promise<void> => {
  // TODO: Implement answer submission logic
};

export const startGame = async (gameId: string): Promise<void> => {
  await set(ref(database, `games/${gameId}/status`), 'active');
};
