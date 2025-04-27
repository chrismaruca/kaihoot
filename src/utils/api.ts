import { ref, set, onValue, off, get } from 'firebase/database';
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

  // archive previous question and its distribution
  const currentSnap = await get(ref(database, `games/${gameId}/currentQuestion`));
  const oldQuestion = currentSnap.val();
  if (oldQuestion) {
    const ts = oldQuestion.pushedAt || Date.now();
    const distSnap = await get(ref(database, `games/${gameId}/answerDistributions`));
    const distribution = distSnap.val() || {};
    await set(ref(database, `games/${gameId}/archives/${ts}`), { question: oldQuestion, distribution, archivedAt: ts });
  }
  // reset answer distributions for new question
  // Ensure options is an array before reducing
  const options = Array.isArray(question.options) ? question.options : [];
  console.log(`Initializing distributions for ${options.length} options in game ${gameId}`);
  const initialDist = options.reduce((acc, _opt, idx) => {
    console.log(`Setting option ${idx} to 0`);
    return { ...acc, [idx]: 0 };
  }, {} as Record<number, number>);
  await set(ref(database, `games/${gameId}/answerDistributions`), initialDist);

  // Add timestamp to the question
  const questionWithTimestamp = {
    ...question,
    pushedAt: Date.now() // Add current timestamp
  };

  // Sanitize question: remove undefined properties to prevent Firebase errors
  Object.keys(questionWithTimestamp).forEach(key => {
    if (questionWithTimestamp[key] === undefined) {
      delete questionWithTimestamp[key];
    }
  });

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
export const getAvatarPath = (index: number) => `/avatars/avatar${index + 1}.png`;
