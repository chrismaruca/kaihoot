"use client";

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { getDatabase, ref, set } from 'firebase/database';
import { app } from '@/lib/firebase';
import VisualContextCapture from '@/components/VisualContextCapture';

export default function GamePage() {
  const params = useParams();
  const code = params?.code as string | undefined;
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [captureType, setCaptureType] = useState<'camera' | 'screen'>('camera');

  interface Question {
    text: string;
    options: string[];
    correctAnswer: string;
    timeLimit: number;
    visualContext?: string; // Add visual context to the question
  }

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
  };

  const pushQuestion = (question: Question) => {
    // Include the captured image if available
    const questionWithContext = capturedImage
      ? { ...question, visualContext: capturedImage }
      : question;

    const database = getDatabase(app);
    set(ref(database, `games/${code}/currentQuestion`), questionWithContext);
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
    <div className="min-h-screen flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-4">Game Code: {code}</h1>

      {/* Visual Context Section */}
      <div className="w-full max-w-2xl mb-8">
        <h2 className="text-2xl font-bold mb-4">Visual Context</h2>
        <div className="flex gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded ${captureType === 'camera' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setCaptureType('camera')}
          >
            Use Camera
          </button>
          <button
            className={`px-4 py-2 rounded ${captureType === 'screen' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setCaptureType('screen')}
          >
            Share Screen
          </button>
        </div>

        <VisualContextCapture onCapture={handleCapture} captureType={captureType} />

        {capturedImage && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Captured Image:</h3>
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured context"
                className="w-full max-h-60 object-contain border rounded"
              />
              <button
                onClick={() => setCapturedImage(null)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              This image will be included with the next question
            </p>
          </div>
        )}
      </div>

      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Question Controls</h2>
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
    </div>
  );
}
