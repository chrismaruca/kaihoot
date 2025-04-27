import React, { useState } from 'react';
import { HostQuestionCardProps } from '@/types/types';

const HostQuestionCard: React.FC<HostQuestionCardProps> = ({
  question,
  onSelect,
  optionColors = [],
}) => {
  const handleCardClick = () => {
    onSelect();
  };

  return (
    <div>
        <div
          className="p-4 mb-6 border-2 rounded-lg border-gray-300 shadow-md hover:shadow-lg" // Added spacing with `mb-6`
          style={{
            backgroundColor: '',
            color: '',
            transition: 'background-color 0.3s, color 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e0e0e0';
            e.currentTarget.style.color =  '#000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '';
            e.currentTarget.style.color = '';
          }}
          onClick={() => handleCardClick()} // Handle card click
        >
          <h2 className="text-xl font-bold text-gray-800">{question.text}</h2>
          <div className='text-xl font-bold mb-3 text-gray-600 border-b pb-2'></div>
          <ul>
            {question.options.map((option, optionIndex) => (
              <li
                key={optionIndex}
                className="p-2 rounded-md mb-2"
                style={{
                  backgroundColor: optionColors[optionIndex % optionColors.length] || '#ccc',
                  color: '#fff',
                }}
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
    </div>
  );
};

export default HostQuestionCard;
