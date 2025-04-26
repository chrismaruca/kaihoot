'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import QuestionCard from '@/components/QuestionCard';
import Timer from '@/components/Timer';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '@/lib/firebase';

interface GamePageProps {
  params: {
    gameId: string;
  };
}

export default function GamePage({ params }: GamePageProps) {
  const { gameId } = use(params);

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timerKey, setTimerKey] = useState(0); // Add a key state to reset timer

  useEffect(() => {
    const database = getDatabase(app);
    const questionRef = ref(database, `games/${gameId}/currentQuestion`);

    const unsubscribe = onValue(questionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentQuestion(data);
        setTimerKey(prevKey => prevKey + 1); // Increment timer key when question changes
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  const handleAnswer = (index: number) => {
    console.log('Selected answer:', index);
  };

  const handleTimeUp = () => {
    console.log('Time is up!');
  };

  return (
    <div className="container mx-auto p-8">
      {currentQuestion ? (
        <>
          <Timer
            key={timerKey}
            duration={currentQuestion.timeLimit}
            onTimeUp={handleTimeUp}
          />
          <div className="mt-8">
            <QuestionCard
              question={currentQuestion.text}
              options={currentQuestion.options}
              timeLimit={currentQuestion.timeLimit}
              onAnswer={handleAnswer}
            />
          </div>
        </>
      ) : (
        <p className="text-gray-500">Waiting for the next question...</p>
      )}
    </div>
  );
}
