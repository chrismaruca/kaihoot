'use client';

import { useState, useEffect, useRef } from 'react';

interface TimerProps {
  duration: number; // in seconds
  onTimeUp?: () => void;
}

export default function Timer({ duration, onTimeUp }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const timeUpCalledRef = useRef(false);

  useEffect(() => {
    setTimeLeft(duration);
    timeUpCalledRef.current = false;

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(interval);
          // Call onTimeUp when timer reaches zero, but only if it hasn't been called yet
          if (onTimeUp && !timeUpCalledRef.current) {
            timeUpCalledRef.current = true;
            setTimeout(() => {
              onTimeUp();
            }, 0);
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, onTimeUp]);

  // Calculate progress as a percentage
  const progress = (timeLeft / duration) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1 text-sm">
        <span>Time left</span>
        <span>{timeLeft} seconds</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full"
          style={{ width: `${progress}%`, transition: 'width 1s linear' }}
        ></div>
      </div>
    </div>
  );
}
