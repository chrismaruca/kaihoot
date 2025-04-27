"use client";

import { useState, useRef, useEffect } from "react";

interface AudioRecorderProps {
  gameId: string;
  captureType?: "camera" | "screen";
  videoRef?: React.RefObject<HTMLVideoElement>; // External video element for preview
  onVisualStreamChange?: (stream: MediaStream | null) => void; // Callback to update parent's stream state
  onAudioAvailable?: (transcript: string, visualData?: string) => void;
}

export default function AudioRecorder({
  gameId,
  captureType = "camera",
  videoRef: externalVideoRef,
  onVisualStreamChange,
  onAudioAvailable
}: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [visualStreamActive, setVisualStreamActive] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const visualStreamRef = useRef<MediaStream | null>(null);
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const sliceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const waitingToRestartRef = useRef<boolean>(false);

  // Use external videoRef if provided, otherwise use internal
  const videoRef = externalVideoRef || internalVideoRef;

  const sliceDuration = 5 * 1000;

  // Validate gameId on component mount
  useEffect(() => {
    if (!gameId) {
      throw new Error("The 'gameId' prop is required for the AudioRecorder component.");
    }
  }, [gameId]);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      stopVisualStream();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startVisualStream = async (): Promise<boolean> => {
    try {
      let stream;
      if (captureType === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      } else {
        // Screen sharing
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      }

      visualStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setVisualStreamActive(true);

      // Notify parent component about the stream change
      if (onVisualStreamChange) {
        onVisualStreamChange(stream);
      }

      return true;
    } catch (error) {
      console.error(`Error starting ${captureType} capture:`, error);
      return false;
    }
  };

  const stopVisualStream = () => {
    if (visualStreamRef.current) {
      visualStreamRef.current.getTracks().forEach((track) => track.stop());
      visualStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setVisualStreamActive(false);

    // Notify parent component about the stream change
    if (onVisualStreamChange) {
      onVisualStreamChange(null);
    }
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !visualStreamActive) return null;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.8); // 0.8 quality to reduce size
    }

    return null;
  };

  const startRecording = async () => {
    try {
      // Start visual stream first - use the captureType provided by parent
      const visualReady = await startVisualStream();
      if (!visualReady) {
        console.warn("Visual stream couldn't be started, continuing with audio only");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      await startNewRecorder(stream);

      sliceIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          waitingToRestartRef.current = true;

          // Capture a frame before stopping the recorder
          const frameData = captureFrame();

          // Store the captured frame for this interval
          if (mediaRecorderRef.current) {
            // @ts-ignore - Adding custom property to store frame data
            mediaRecorderRef.current.frameData = frameData;
          }

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
        // Get the frame data associated with this recording segment
        // @ts-ignore - Accessing custom property
        const frameData = mediaRecorderRef.current?.frameData;

        if (recordedChunks.length > 0) {
          await uploadAudioBlob(recordedChunks, frameData);
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
      // Capture a final frame before stopping
      if (mediaRecorderRef.current) {
        // @ts-ignore - Adding custom property to store frame data
        mediaRecorderRef.current.frameData = captureFrame();
      }
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    stopVisualStream();
    setRecording(false);
  };

  const uploadAudioBlob = async (chunks: Blob[], frameData: string | null) => {
    if (chunks.length === 0) return;

    const blob = new Blob(chunks, { type: "audio/webm" });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `audio-${timestamp}.webm`;
    const file = new File([blob], fileName, { type: blob.type });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("gameId", gameId);

    // Include the frame data if available
    if (frameData) {
      formData.append("visualContext", frameData);
    }

    const res = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("Transcribed Text:", data.transcript);

    // Call the callback if provided
    if (onAudioAvailable) {
      onAudioAvailable(data.transcript, frameData || undefined);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Only render video element if we're using the internal one */}
      {!externalVideoRef && (
        <video
          ref={internalVideoRef}
          className="hidden"
          autoPlay
          playsInline
          muted
        />
      )}

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
    </div>
  );
}
