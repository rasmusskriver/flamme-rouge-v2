import { useGame } from './useGame';
import { PlayerMoveSummary } from './PlayerMoveSummary';
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

  const allPlayersMoved = players.length === 2 && players.every(p => {
    const playerRiders = riders.filter(r => r.player_id === p.id);
    const playerMoves = movesByPlayer[p.id] || [];
    return playerMoves.length === playerRiders.length;
  });

  // Debug logging
  console.log('Game.tsx Debug:', {
    playersLength: players.length,
    roundMovesLength: roundMoves.length,
    ridersPerPlayer: players.map(p => ({ playerId: p.id, riderCount: riders.filter(r => r.player_id === p.id).length })),
    movesByPlayer: Object.fromEntries(Object.entries(movesByPlayer).map(([playerId, moves]) => [playerId, moves.length])),
    allPlayersMoved,
    currentRound: game?.current_round
  });

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

  // Når spilleren har valgt kort for alle sine ryttere, vis kun egne valg og evt. fortsæt-knap
  const playerRiders = riders.filter(r => r.player_id === player.id);
  const playerMoves = movesByPlayer[player.id] || [];
  const playerHasMovedAll = playerMoves.length === playerRiders.length;

  // Hvis spilleren har valgt, men ikke alle har valgt: vis venteskærm
  if (playerHasMovedAll && !allPlayersMoved) {
    return (
      <div className="mt-12 text-center">
        <h3 className="text-2xl font-bold mb-6 text-slate-200">Vent på de andre spillere...</h3>
        <p className="text-lg text-slate-400">Når alle har valgt, kan du se dine valg og fortsætte.</p>
      </div>
    );
  }

  if (allPlayersMoved) {
    return <PlayerMoveSummary 
      moves={playerMoves} 
      riders={playerRiders} 
      currentRound={game.current_round}
      isPlayer1={player.name === 'Player 1'}
      onContinue={startNextRound}
    />;
  }

  // Mid-round: Player's turn
  return (
      <PlayerDashboard />
  );
}
