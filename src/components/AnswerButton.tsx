interface AnswerButtonProps {
  option: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function AnswerButton({ option, color, onClick, disabled }: AnswerButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-4 rounded-lg text-white font-bold transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
      style={{ backgroundColor: color }}
    >
      {option}
    </button>
  );
}
