export default function JoinPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Join a Game</h1>
      <div className="max-w-md mx-auto space-y-4">
        <input
          type="text"
          placeholder="Enter game code"
          className="w-full p-3 border rounded-lg"
        />
        <input
          type="text"
          placeholder="Your nickname"
          className="w-full p-3 border rounded-lg"
        />
        <button className="w-full bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600">
          Join Game
        </button>
      </div>
    </div>
  );
}
