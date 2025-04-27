"use client";

import { useState, useRef, useEffect } from "react";

interface AudioRecorderProps {
  gameId: string;
}

export default function AudioRecorder({ gameId }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const sliceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const waitingToRestartRef = useRef<boolean>(false);

  const sliceDuration = 30 * 1000; // 30 seconds

  // Validate gameId on component mount
  useEffect(() => {
    if (!gameId) {
      throw new Error("The 'gameId' prop is required for the AudioRecorder component.");
    }
  }, [gameId]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      await startNewRecorder(stream);

      sliceIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          waitingToRestartRef.current = true;
          mediaRecorderRef.current.stop(); // triggers onstop
        }
      }, sliceDuration);

      setRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const startNewRecorder = (stream: MediaStream): Promise<void> => {
    return new Promise((resolve) => {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const recordedChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (recordedChunks.length > 0) {
          await uploadAudioBlob(recordedChunks);
        }

        // If we're still recording and stopping was triggered by interval
        if (waitingToRestartRef.current && mediaStreamRef.current) {
          waitingToRestartRef.current = false;
          await startNewRecorder(mediaStreamRef.current);
        }
      };

      mediaRecorder.start();
      resolve();
    });
  };

  const stopRecording = () => {
    if (sliceIntervalRef.current) {
      clearInterval(sliceIntervalRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setRecording(false);
  };

  const uploadAudioBlob = async (chunks: Blob[]) => {
    if (chunks.length === 0) return;

    const blob = new Blob(chunks, { type: "audio/webm" });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `audio-${timestamp}.webm`;
    const file = new File([blob], fileName, { type: blob.type });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("gameId", gameId); // Include gameId in the request

    const res = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("Transcribed Text:", data.transcript);
  };

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={startRecording}
        disabled={recording}
        className={`px-6 py-3 rounded-lg font-bold text-white ${
          recording
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        Start Recording
      </button>
      <button
        onClick={stopRecording}
        disabled={!recording}
        className={`px-6 py-3 rounded-lg font-bold text-white ${
          !recording
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-red-500 hover:bg-red-600"
        }`}
      >
        Stop Recording
      </button>
    </div>
  );
}