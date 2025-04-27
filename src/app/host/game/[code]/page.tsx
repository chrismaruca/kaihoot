"use client";

import { useParams } from 'next/navigation';
import { useState, useRef } from 'react';
import { getDatabase, ref, set } from 'firebase/database';
import { app } from '@/lib/firebase';
import VisualContextCapture from '@/components/VisualContextCapture';
import AudioRecorder from '@/components/AudioRecorder';
import HostQuestionCard from '@/components/HostQuestionCard';
import { HostQuestion } from '@/types/types';
import { database } from '@/lib/firebase';

export default function GamePage() {
  const params = useParams();
  const code = params?.code as string | undefined;
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [captureType, setCaptureType] = useState<'camera' | 'screen'>('camera');
  const [isAutoCapturing, setIsAutoCapturing] = useState<boolean>(false);
  const captureIntervalRef = useRef<number>(10000); // 10 seconds default

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

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
    // Store the latest captured frame in the game's visual context
    if (code) {
      // Ensure the imageData is properly formatted
      // Some image data might be too large, so consider compressing or limiting size
      set(ref(database, `games/${code}/currentVisualContext`), {
        image: imageData,
        timestamp: Date.now()
      }).catch(error => {
        console.error("Failed to save image to Firebase:", error);
      });
    }
  };

  const handleTranscriptionWithContext = (transcription: string) => {
    if (!code) return;

    const timestamp = Date.now();
    const transcriptionPath = `games/${code}/transcriptions/${timestamp}`;

    // Create basic transcription data
    const transcriptionData: any = {
      text: transcription,
      timestamp: timestamp
    };

    // Add visual context if available
    if (capturedImage) {
      // Create a separate entry for the image due to potential size limitations
      const imageRef = ref(database, `games/${code}/visualContexts/${timestamp}`);
      set(imageRef, {
        image: capturedImage,
        timestamp: timestamp
      }).then(() => {
        // Then update the transcription with a reference to the image
        transcriptionData.visualContextRef = `visualContexts/${timestamp}`;
        set(ref(database, transcriptionPath), transcriptionData).catch(err => {
          console.error("Error saving transcription data:", err);
        });
      }).catch(error => {
        console.error("Error saving visual context:", error);
        // If image fails, at least save the transcription
        set(ref(database, transcriptionPath), transcriptionData).catch(err => {
          console.error("Error saving transcription data:", err);
        });
      });
    } else {
      // No image, just save the transcription
      set(ref(database, transcriptionPath), transcriptionData).catch(err => {
        console.error("Error saving transcription data:", err);
      });
    }
  };

  const pushQuestionToFirebase = (gameCode: string, question: HostQuestion) => {
    // Include the captured image if available
    const questionWithContext = capturedImage
      ? { ...question, visualContext: capturedImage }
      : question;

    set(ref(database, `games/${gameCode}/currentQuestion`), questionWithContext);
  };

  const handleQuestionSelect = (index: number) => {
    const selectedQuestion = questions[index];
    console.log(`Question selected: ${selectedQuestion.text}`);
    pushQuestionToFirebase(code!, selectedQuestion);
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

  const toggleAutoCapture = () => {
    setIsAutoCapturing(!isAutoCapturing);
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
            className={`px-4 py-2 rounded cursor-pointer ${captureType === 'camera' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setCaptureType('camera')}
          >
            Use Camera
          </button>
          <button
            className={`px-4 py-2 rounded cursor-pointer ${captureType === 'screen' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setCaptureType('screen')}
          >
            Share Screen
          </button>
        </div>

        <VisualContextCapture
          onCapture={handleCapture}
          captureType={captureType}
          autoCapture={isAutoCapturing}
          captureInterval={captureIntervalRef.current}
        />

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
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              This image will be included with the next question or transcription
            </p>
          </div>
        )}
      </div>

      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Question Controls</h2>
        <div className="flex space-x-4 mb-6">
          <button
            onClick={refreshQuestions}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
          >
            Refresh Questions
          </button>
          <AudioRecorder
            gameId={code}
            onTranscription={handleTranscriptionWithContext}
          />
          <button
            onClick={toggleAutoCapture}
            className={`px-4 py-2 rounded-lg font-bold ${isAutoCapturing ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-purple-500 hover:bg-purple-600'} text-white cursor-pointer`}
          >
            {isAutoCapturing ? 'Disable Auto-Capture' : 'Enable Auto-Capture'}
          </button>
          <button
            onClick={endGame}
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 cursor-pointer"
          >
            End Game
          </button>
        </div>

        <div className="mt-8 w-full max-w-2xl max-h-96 overflow-y-auto border rounded-lg p-4">
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
  );
}
