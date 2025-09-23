import { useGame } from './useGame';
import { TeamSelection } from './TeamSelection';
import { PlayerDashboard } from './PlayerDashboard';
import { Move } from './types';

export function Game() {
  const { game, player, players, riders, roundMoves, startNextRound } = useGame();

  if (!game || !player) return null;

  const movesByPlayer = roundMoves.reduce((acc, move) => {
      if (!acc[move.player_id]) acc[move.player_id] = [];
      acc[move.player_id].push(move);
      return acc;
  }, {} as Record<string, Move[]>);

  const allPlayersMoved = players.length === 2 && players.every(p => movesByPlayer[p.id]?.length === 2);

  // Pre-game: Team Selection or Waiting
  if (riders.length === 0) {
    if (players.length === 2) {
      return <TeamSelection />;
    }
    return (
      <div className="text-center p-8 bg-slate-700 rounded-lg animate-pulse">
        <p className="text-xl text-slate-300">Waiting for Player 2 to join...</p>
      </div>
    );
  }

  // End of Round: Show Results
  if (allPlayersMoved) {
    return (
      <div className="mt-4 text-center">
        <h3 className="text-3xl font-bold mb-6 text-slate-200">Results for Round {game.current_round}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {players.map(p => (
            <div key={p.id} className="bg-slate-700 rounded-lg p-4">
              <h4 className="text-xl font-bold mb-3 text-white">{p.name}'s Moves:</h4>
              <ul className="space-y-2">
                {movesByPlayer[p.id]?.map(m => (
                  <li key={m.rider_id} className="flex items-center justify-center gap-2 text-lg bg-slate-600 p-2 rounded-md">
                    <span className="font-bold">{riders.find(r => r.id === m.rider_id)?.color} Rider:</span>
                    <span className="font-mono text-yellow-400">{m.selected_card}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {player.name === 'Player 1' && (
          <div className="mt-8">
            <button 
              onClick={startNextRound} 
              className="w-full max-w-xs mx-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105"
            >
              Start Next Round
            </button>
          </div>
        )}
      </div>
    );
  }

  // Mid-round: Player's turn
  return (
      <PlayerDashboard />
  );
}
