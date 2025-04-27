"use client";

import { useParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

import AudioRecorder from '@/components/AudioRecorder';
import HostQuestionCard from '@/components/HostQuestionCard';
import { pushQuestion } from '@/utils/api';
import { HostQuestion } from '@/types/types';
import { ref, set, onValue, get, off, query, orderByChild } from 'firebase/database';
import { database } from '@/lib/firebase';

export default function GamePage() {
  const params = useParams();
  const code = params?.code as string | undefined;
  const [captureType, setCaptureType] = useState<"camera" | "screen">("camera");
  const [visualStream, setVisualStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [questions, setQuestions] = useState<HostQuestion[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [transcriptLogs, setTranscriptLogs] = useState<Array<{
    timestamp: number;
    transcript: string;
    visualContext?: string | null;
  }>>([]);

  // Handle stream cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (visualStream) {
        visualStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [visualStream]);

  // Load transcript logs from Firebase
  useEffect(() => {
    if (!code) return;

    const transcriptsRef = query(ref(database, `games/${code}/transcripts`), orderByChild('timestamp'));

    const loadTranscripts = onValue(transcriptsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const transcriptEntries = Object.entries(data).map(([key, value]: [string, any]) => ({
        id: key,
        timestamp: value.timestamp,
        transcript: value.transcript,
        visualContext: value.visualContext
      }));

      // Sort by timestamp (newest first)
      transcriptEntries.sort((a, b) => b.timestamp - a.timestamp);
      setTranscriptLogs(transcriptEntries);
    });

    return () => {
      off(transcriptsRef, 'value', loadTranscripts);
    };
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
              Create Questions ✨
            </button>

            <AudioRecorder
              gameId={code}
              captureType={captureType}
              videoRef={videoRef}
              onVisualStreamChange={setVisualStream}
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition duration-200 font-semibold shadow-md"
              >
                View Log 📝
              </button>

              <button
                onClick={endGame}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 font-semibold shadow-md"
              >
                End Game
              </button>
            </div>
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

      {/* Transcript Logs Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Log</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {transcriptLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-lg">No transcript logs available yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {transcriptLogs.map((log) => (
                    <div key={log.timestamp} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold text-gray-700">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <p className="mb-4 text-gray-800">{log.transcript}</p>

                      {log.visualContext && (
                        <div className="mt-2">
                          <div className="border rounded overflow-hidden">
                            <img
                              src={log.visualContext}
                              alt="Visual context"
                              className="max-h-64 mx-auto"
                            />
                          </div>
                        </div>
                      )}
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
