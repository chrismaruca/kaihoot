"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

interface VisualContextCaptureProps {
  onCapture: (imageData: string) => void;
  captureType: 'camera' | 'screen';
  autoCapture?: boolean; // Add optional autoCapture prop
  captureInterval?: number; // Add optional captureInterval prop in milliseconds
}

export default function VisualContextCapture({
  onCapture,
  captureType,
  autoCapture = false,
  captureInterval = 5000 // Default 5 seconds
}: VisualContextCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoCapturing, setIsAutoCapturing] = useState(autoCapture);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCapture = useCallback(async () => {
    try {
      let stream;
      if (captureType === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }
        });
      } else {
        // Screen sharing
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "window",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        } as any);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setError(null);
      }
    } catch (err) {
      setError(`Failed to start ${captureType}: ${err instanceof Error ? err.message : String(err)}`);
      setIsStreaming(false);
    }
  }, [captureType]);

  const stopCapture = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);

      // Clear the interval if it's running
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsAutoCapturing(false);
      }
    }
  }, []);

  const captureFrame = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas');

      // Use a reasonable resolution to prevent issues with Firebase size limits
      const scaleFactor = 0.5; // Scale down to 50% of original size
      const width = videoRef.current.videoWidth * scaleFactor;
      const height = videoRef.current.videoHeight * scaleFactor;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Draw the current video frame to the canvas with the scaled dimensions
        ctx.drawImage(videoRef.current, 0, 0, width, height);

        // Convert to JPEG with reduced quality to keep size down
        try {
          const imageData = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
          console.log(`Captured frame: ${Math.round(imageData.length/1024)}KB`);
          onCapture(imageData);
        } catch (error) {
          console.error("Error capturing frame:", error);
        }
      }
    } else {
      console.warn("Video not ready for capture");
    }
  }, [onCapture]);

  // Toggle auto-capture function
  const toggleAutoCapture = useCallback(() => {
    if (isAutoCapturing && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsAutoCapturing(false);
    } else if (isStreaming) {
      // Start auto-capture only if streaming
      setIsAutoCapturing(true);
      captureFrame(); // Capture one frame immediately
      intervalRef.current = setInterval(captureFrame, captureInterval);
    }
  }, [isAutoCapturing, isStreaming, captureFrame, captureInterval]);

  // Set up auto-capture on streaming start if autoCapture is true
  useEffect(() => {
    if (isStreaming && autoCapture && !intervalRef.current) {
      setIsAutoCapturing(true);
      captureFrame(); // Capture one frame immediately
      intervalRef.current = setInterval(captureFrame, captureInterval);
    }
  }, [isStreaming, autoCapture, captureFrame, captureInterval]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-4 relative">
        <video
          ref={videoRef}
          className="w-full border rounded-lg bg-black"
          autoPlay
          playsInline
          style={{ height: isStreaming ? 'auto' : '240px' }}
        />
        {!isStreaming && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
            <p className="text-gray-500">No active stream</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-75 rounded-lg">
            <p className="text-red-500 text-center p-4">{error}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {!isStreaming ? (
          <button
            onClick={startCapture}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer"
          >
            Start {captureType === 'camera' ? 'Camera' : 'Screen Capture'}
          </button>
        ) : (
          <>
            <button
              onClick={captureFrame}
              className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 cursor-pointer"
            >
              Capture Frame
            </button>
            <button
              onClick={toggleAutoCapture}
              className={`flex-1 ${isAutoCapturing ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-purple-500 hover:bg-purple-600'} text-white px-4 py-2 rounded cursor-pointer`}
            >
              {isAutoCapturing ? 'Stop Auto-Capture' : 'Start Auto-Capture'}
            </button>
            <button
              onClick={stopCapture}
              className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 cursor-pointer"
            >
              Stop
            </button>
          </>
        )}
      </div>
      {isAutoCapturing && (
        <div className="mt-2 text-sm text-gray-600 text-center">
          Auto-capturing frames every {captureInterval/1000} seconds
        </div>
      )}
    </div>
  );
}
