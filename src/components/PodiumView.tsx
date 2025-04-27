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

	// Ensure we have exactly 3 positions (fill with empty spots if needed)
	while (topPlayers.length < 3) {
		topPlayers.push({ name: '---', score: 0 });
	}

	// Display order is 2nd, 1st, 3rd place
	const displayOrder = [topPlayers[1], topPlayers[0], topPlayers[2]];

	return (
		<div className="p-4">
			<h3 className="text-2xl font-bold mb-6 text-center text-gray-900">Winner's Podium</h3>

			<div className="flex items-end justify-center w-full">
				{displayOrder.map((player, index) => {
					const position = index === 1 ? 0 : index === 0 ? 1 : 2;
					const height = position === 0 ? 'h-40' : position === 1 ? 'h-32' : 'h-24';
					const bgColor = position === 0 ? 'bg-yellow-400' : position === 1 ? 'bg-gray-300' : 'bg-amber-700';
					const medal = position === 0 ? '🥇' : position === 1 ? '🥈' : '🥉';
					const place = position === 0 ? '1st' : position === 1 ? '2nd' : '3rd';
					const textColor = position === 1 ? 'text-gray-800' : 'text-white';

					return (
						<div key={position} className="flex flex-col items-center mx-4 relative transition-transform hover:scale-105">
							{/* Player info with animated glow effect */}
							<div className={`mb-2 text-center ${position === 0 ? 'animate-pulse' : ''}`}>
								<div className="text-2xl mb-1">{medal}</div>
								<div className="font-bold text-gray-800">{player.name}</div>
								<div className="font-medium text-gray-700">{player.score} pts</div>
							</div>

							{/* Podium stand */}
							<div className={`${height} w-24 ${bgColor} rounded-t-lg flex items-center justify-center border-t-4 border-white shadow-lg`}>
								<span className={`font-bold ${textColor} text-xl`}>{place}</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default PodiumView;
