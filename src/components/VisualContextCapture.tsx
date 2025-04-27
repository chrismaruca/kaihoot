"use client";

import { useState, useRef, useCallback } from 'react';

interface VisualContextCaptureProps {
  onCapture: (imageData: string) => void;
  captureType: 'camera' | 'screen';
}

export default function VisualContextCapture({ onCapture, captureType }: VisualContextCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCapture = useCallback(async () => {
    try {
      let stream;
      if (captureType === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      } else {
        // Screen sharing
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
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
    }
  }, []);

  const captureFrame = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');
        onCapture(imageData);
      }
    }
  }, [onCapture]);

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
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Start {captureType === 'camera' ? 'Camera' : 'Screen Capture'}
          </button>
        ) : (
          <>
            <button
              onClick={captureFrame}
              className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Capture Frame
            </button>
            <button
              onClick={stopCapture}
              className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}
