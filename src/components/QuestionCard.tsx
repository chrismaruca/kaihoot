import { QuestionCardProps } from "@/types/types";

export default function QuestionCard({ question, onAnswer, optionColors }: QuestionCardProps) {
  const colors = optionColors || ['#e21b3c', '#1368ce', '#26890c', '#ffa602']; // Default colors

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">{question.text}</h2>
      <div className="grid grid-cols-2 gap-4">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswer(index)}
            className="p-4 rounded-lg text-white font-bold transition-transform hover:scale-105"
            style={{ backgroundColor: colors[index % colors.length] }} // Cycle through colors
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
