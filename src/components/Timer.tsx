'use client';

import React, { useEffect, useState } from 'react';

interface TimerProps {
  duration: number;
  onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ duration, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  // Calculate percentage of time remaining for the progress bar
  const percentage = (timeLeft / duration) * 100;

  // Determine color based on time remaining
  let progressColorClass = 'bg-green-500';
  if (percentage < 30) {
    progressColorClass = 'bg-red-500';
  } else if (percentage < 60) {
    progressColorClass = 'bg-yellow-400';
  }

  useEffect(() => {
    if (timeLeft === 0) {
      onTimeUp();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onTimeUp]);

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
          className={`h-full ${progressColorClass} transition-all duration-1000 ease-linear`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Timer;
