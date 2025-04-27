import { ref, set, onValue, off } from 'firebase/database';
import { HostQuestion } from '@/types/types';
import { database } from '../lib/firebase';

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
    status: 'running',
    currentQuestion: null,
    players: {},
  });
  return gameId;
};

export const joinGame = async (gameId: string, playerName: string, selectedAvatar: string): Promise<void> => {
  const playerRef = ref(database, `games/${gameId}/players/${playerName}`);
  await set(playerRef, { name: playerName, score: 0, avatar: selectedAvatar });
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

export const pushQuestion = async (gameId: string, question: any) => {
  if (!gameId) {
    throw new Error('Game ID is required');
  }

  // Add timestamp to the question
  const questionWithTimestamp = {
    ...question,
    pushedAt: Date.now() // Add current timestamp
  };

  await set(ref(database, `games/${gameId}/currentQuestion`), questionWithTimestamp);
  await set(ref(database, `games/${gameId}/status`), 'active');

  // Calculate and set the timer with end time based on question's time limit
  const startTime = Date.now();
  const endTime = startTime + (question.timeLimit * 1000); // Convert to milliseconds

  await set(ref(database, `games/${gameId}/timer`), {
    startTime,
    endTime
  });

  return questionWithTimestamp;
};

// Define avatar paths based on index
export const getAvatarPath = (index: number) => `https://i.pravatar.cc/150?img=${index + 18}`;
