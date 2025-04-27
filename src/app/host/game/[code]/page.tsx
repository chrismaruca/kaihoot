"use client";

import { useParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

import AudioRecorder from '@/components/AudioRecorder';
import HostQuestionCard from '@/components/HostQuestionCard';
import { pushQuestion } from '@/utils/api';
import { HostQuestion } from '@/types/types';
import { getDatabase, ref, set } from 'firebase/database';
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
        <h1 className="text-4xl font-bold mb-8">Invalid Game Code</h1>
        <p className="text-lg">The game code is missing or invalid. Please check the URL and try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Game Code: {code}</h1>
      <p className="text-lg mb-4">Welcome to the game! The host will start the game shortly.</p>

      <div className="flex flex-col space-y-6 mb-6 w-full max-w-4xl">
        {/* Visual Input Controls */}
        <div className="p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-bold mb-3">Visual Input Settings</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex space-x-4 mb-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="camera"
                    name="captureType"
                    value="camera"
                    checked={captureType === "camera"}
                    onChange={() => setCaptureType("camera")}
                    className="mr-2"
                  />
                  <label htmlFor="camera">Camera</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    id="screen"
                    name="captureType"
                    value="screen"
                    checked={captureType === "screen"}
                    onChange={() => setCaptureType("screen")}
                    className="mr-2"
                  />
                  <label htmlFor="screen">Screen Share</label>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="relative h-48 bg-black rounded-lg overflow-hidden">
                {!visualStream && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
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
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <button
            onClick={refreshQuestions}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
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
            className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-600 cursor-pointer"
          >
            End Game
          </button>
        </div>
      </div>

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
    </div>
  );
}
