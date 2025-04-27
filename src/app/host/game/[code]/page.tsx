"use client";

import { useParams } from 'next/navigation';
import { useState } from 'react';

import AudioRecorder from '@/components/AudioRecorder';
import HostQuestionCard from '@/components/HostQuestionCard';
import { pushQuestion } from '@/utils/api';
import { HostQuestion } from '@/types/types';

export default function GamePage() {
  const params = useParams();
  const code = params?.code as string | undefined;

  const [questions, setQuestions] = useState<HostQuestion[]>([
    {
      text: 'What is the capital of France?',
      options: ['Paris', 'London', 'Berlin', 'Madrid'],
      correctAnswer: 'Paris',
      timeLimit: 30,
    },
    {
      text: 'Which planet is known as the Red Planet?',
      options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      correctAnswer: 'Mars',
      timeLimit: 20,
    },
    {
      text: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      timeLimit: 15,
    },
  ]);

  const handleQuestionSelect = (index: number) => {
    const selectedQuestion = questions[index];
    console.log(`Question selected: ${selectedQuestion.text}`);
    pushQuestion(code, selectedQuestion);
  };

  const endGame = () => {
    const database = getDatabase(app);
    set(ref(database, `games/${code}/status`), 'ended');
    set(ref(database, `games/${code}/currentQuestion`), null);
  };

  const refreshQuestions = async () => {
    if (!code) return;

    try {
      const response = await fetch('/api/generateQuestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId: code }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      if (data.questions) {
        setQuestions((prevQuestions) => [...prevQuestions, ...data.questions]);
      }
    } catch (error) {
      console.error('Error refreshing questions:', error);
    }
  }

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
        onClick={refreshQuestions}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Refresh Questions
      </button>
      <AudioRecorder gameId={code} />
      <div className="mt-8 w-full max-w-2xl h-96 overflow-y-auto border rounded-lg p-4">
        {questions.map((question, index) => (
          <HostQuestionCard
            key={index}
            question={question}
            onSelect={() => handleQuestionSelect(index)}
            optionColors={['#FF5733', '#33FF57', '#3357FF', '#F3FF33']}
          />
        ))}
      </div>
      <button
        onClick={endGame}
        className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-600 cursor-pointer"
      >
        End Game
      </button>
      </div>
    </div>
  );
}
