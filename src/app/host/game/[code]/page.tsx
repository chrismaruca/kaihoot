"use client";

import { useParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

import AudioRecorder from '@/components/AudioRecorder';
import HostQuestionCard from '@/components/HostQuestionCard';
import { pushQuestion } from '@/utils/api';
import { HostQuestion } from '@/types/types';
import { ref, set } from 'firebase/database';
import { database } from '@/lib/firebase';

export default function GamePage() {
  const params = useParams();
  const code = params?.code as string | undefined;
  const [captureType, setCaptureType] = useState<"camera" | "screen">("camera");
  const [visualStream, setVisualStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  // Handle stream cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (visualStream) {
        visualStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [visualStream]);

  const handleQuestionSelect = (index: number) => {
    const selectedQuestion = questions[index];
    console.log(`Question selected: ${selectedQuestion.text}`);
    pushQuestion(code, selectedQuestion);
  };

  const endGame = () => {
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
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto text-center">
          <h1 className="text-4xl font-bold mb-8 text-red-600">Invalid Game Code</h1>
          <p className="text-lg text-gray-700">The game code is missing or invalid. Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-8">
      <div className="w-full max-w-4xl bg-white/90 rounded-lg shadow-lg p-8 mb-8">
        <h1 className="text-4xl font-bold mb-4 text-center text-blue-600">Game Code: <span className="text-purple-600">{code}</span></h1>
        <p className="text-lg mb-8 text-center text-gray-700">Manage your game session and send questions to players</p>

        <div className="flex flex-col space-y-6 mb-6 w-full">
          {/* Visual Input Controls */}
          <div className="p-6 border-2 border-gray-200 rounded-lg bg-gray-50 shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Visual Input Settings</h2>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex space-x-6 mb-4">
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

              <div className="flex-1">
                <div className="relative h-48 bg-black rounded-lg overflow-hidden border-2 border-gray-300 shadow-inner">
                  {!visualStream && (
                    <div className="absolute inset-0 flex items-center justify-center text-white bg-gradient-to-b from-gray-700 to-gray-900">
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
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <button
              onClick={refreshQuestions}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 font-semibold shadow-md"
            >
              Refresh Questions
            </button>

            <AudioRecorder
              gameId={code}
              captureType={captureType}
              videoRef={videoRef}
              onVisualStreamChange={setVisualStream}
            />

            <button
              onClick={endGame}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 font-semibold shadow-md"
            >
              End Game
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-4 text-white text-center">Available Questions</h2>
        <div className="bg-white/90 rounded-lg shadow-lg p-6 h-96 overflow-y-auto">
          <div className="space-y-4">
            {questions.map((question, index) => (
              <HostQuestionCard
                key={index}
                question={question}
                onSelect={() => handleQuestionSelect(index)}
                optionColors={['#FF5733', '#33FF57', '#3357FF', '#F3FF33']}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
