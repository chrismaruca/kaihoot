interface Player {
  name: string;
  score: number;
}

interface LeaderboardProps {
  players: Player[];
}

export default function Leaderboard({ players }: LeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.name}
            className="flex justify-between items-center p-3 bg-gray-50 rounded"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold">{index + 1}.</span>
              <span>{player.name}</span>
            </div>
            <span className="font-bold">{player.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
