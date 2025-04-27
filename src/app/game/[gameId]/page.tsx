'use client';

import { use, useEffect, useState } from 'react';
import QuestionCard from '@/components/QuestionCard';
import Timer from '@/components/Timer';
import Leaderboard from '@/components/Leaderboard';
import PodiumView from '@/components/PodiumView';
import { ref, onValue, set, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { HostQuestion } from '@/types/types';
import { GamePageProps } from '@/types/types';
import { usePlayer } from '@/context/PlayerContext';

export default function GamePage({params}: GamePageProps) {
  // @ts-ignore
  const {gameId} = use(params);
  const { 
    player: {
      name: playerName,
      avatar: playerAvatar
    } 
  } = usePlayer();
  
  const [currentQuestion, setCurrentQuestion] = useState<HostQuestion | null>(null);
  const [timerKey, setTimerKey] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState<string>('active');
  const [players, setPlayers] = useState<Array<{name: string, score: number}>>([]);
  const [joinedLate, setJoinedLate] = useState(false);

  useEffect(() => {
    const questionRef = ref(database, `games/${gameId}/currentQuestion`);
    const scoreRef = ref(database, `games/${gameId}/players/${playerName}/score`);
    const statusRef = ref(database, `games/${gameId}/status`);
    const playersRef = ref(database, `games/${gameId}/players`);
    const playerRef = ref(database, `games/${gameId}/players/${playerName}/joinedAt`);
    
    get(playerRef).then((snapshot) => {
      const playerJoinTime = snapshot.exists() ? snapshot.val() : Date.now();
      
      // Check if question already exists when player joins
      get(questionRef).then((snapshot) => {
        if (snapshot.exists()) {
          const question = snapshot.val();
          if (question && question.pushedAt) {
            // If player joined after question was pushed, mark them as late
            setJoinedLate(playerJoinTime > question.pushedAt);
          }
        }
      });
    });

    // Get initial score
    get(scoreRef).then((snapshot) => {
      if (snapshot.exists()) {
        setScore(snapshot.val() || 0);
      }
    });

    // Listen for game status changes
    const statusUnsubscribe = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        setGameStatus(snapshot.val());
      }
    });

    const questionUnsubscribe = onValue(questionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentQuestion(data);
        setTimerKey(prevKey => prevKey + 1);
        setTimeUp(false);
        setAnswerSubmitted(false);
        setAnswerCorrect(null);
        setJoinedLate(false);
      }
    });

    // Listen for players and their scores
    const playersUnsubscribe = onValue(playersRef, (snapshot) => {
      if (snapshot.exists()) {
        const playersData = snapshot.val();
        const playersArray = Object.entries(playersData).map(([name, data]: [string, any]) => ({
          name,
          score: data.score || 0
        }));
        setPlayers(playersArray);
      }
    });

    return () => {
      questionUnsubscribe();
      statusUnsubscribe();
      playersUnsubscribe();
    };
  }, [gameId, playerName]);

  const handleAnswer = (index: number) => {
    console.log(playerName)
    if (currentQuestion && !answerSubmitted && !timeUp) {
      const isCorrect = currentQuestion.correctAnswer === currentQuestion.options[index];

      // Get the current timestamp
      const now = Date.now();
    
      // Get the timestamp when the question was pushed (from the question data)
      const questionTimestamp = currentQuestion.pushedAt || 0;
      const timeLimit = currentQuestion.timeLimit * 1000; // Convert to milliseconds
      
      // Check if the answer is within the time limit
      if (now - questionTimestamp > timeLimit) {
        setTimeUp(true);
        return;
      }

      setAnswerCorrect(isCorrect);
      setAnswerSubmitted(true);

      // Update score in Firebase if answer is correct
      if (isCorrect) {
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
    if (!currentQuestion) return null;

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
        <span className="font-bold text-lg py-3 px-6 bg-gray-100 rounded-full shadow-lg inline-block">Score: <span className="text-blue-600">{score}</span></span>
      </div>

      {gameStatus === 'ended' ? (
        <div className="mt-8 p-8 bg-gradient-to-b from-purple-600 to-purple-800 rounded-lg text-center shadow-lg text-white transition-all">
          <h3 className="text-3xl font-bold mb-4">Lesson over!</h3>
          <p className="text-xl mb-2">Thank you for playing!</p>
          <p className="text-2xl mb-6">Your final score: <span className="font-bold">{score}</span></p>

          <div className="p-4 bg-white rounded-lg mb-8">
            <PodiumView players={players} />
          </div>

          <div className="mt-6 bg-white rounded-lg p-6 shadow-lg">
            <h4 className="text-2xl font-bold text-gray-900 mb-4">Final Leaderboard</h4>
            <Leaderboard gameId={gameId} currentPlayerName={playerName} />
          </div>
        </div>
      ) : currentQuestion ? (
        <>
          {!timeUp && !answerSubmitted && !joinedLate ? (
            <div className="mt-6 transition-all transform hover:scale-105">
                <div className="flex justify-center">
                <Timer
                  key={timerKey}
                  duration={currentQuestion.timeLimit}
                  onTimeUp={handleTimeUp}
                />
              </div>
              <QuestionCard
                question={currentQuestion}
                onAnswer={handleAnswer}
                optionColors={['#e21b3c', '#1368ce', '#26890c', '#ffa602']}
              />
          </div>
        ) : (
            <div className="transition-all transform animate-fade-in">
              {renderFeedback()}
            </div>
          )}
        </>
      ) : (
        <div className="mt-8 p-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-lg text-center shadow-lg text-white">
          <h3 className="text-2xl font-bold mb-3">Waiting for the host</h3>
          <p className="text-lg mt-2 opacity-90">The next question will appear here soon...</p>
          <div className="mt-4 flex justify-center space-y-2 flex-col items-center">
            <div className="h-2.5 w-24 bg-blue-100 opacity-50 rounded-full animate-pulse"></div>
            <div className="h-2.5 w-28 bg-blue-100 opacity-50 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {gameStatus !== 'ended' && (
        <div className="mt-8 p-4 bg-white rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-3 text-gray-700">Current Standings</h3>
          <Leaderboard gameId={gameId} currentPlayerName={playerName} />
        </div>
      )}
    </div>
  );
}
