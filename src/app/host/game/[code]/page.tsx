"use client";

import { useParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

import AudioRecorder from '@/components/AudioRecorder';
import HostQuestionCard from '@/components/HostQuestionCard';
import { pushQuestion } from '@/utils/api';
import { HostQuestion } from '@/types/types';
import { ref, set, onValue, get, off, query, orderByChild } from 'firebase/database';
import { database } from '@/lib/firebase';
import AnswerDistribution from '@/components/AnswerDistribution';

type LogEntry = {
  id: string;
  timestamp: number;
  type: 'transcript' | 'question';
  transcript?: string;
  visualContext?: string | null;
  question?: HostQuestion;
  distribution?: Record<string, number>;
};

export default function GamePage() {
  const params = useParams();
  const code = params?.code as string | undefined;
  const [captureType, setCaptureType] = useState<"camera" | "screen">("camera");
  const [visualStream, setVisualStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [questions, setQuestions] = useState<HostQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<HostQuestion | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Handle stream cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (visualStream) {
        visualStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [visualStream]);

  // Load transcript logs and archived questions from Firebase
  useEffect(() => {
    if (!code) return;

    const transcriptsRef = query(ref(database, `games/${code}/transcripts`), orderByChild('timestamp'));
    const questionsRef = ref(database, `games/${code}/questions`);
    const archivedQuestionsRef = ref(database, `games/${code}/archives`);

    const questionsListener = onValue(questionsRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.val();

      const questionEntries: HostQuestion[] = Object.entries(data).map(([key, value]: [string, any]) => ({
        text: value.text,
        options: value.options,
        correctAnswer: value.correctAnswer,
        answer: value.answer,
        pushedAt: value.pushedAt,
        difficulty: value.difficulty,
        timeLimit: value.timeLimit,
      }));

      setQuestions(questionEntries);
    });

    // Function to merge and sort transcripts and archived questions
    const updateLogEntries = async () => {
      try {
        // Get transcripts
        const transcriptsSnapshot = await get(transcriptsRef);
        const transcriptsData = transcriptsSnapshot.val() || {};

        // Get archived questions
        const archivedSnapshot = await get(archivedQuestionsRef);
        const archivedData = archivedSnapshot.val() || {};

        // Process transcripts
        const transcriptEntries: LogEntry[] = Object.entries(transcriptsData).map(([key, value]: [string, any]) => ({
          id: key,
          timestamp: value.timestamp,
          type: 'transcript',
          transcript: value.transcript,
          visualContext: value.visualContext
        }));

        // Process archived questions
        const questionEntries: LogEntry[] = Object.entries(archivedData).map(([key, value]: [string, any]) => ({
          id: key,
          timestamp: parseInt(key),
          type: 'question',
          question: {
            text: value.question.text,
            options: value.question.options,
            correctAnswer: value.question.correctAnswer,
            difficulty: value.question.difficulty,
            timeLimit: value.question.timeLimit,
          },
          distribution: value.distribution
        }));

        // Combine and sort by timestamp (newest first)
        const combined = [...transcriptEntries, ...questionEntries];
        combined.sort((a, b) => b.timestamp - a.timestamp);

        setLogEntries(combined);
      } catch (error) {
        console.error("Error loading log entries:", error);
      }
    };

    // Set up listeners
    const transcriptsListener = onValue(transcriptsRef, updateLogEntries);
    const archivedListener = onValue(archivedQuestionsRef, updateLogEntries);

    // Initial load
    updateLogEntries();

    return () => {
      off(transcriptsRef, 'value', transcriptsListener);
      off(archivedQuestionsRef, 'value', archivedListener);
      questionsListener(); // Unsubscribe from questions listener
    };
  }, [code]);

  // Add effect to track current question
  useEffect(() => {
    if (!code) return;

    const questionRef = ref(database, `games/${code}/currentQuestion`);
    const unsubscribe = onValue(questionRef, (snapshot) => {
      const questionData = snapshot.val();
      setCurrentQuestion(questionData);
    });

    return () => unsubscribe();
  }, [code]);

  const handleQuestionSelect = (index: number) => {
    const selectedQuestion = questions[index];
    console.log(`Question selected: ${selectedQuestion.text}`);
    pushQuestion(code, selectedQuestion);
  };

  const endGame = () => {
    set(ref(database, `games/${code}/status`), 'ended');
    set(ref(database, `games/${code}/currentQuestion`), null);
  };

  // Add function to end current question
  const endCurrentQuestion = () => {
    if (!code || !currentQuestion) return;

    // End the question by setting the timer to expire immediately
    const timerRef = ref(database, `games/${code}/timer`);
    set(timerRef, {
      startTime: Date.now() - (currentQuestion.timeLimit * 1000),
      endTime: Date.now()
    });

    // Also set the status to ended to ensure all clients get the notification
    set(ref(database, `games/${code}/status`), 'ended');

    // Briefly after, reset to active so the next question can be selected
    setTimeout(() => {
      set(ref(database, `games/${code}/status`), 'active');
    }, 500);
  };

  const refreshQuestions = async () => {
    if (!code) return;

    setIsLoading(true);
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

      await response.json();
    } catch (error) {
      console.error('Error refreshing questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!code) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto text-center">
          <h1 className="text-4xl font-bold mb-8 text-red-600">Invalid Room Code</h1>
          <p className="text-lg text-gray-700">The room code is missing or invalid. Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-8">
      <div className="w-full max-w-4xl bg-white/90 rounded-lg shadow-lg p-8 mb-8">
        <h1 className="text-4xl font-bold mb-4 text-center text-blue-600">Room Code: <span className="text-purple-600">{code}</span></h1>
        <p className="text-lg mb-8 text-center text-gray-700">Manage your room and send questions to players</p>

        <div className="flex flex-col space-y-6 mb-6 w-full">
          {/* Visual Input Controls */}
          <div className="p-6 border-2 border-gray-200 rounded-lg bg-gray-50 shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">Video Settings</h2>
            <div className="flex flex-col gap-6">
              <div className="flex-1 ">
                <div className="flex justify-center space-x-6">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="camera"
                      name="captureType"
                      value="camera"
                      checked={captureType === "camera"}
                      onChange={() => setCaptureType("camera")}
                      className="mr-2 h-4 w-4 accent-purple-500"
                    />
                    <label htmlFor="camera" className="text-lg font-medium text-gray-700">Camera</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="screen"
                      name="captureType"
                      value="screen"
                      checked={captureType === "screen"}
                      onChange={() => setCaptureType("screen")}
                      className="mr-2 h-4 w-4 accent-purple-500"
                    />
                    <label htmlFor="screen" className="text-lg font-medium text-gray-700">Screen Share</label>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex justify-center items-center">
                <div className="relative h-48 w-80 bg-black rounded-lg overflow-hidden border-2 border-gray-300 shadow-inner">
                  {!visualStream && (
                    <div className="absolute inset-0 flex text-center items-center justify-center text-white bg-gradient-to-b from-gray-700 to-gray-900">
                      Preview will appear when recording starts
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-contain ${!visualStream && "hidden"}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Game Controls */}
            <div className="flex flex-col sm:flex-row gap-2"> 
              <button
                onClick={refreshQuestions}
                disabled={isLoading}
                className={`
                  px-6 py-3 
                  ${isLoading ? 'bg-gray-400' : 'bg-blue-500'} 
                  text-white rounded-lg 
                  hover:${isLoading ? '' : 'bg-blue-600'} 
                  transition duration-200 
                  font-semibold 
                  shadow-md 
                  text-center
                  border-2
                  relative
                  ${!isLoading ? 'pulse-button' : ''}
                `}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 text-white mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                    Loading...
                  </div>
                ) : (
                  'Create Questions ✨'
                )}
              </button>


              <AudioRecorder
                gameId={code}
                captureType={captureType}
                videoRef={videoRef}
                onVisualStreamChange={setVisualStream}
              />
              {currentQuestion && (
                <button
                  onClick={endCurrentQuestion}
                  className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-200 font-semibold shadow-md text-center"
                >
                  End Question ⏱️
                </button>
              )}
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition duration-200 font-semibold shadow-md text-center"
              >
                View Log 📝
              </button>

              <button
                onClick={endGame}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 font-semibold shadow-md"
              >
                End Lesson 🏁
              </button>
            </div>
          </div>
      </div>

      {/* Live Answer Distribution */}
      {currentQuestion && (
        <div className="w-full max-w-4xl mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white text-center drop-shadow-md">Live Answer Distribution</h2>
          <AnswerDistribution
            gameId={code}
            options={currentQuestion.options || []}
            optionColors={['#e21b3c', '#1368ce', '#26890c', '#ffa602']}
          />
        </div>
      )}

      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-4 text-white text-center drop-shadow-md">Available Questions</h2>
        <div className="bg-white/90 rounded-lg shadow-lg p-6 h-96 overflow-y-auto">
          <div className="flex flex-col-reverse gap-4">
            {questions.map((question, index) => (
              <HostQuestionCard
                key={index}
                question={question}
                onSelect={() => handleQuestionSelect(index)}
                optionColors={['#e21b3c', '#1368ce', '#26890c', '#ffa602']}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Transcript & Questions Log Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Lesson Log</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {logEntries.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-lg">No log entries available yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {logEntries.map((entry) => (
                    <div
                      key={`${entry.type}-${entry.id}`}
                      className={`border rounded-lg p-4 ${entry.type === 'transcript' ? 'bg-gray-50' : 'bg-blue-50'}`}
                    >
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold text-gray-700">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        <span className="px-2 py-1 text-xs rounded bg-opacity-60 font-medium uppercase tracking-wider">
                          {entry.type === 'transcript' ? 'Transcript' : 'Question'}
                        </span>
                      </div>

                      {entry.type === 'transcript' ? (
                        <>
                          <p className="mb-4 text-gray-800">{entry.transcript}</p>

                          {entry.visualContext && (
                            <div className="mt-2">
                              <div className="border rounded overflow-hidden">
                                <img
                                  src={entry.visualContext}
                                  alt="Visual context"
                                  className="max-h-64 mx-auto"
                                />
                              </div>
                            </div>
                          )}
                        </>
                      ) : entry.question ? (
                        <div className="space-y-4">
                          <div className="font-medium text-gray-900 text-lg">{entry.question.text}</div>

                          {entry.question.options && entry.distribution && (
                            <div>
                              <AnswerDistribution
                                gameId={""} // Not needed when we provide preloaded distribution
                                options={entry.question.options}
                                optionColors={['#e21b3c', '#1368ce', '#26890c', '#ffa602']}
                                preloadedDistribution={Object.entries(entry.distribution || {}).reduce((acc, [key, value]) => {
                                  acc[parseInt(key)] = value as number;
                                  return acc;
                                }, {} as Record<number, number>)}
                              />
                              {entry.question.correctAnswer !== undefined && (
                                <div className="mt-2 text-right text-sm font-medium text-green-600">
                                  Correct answer: {entry.question.correctAnswer}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
