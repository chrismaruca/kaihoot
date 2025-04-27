export interface Question {
    text: string;
    options: [string, string, string, string]; // Fixed array of 4 options
    timeLimit: number; // Time limit in seconds
}

export interface QuestionCardProps {
    question: Question;
    onAnswer: (index: number) => void;
    optionColors?: [string, string, string, string]; // Fixed array of 4 colors
}

export interface HostQuestion extends Question {
    correctAnswer: string; // Correct answer as a string
    difficulty?: string; // Optional difficulty level
}

export interface HostQuestionCardProps {
    question: HostQuestion;
    onSelect: () => void;
    optionColors?: [string, string, string, string]; // Fixed array of 4 colors
}

export interface TranscriptStep {
    transcript: string;
    timestamp: string;
    context?: string;
}

export interface AnswerButtonProps {
    option: string;
    color: string;
    onClick: () => void;
    disabled?: boolean;
}

export interface GamePageProps {
    params: GameParams;
}

export interface GameParams {
    gameId: string;
}

export interface Player {
    name: string;
    avatar: string;
}