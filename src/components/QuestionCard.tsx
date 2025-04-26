interface QuestionCardProps {
  question: string;
  options: string[];
  timeLimit: number;
  onAnswer: (index: number) => void;
}

export default function QuestionCard({ question, options, onAnswer }: QuestionCardProps) {
  const colors = ['#e21b3c', '#1368ce', '#26890c', '#ffa602'];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">{question}</h2>
      <div className="grid grid-cols-2 gap-4">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswer(index)}
            className="p-4 rounded-lg text-white font-bold transition-transform hover:scale-105"
            style={{ backgroundColor: colors[index] }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
