'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import QuestionCard from '@/components/QuestionCard';
import Timer from '@/components/Timer';
import { getDatabase, ref, onValue, set, get } from 'firebase/database';
import { app } from '@/lib/firebase';
import { useSearchParams } from 'next/navigation';

interface GamePageProps {
  params: {
    gameId: string;
  };
}

export default function GamePage({ params }: GamePageProps) {
  const { gameId } = use(params);
  const searchParams = useSearchParams();
  const playerName = searchParams.get('player') || 'anonymous';

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timerKey, setTimerKey] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const database = getDatabase(app);
    const questionRef = ref(database, `games/${gameId}/currentQuestion`);
    const scoreRef = ref(database, `games/${gameId}/players/${playerName}/score`);

    // Get initial score
    get(scoreRef).then((snapshot) => {
      if (snapshot.exists()) {
        setScore(snapshot.val() || 0);
      }
    });

    const unsubscribe = onValue(questionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentQuestion(data);
        setTimerKey(prevKey => prevKey + 1);
        setTimeUp(false);
        setAnswerSubmitted(false);
        setAnswerCorrect(null);
      }
    });

    return () => unsubscribe();
  }, [gameId, playerName]);

  const handleAnswer = (index: number) => {
    if (currentQuestion && !answerSubmitted && !timeUp) {
      const isCorrect =
        (typeof currentQuestion.correctAnswer === 'number' && currentQuestion.correctAnswer === index) ||
        (typeof currentQuestion.correctAnswer === 'string' && currentQuestion.correctAnswer === currentQuestion.options[index]);

      setAnswerCorrect(isCorrect);
      setAnswerSubmitted(true);

      // Update score in Firebase if answer is correct
      if (isCorrect) {
        const database = getDatabase(app);
        const scoreRef = ref(database, `games/${gameId}/players/${playerName}/score`);

        get(scoreRef).then((snapshot) => {
          const currentScore = (snapshot.exists() ? snapshot.val() : 0) || 0;
          const newScore = currentScore + 1;
          set(scoreRef, newScore);
          setScore(newScore);
        });
      }
    }
  };

  const handleTimeUp = () => {
    console.log('Time is up!');
    setTimeUp(true);
  };

  // Render feedback component based on answer correctness
  const renderFeedback = () => {
    if (answerSubmitted) {
      return (
        <div className={`mt-8 p-6 rounded-lg text-center ${answerCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
          <h3 className={`text-xl font-bold ${answerCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {answerCorrect ? 'Correct!' : 'Incorrect!'}
          </h3>
          <p className="text-gray-600 mt-2">
            {answerCorrect
              ? `Great job! Your score is now ${score}.`
              : `The correct answer was: ${currentQuestion.correctAnswer}`}
          </p>
          <p className="text-gray-600 mt-2">Waiting for the next question...</p>
        </div>
      );
    } else if (timeUp) {
      return (
        <div className="mt-8 p-6 bg-gray-100 rounded-lg text-center">
          <h3 className="text-xl font-bold text-gray-700">Time's up!</h3>
          <p className="text-gray-600 mt-2">The correct answer was: {currentQuestion.correctAnswer}</p>
          <p className="text-gray-600 mt-2">Waiting for the next question...</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto p-8">
      <div className="text-right mb-4">
        <span className="font-bold">Score: {score}</span>
      </div>

      {currentQuestion ? (
        <>
          {/* Only show Timer when there's a question and it hasn't been answered yet */}
          {!answerSubmitted && !timeUp && (
            <Timer
              key={timerKey}
              duration={currentQuestion.timeLimit}
              onTimeUp={handleTimeUp}
            />
          )}

          {!timeUp && !answerSubmitted ? (
            <div className="mt-8">
              <QuestionCard
                question={currentQuestion.text}
                options={currentQuestion.options}
                timeLimit={currentQuestion.timeLimit}
                onAnswer={handleAnswer}
              />
            </div>
          ) : (
            renderFeedback()
          )}
        </>
      ) : (
        <p className="text-gray-500">Waiting for the next question...</p>
      )}
    </div>
  );
}
