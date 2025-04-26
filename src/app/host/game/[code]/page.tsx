"use client";

import { useParams } from 'next/navigation';

export default function GamePage() {
  const params = useParams();
  const code = params?.code as string | undefined;

  if (!code) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold mb-8">Invalid Game Code</h1>
        <p className="text-lg">The game code is missing or invalid. Please check the URL and try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Game Code: {code}</h1>
      <p className="text-lg">Welcome to the game! The host will start the game shortly.</p>
    </div>
  );
}
