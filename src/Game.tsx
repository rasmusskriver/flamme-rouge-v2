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

  if (riders.length === 0) {
    return players.length === 2 ? <TeamSelection /> : <p>Waiting for Player 2...</p>;
  }

  if (allPlayersMoved) {
    return (
      <div>
        <h3>Results for Round {game.current_round}</h3>
        {Object.entries(movesByPlayer).map(([pid, moves]) => (
          <div key={pid}>
            <h4>{players.find(p => p.id === pid)?.name}'s Moves:</h4>
            <ul>{moves.map(m => <li key={m.rider_id}>{riders.find(r => r.id === m.rider_id)?.color}: {m.selected_card}</li>)}</ul>
          </div>
        ))}
        {player.name === 'Player 1' && <button onClick={startNextRound}>Start Next Round</button>}
      </div>
    );
  }

  return (
      <PlayerDashboard />
  );
}
