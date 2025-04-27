'use client';

import { use, useEffect, useState, useRef } from 'react';
import QuestionCard from '@/components/QuestionCard';
import Timer from '@/components/Timer';
import Leaderboard from '@/components/Leaderboard';
import PodiumView from '@/components/PodiumView';
import { ref, onValue, set, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { HostQuestion } from '@/types/types';
import { GamePageProps } from '@/types/types';
import { usePlayer } from '@/context/PlayerContext';
import { useSearchParams } from 'next/navigation';
import ServerTimer from '@/components/ServerTimer';

export default function GamePage({ params }: { params: { gameId: string } }) {
  const unwrappedParams = use(params);
  const gameId = unwrappedParams.gameId;

  const searchParams = useSearchParams();
  const playerName = searchParams?.get('name') || 'Anonymous';

  const {
    player: {
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
  const [isGameEnded, setIsGameEnded] = useState(false);
  const [players, setPlayers] = useState<Array<{name: string, score: number}>>([]);
  const [joinedLate, setJoinedLate] = useState(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Add a state to control UI stability
  const [uiState, setUiState] = useState<'waiting' | 'question' | 'feedback' | 'gameOver'>('waiting');
  const isQuestionEndingRef = useRef(false);
  const questionRef = useRef<HostQuestion | null>(null);

  useEffect(() => {
    const questionDbRef = ref(database, `games/${gameId}/currentQuestion`);
    const scoreRef = ref(database, `games/${gameId}/players/${playerName}/score`);
    const statusRef = ref(database, `games/${gameId}/status`);
    const playersRef = ref(database, `games/${gameId}/players`);
    const playerRef = ref(database, `games/${gameId}/players/${playerName}/joinedAt`);

    get(playerRef).then((snapshot) => {
      const playerJoinTime = snapshot.exists() ? snapshot.val() : Date.now();

      // Check if question already exists when player joins
      get(questionDbRef).then((snapshot) => {
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
        const status = snapshot.val();

        if (status === 'ended') {
          // If there is a current question and time isn't up yet, this is a question ending
          if (currentQuestion && !timeUp && !isQuestionEndingRef.current) {
            isQuestionEndingRef.current = true;
            setTimeUp(true);
            setUiState('feedback'); // Show feedback when question ends

            // Reset the flag after a short delay
            setTimeout(() => {
              isQuestionEndingRef.current = false;
            }, 1000);
          } else if (!isQuestionEndingRef.current) {
            // This is an actual game end
            setIsGameEnded(true);
            setUiState('gameOver');
          }
        }

        setGameStatus(status);
      }
    });

    const questionUnsubscribe = onValue(questionDbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        questionRef.current = data;
        setCurrentQuestion(data);
        setTimerKey(prevKey => prevKey + 1);
        setTimeUp(false);
        setAnswerSubmitted(false);
        setAnswerCorrect(null);
        setJoinedLate(false);
        setUiState('question'); // Show question UI when a new question arrives
        setIsGameEnded(false);
      } else if (gameStatus === 'ended' && !isQuestionEndingRef.current) {
        setIsGameEnded(true);
        setUiState('gameOver');
      } else {
        setUiState('waiting');
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

  // Move these handlers outside the effect for stability
  const handleAnswer = (index: number) => {
    if (!currentQuestion || answerSubmitted || timeUp) return;

    setSelectedAnswerIndex(index);
    setAnswerSubmitted(true);
    // Don't show feedback yet, just record the answer
  };

  const handleTimeUp = () => {
    setTimeUp(true);
    setUiState('feedback');

    if (answerSubmitted) {
      // Now that time is up, check if the answer was correct
      const isCorrect = selectedAnswerIndex !== null &&
                        currentQuestion?.correctAnswer === currentQuestion?.options[selectedAnswerIndex];
      setAnswerCorrect(isCorrect);
      setShowFeedback(true);

      // Update score in Firebase if correct
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

  // Render feedback component based on answer correctness
  const renderFeedback = () => {
    if (!currentQuestion || !timeUp) return null;

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
    } else {
      return (
        <div className="mt-8 p-6 bg-gray-100 rounded-lg text-center">
          <h3 className="text-xl font-bold text-gray-700">Time's up!</h3>
          <p className="text-gray-600 mt-2">The correct answer was: {currentQuestion.correctAnswer}</p>
          <p className="text-gray-600 mt-2">Waiting for the next question...</p>
        </div>
      );
    }
  };

  // Render pending answer feedback while waiting for time to end
  const renderPendingFeedback = () => {
    if (!currentQuestion || !answerSubmitted || timeUp || selectedAnswerIndex === null) return null;

    // Get the selected option text
    const selectedOption = currentQuestion.options[selectedAnswerIndex];

    // Get the corresponding option color
    const optionColors = ['#e21b3c', '#1368ce', '#26890c', '#ffa602'];
    const selectedColor = optionColors[selectedAnswerIndex] || '#3b82f6'; // Default to blue if index is out of bounds

    return (
      <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg text-center">
        <h3 className="text-xl font-bold text-blue-700">Answer Submitted</h3>
        <p className="text-gray-600 mt-2">Wait for the timer to end to see if you're correct!</p>
        <div className="mt-3 flex justify-center">
          <span
            className="px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: selectedColor }}
          >
            You selected: {selectedOption}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-8">
      <div className="text-right mb-4">
        <span className="font-bold text-lg py-3 px-6 bg-gray-100 rounded-full shadow-lg inline-block">Score: <span className="text-blue-600">{score}</span></span>
      </div>

      {uiState === 'gameOver' && (
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
      )}

      {uiState === 'question' && currentQuestion && !timeUp && (
        <div className="mt-6 transition-all transform hover:scale-105">
          <div className="flex justify-center">
            <ServerTimer
              gameId={gameId}
              onTimeUp={handleTimeUp}
            />
          </div>

          {!answerSubmitted && !joinedLate ? (
            <QuestionCard
              question={currentQuestion}
              onAnswer={handleAnswer}
              optionColors={['#e21b3c', '#1368ce', '#26890c', '#ffa602']}
            />
          ) : answerSubmitted && (
            renderPendingFeedback()
          )}
        </div>
      )}

      {uiState === 'feedback' && currentQuestion && (
        <div className="mt-8 transition-all">
          {renderFeedback()}
        </div>
      )}

      {uiState === 'waiting' && (
        <div className="mt-8 p-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-lg text-center shadow-lg text-white">
          <h3 className="text-2xl font-bold mb-3">Waiting for the host</h3>
          <p className="text-lg mt-2 opacity-90">The next question will appear here soon...</p>
          <div className="mt-4 flex justify-center space-y-2 flex-col items-center">
            <div className="h-2.5 w-24 bg-blue-100 opacity-50 rounded-full animate-pulse"></div>
            <div className="h-2.5 w-28 bg-blue-100 opacity-50 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {uiState !== 'gameOver' && (
        <div className="mt-8 p-4 bg-white rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-3 text-gray-700">Current Standings</h3>
          <Leaderboard gameId={gameId} currentPlayerName={playerName} />
        </div>
      )}
    </div>
  );
}
