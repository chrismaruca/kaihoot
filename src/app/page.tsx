import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">k-AI-hoot!</h1>
      <div className="flex gap-4">
        <Link
          href="/host"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600"
        >
          Host a Game
        </Link>
        <Link
          href="/join"
          className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600"
        >
          Join a Game
        </Link>
      </div>
    </div>
  );
}
