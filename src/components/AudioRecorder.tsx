"use client";

import { useState, useRef } from 'react';

export default function AudioRecorder() {
  const [recording, setRecording] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const sliceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const waitingToRestartRef = useRef<boolean>(false);

  const sliceDuration = 30 * 1000; // 30 seconds

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
          uploadAudioBlob(recordedChunks);
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
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
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
    formData.append('file', file);
    
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    console.log('Transcribed Text:', data.transcript.text);
  };

  return (
    <div>
      <button onClick={startRecording} disabled={recording}>
        Start recording
      </button>
      <button onClick={stopRecording} disabled={!recording}>
        Stop recording
      </button>
    </div>
  );
}