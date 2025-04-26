"use client";

import { useParams } from 'next/navigation';
import { getDatabase, ref, set } from 'firebase/database';
import { app } from '@/lib/firebase';

export default function GamePage() {
  const params = useParams();
  const code = params?.code as string | undefined;

  interface Question {
    text: string;
    options: string[];
    correctAnswer: string;
    timeLimit: number;
  }

  const pushQuestion = (question: Question) => {
    const database = getDatabase(app);
    set(ref(database, `games/${code}/currentQuestion`), question);
  };

  const pushQuestion1 = () => {
    const question = {
      text: 'What is the capital of France?',
      options: ['Paris', 'London', 'Berlin', 'Madrid'],
      correctAnswer: 'Paris',
      timeLimit: 30, // seconds
    };
    pushQuestion(question);
  };

  const pushQuestion2 = () => {
    const question = {
      text: 'Which planet is known as the Red Planet?',
      options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      correctAnswer: 'Mars',
      timeLimit: 20, // seconds
    };
    pushQuestion(question);
  };

  const endGame = () => {
    const database = getDatabase(app);
    set(ref(database, `games/${code}/status`), 'ended');
    set(ref(database, `games/${code}/currentQuestion`), null);
  };

  if (!code) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold mb-8">Invalid Game Code</h1>
        <p className="text-lg">The game code is missing or invalid. Please check the URL and try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Game Code: {code}</h1>
      <p className="text-lg mb-4">Welcome to the game! The host will start the game shortly.</p>
      <div className="flex space-x-4 mb-6">
        <button
          onClick={pushQuestion1}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 cursor-pointer"
        >
          Question 1: France
        </button>
        <button
          onClick={pushQuestion2}
          className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600 cursor-pointer"
        >
          Question 2: Planet
        </button>
      </div>
      <button
        onClick={endGame}
        className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-600 cursor-pointer"
      >
        End Game
      </button>
    </div>
  );
}
