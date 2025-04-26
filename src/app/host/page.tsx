export default function HostPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Host a Game</h1>
      <div className="max-w-md mx-auto">
        <button className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600">
          Create New Game
        </button>
      </div>
    </div>
  );
}
