import React from 'react';

interface QuestionCardProps {
  question: string;
  options: string[];
  timeLimit: number;
  onAnswer: (index: number) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  options,
  timeLimit,
  onAnswer,
}) => {
  // Define option background colors
  const optionStyles = [
    { bg: 'bg-red-500 hover:bg-red-600', shadow: 'shadow-lg', transform: 'hover:scale-105' },
    { bg: 'bg-blue-500 hover:bg-blue-600', shadow: 'shadow-lg', transform: 'hover:scale-105' },
    { bg: 'bg-green-500 hover:bg-green-600', shadow: 'shadow-lg', transform: 'hover:scale-105' },
    { bg: 'bg-purple-500 hover:bg-purple-600', shadow: 'shadow-lg', transform: 'hover:scale-105' },
  ];

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200">
      <div className="p-6 bg-gradient-to-b from-blue-500 to-blue-600 text-white">
        <h2 className="text-xl md:text-2xl font-bold mb-2 text-center">{question}</h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => onAnswer(index)}
              className={`${optionStyles[index % 4].bg} ${optionStyles[index % 4].shadow} ${optionStyles[index % 4].transform}
                text-white py-4 px-6 rounded-lg text-lg transition-all duration-200 flex items-center justify-between`}
            >
              <span className="font-medium">{option}</span>
              <span className="bg-white bg-opacity-30 h-8 w-8 flex items-center justify-center rounded-full font-bold">
                {index + 1}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
