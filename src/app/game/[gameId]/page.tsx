'use client';

import { useEffect, useState } from 'react';
import QuestionCard from '@/components/QuestionCard';
import Timer from '@/components/Timer';

interface GamePageProps {
  params: {
    gameId: string;
  };
}

export default function GamePage({ params }: GamePageProps) {
  const [currentQuestion, setCurrentQuestion] = useState({
    text: 'Sample Question',
    options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
    timeLimit: 20
  });

  const handleAnswer = (index: number) => {
    console.log('Selected answer:', index);
  };

  const handleTimeUp = () => {
    console.log('Time is up!');
  };

  return (
    <div className="container mx-auto p-8">
      <Timer duration={currentQuestion.timeLimit} onTimeUp={handleTimeUp} />
      <div className="mt-8">
        <QuestionCard
          question={currentQuestion.text}
          options={currentQuestion.options}
          timeLimit={currentQuestion.timeLimit}
          onAnswer={handleAnswer}
        />
      </div>
    </div>
  );
}
