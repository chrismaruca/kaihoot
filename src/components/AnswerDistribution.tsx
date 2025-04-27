import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';

interface AnswerDistributionProps {
  gameId: string;
  options: string[];
  optionColors?: string[];
}

const AnswerDistribution: React.FC<AnswerDistributionProps> = ({
  gameId,
  options,
  optionColors = ['#e21b3c', '#1368ce', '#26890c', '#ffa602']
}) => {
  const [distribution, setDistribution] = useState<Record<number, number>>({});
  const [totalAnswers, setTotalAnswers] = useState<number>(0);

  useEffect(() => {
    console.log(`AnswerDistribution: Setting up listener for game ${gameId} with ${options?.length} options`);
    if (!gameId || !options || !options.length) {
      console.log("AnswerDistribution: Missing gameId or options");
      return;
    }

    const distributionRef = ref(database, `games/${gameId}/answerDistributions`);

    const unsubscribe = onValue(distributionRef, (snapshot) => {
      console.log(`AnswerDistribution: Data received for ${gameId}`, snapshot.val());
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDistribution(data);

        // Calculate total answers
        const total = Object.values(data).reduce((sum: number, count: any) => sum + count, 0);
        setTotalAnswers(total);
        console.log(`AnswerDistribution: Total answers: ${total}`);
      } else {
        console.log("AnswerDistribution: No distribution data, initializing with zeros");
        // Initialize with zeros
        const initialDist = options.reduce((acc, _, idx) => ({ ...acc, [idx]: 0 }), {});
        setDistribution(initialDist);
        setTotalAnswers(0);
      }
    });

    return () => unsubscribe();
  }, [gameId, options]);

  if (!options || options.length === 0) {
    console.log("AnswerDistribution: No options to render");
    return <div>No options available</div>;
  }

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-md">
      <div className="space-y-3">
        {options.map((option, index) => {
          const count = distribution[index] || 0;
          const percentage = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
          const barColor = optionColors[index % optionColors.length];

          return (
            <div key={index} className="flex flex-col">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 truncate">{option}</span>
                <span className="text-sm font-medium text-gray-700">{percentage}% ({count})</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="h-4 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: barColor
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnswerDistribution;
