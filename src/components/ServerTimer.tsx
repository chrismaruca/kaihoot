'use client';

import React, { useEffect, useState } from 'react';
import { database } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';

interface ServerTimerProps {
  gameId: string;
  onTimeUp: () => void;
}

const ServerTimer: React.FC<ServerTimerProps> = ({ gameId, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(30); // Default duration

  useEffect(() => {
    const timerRef = ref(database, `games/${gameId}/timer`);
    const statusRef = ref(database, `games/${gameId}/status`);
    let intervalId: NodeJS.Timeout;

    // Listen for game status changes
    const statusUnsubscribe = onValue(statusRef, (snapshot) => {
      const status = snapshot.val();
    });

    // Listen for timer updates from Firebase
    const timerUnsubscribe = onValue(timerRef, (snapshot) => {
      const timerData = snapshot.val();
      if (!timerData) return;

      const { startTime, endTime } = timerData;
      const totalDuration = Math.ceil((endTime - startTime) / 1000);
      setDuration(totalDuration);

      // Clear any existing interval
      if (intervalId) {
        clearInterval(intervalId);
      }

      // Update the timer every 100ms to ensure accuracy
      intervalId = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        const seconds = Math.ceil(remaining / 1000);

        setTimeLeft(seconds);

        // Check if timer has ended
        if (remaining <= 0) {
          clearInterval(intervalId);
          onTimeUp();
        }
      }, 100);
    });

    // Cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      timerUnsubscribe();
      statusUnsubscribe();
    };
  }, [gameId, onTimeUp]);

  if (timeLeft === null) {
    return <div className="w-full text-center">Loading timer...</div>;
  }

  // Calculate percentage of time remaining for the progress bar
  const percentage = (timeLeft / duration) * 100;

  // Determine color based on time remaining
  let progressColorClass = 'bg-green-500';
  if (percentage < 30) {
    progressColorClass = 'bg-red-500';
  } else if (percentage < 60) {
    progressColorClass = 'bg-yellow-400';
  }

  return (
    <div className="w-full max-w-md mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-700 font-medium">Time Remaining:</span>
        <span className={`font-bold ${timeLeft < 5 ? 'text-red-600' : 'text-blue-700'}`}>
          {timeLeft} seconds
        </span>
      </div>

      <div className="h-4 bg-gray-200 rounded-full overflow-hidden shadow">
        <div
          className={`h-full ${progressColorClass} transition-all duration-100 ease-linear`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ServerTimer;
