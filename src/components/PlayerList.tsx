interface PlayerListProps {
  players: string[];
}

export default function PlayerList({ players }: PlayerListProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Players ({players.length})</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {players.map((player) => (
          <div
            key={player}
            className="p-3 bg-gray-50 rounded-lg text-center font-medium"
          >
            {player}
          </div>
        ))}
      </div>
    </div>
  );
}
