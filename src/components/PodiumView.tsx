import React from 'react';

interface Player {
	name: string;
	score: number;
}

interface PodiumViewProps {
	players: Player[];
}

const PodiumView: React.FC<PodiumViewProps> = ({ players }) => {
	// Sort players by score in descending order
	const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

	// Get top 3 players
	const topPlayers = sortedPlayers.slice(0, 3);

	// Make sure we have 3 positions even if less than 3 players
	while (topPlayers.length < 3) {
		topPlayers.push({ name: '', score: 0 });
	}

	// Rearrange to place first place in the middle
	// [1st, 2nd, 3rd] -> [2nd, 1st, 3rd]
	const displayOrder = [topPlayers[1], topPlayers[0], topPlayers[2]];

	return (
		<div className="flex flex-col items-center justify-end mt-8">
			<h2 className="text-2xl font-bold mb-8">Top Players</h2>

			<div className="flex items-end justify-center w-full">
				{displayOrder.map((player, index) => {
					const position = index === 1 ? 0 : index === 0 ? 1 : 2;
					const height = position === 0 ? 'h-40' : position === 1 ? 'h-32' : 'h-24';
					const bgColor = position === 0 ? 'bg-yellow-400' : position === 1 ? 'bg-gray-300' : 'bg-amber-700';
					const textSize = position === 0 ? 'text-2xl' : 'text-xl';
					const medal = position === 0 ? '🥇' : position === 1 ? '🥈' : '🥉';

					return (
						<div key={position} className="flex flex-col items-center mx-4">
							{player.name && (
								<>
									<div className="mb-2 text-center">
										<div className={`font-bold ${textSize}`}>{player.name}</div>
										<div className="text-gray-700">{player.score} points</div>
									</div>

									<div className={`flex items-center justify-center ${height} w-24 ${bgColor} rounded-t-lg relative`}>
										<span className="text-3xl mt-4">{medal}</span>
										<span className="font-bold text-white">{position + 1}</span>
									</div>
								</>
							)}
							{!player.name && (
								<div className={`${height} w-24 ${bgColor} rounded-t-lg opacity-50`}></div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default PodiumView;
