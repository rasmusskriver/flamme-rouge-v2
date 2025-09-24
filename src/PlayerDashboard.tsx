import { useState, useEffect } from 'react';
import { useGame } from './useGame';
import { RiderControl } from './RiderControl';

export function PlayerDashboard() {
  const { game, player, players, riders, roundMoves, drawCards, confirmMoves: confirmMovesHook } = useGame();
  const [selectedMoves, setSelectedMoves] = useState<{ [riderId: string]: { value: number; index: number } }>({});
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Reset state when round changes
  useEffect(() => {
    setSelectedMoves({});
    setIsConfirmed(false);
  }, [game?.current_round]);

  const myRiders = riders.filter(r => r.player_id === player?.id);
  
  // Check if current player has already confirmed moves for this round
  const myMovesForRound = roundMoves.filter(move => move.player_id === player?.id && move.round === game?.current_round);
  const hasConfirmedMoves = myMovesForRound.length === myRiders.length;

  // Check if all players have confirmed their moves
  const movesByPlayer = roundMoves.filter(move => move.round === game?.current_round).reduce((acc, move) => {
    if (!acc[move.player_id]) acc[move.player_id] = [];
    acc[move.player_id].push(move);
    return acc;
  }, {} as Record<string, any[]>);
  
  const allPlayersMoved = players.length === 2 && players.every(p => {
    const playerRiders = riders.filter(r => r.player_id === p.id);
    const playerMoves = movesByPlayer[p.id] || [];
    return playerMoves.length === playerRiders.length;
  });

  // Debug logging
  console.log('PlayerDashboard Debug:', {
    playersLength: players.length,
    roundMovesLength: roundMoves.length,
    myRidersLength: myRiders.length,
    myMovesLength: myMovesForRound.length,
    movesByPlayer: Object.fromEntries(Object.entries(movesByPlayer).map(([playerId, moves]) => [playerId, moves.length])),
    allPlayersMoved,
    hasConfirmedMoves,
    currentRound: game?.current_round
  });

  const handleCardSelect = (riderId: string, card: number, cardIndex: number) => {
    setSelectedMoves((current) => ({
      ...current,
      [riderId]: { value: card, index: cardIndex },
    }));
  };

  const allMovesSelected = myRiders.length > 0 && myRiders.every((rider) => selectedMoves[rider.id] !== undefined);

  const confirmMoves = async () => {
    if (!allMovesSelected) return;
    // Convert selectedMoves to the format expected by confirmMovesHook
    const movesForConfirmation = Object.fromEntries(
      Object.entries(selectedMoves).map(([riderId, move]) => [riderId, move.value])
    );
    await confirmMovesHook(movesForConfirmation, myRiders);
    setIsConfirmed(true);
  };

  // After moves are confirmed - use hasConfirmedMoves instead of isConfirmed
  if (hasConfirmedMoves || isConfirmed) {
    // If all players have moved, don't show the waiting message - Game component will handle this
    if (allPlayersMoved) {
      return null; // Let Game.tsx handle the results view
    }
    
    return (
      <div className="text-center p-8 bg-slate-700 rounded-lg">
        <h3 className="text-2xl font-bold mb-4 text-slate-200">Your moves for round {game?.current_round} are locked in!</h3>
        <ul className="space-y-2 my-4">
          {myRiders.map(rider => (
            <li key={rider.id} className="flex items-center justify-center gap-2 text-lg bg-slate-600 p-2 rounded-md max-w-sm mx-auto">
              <span className="font-bold">{rider.color} {rider.type}:</span>
              <span className="font-mono text-yellow-400">{selectedMoves[rider.id]?.value || myMovesForRound.find(m => m.rider_id === rider.id)?.selected_card}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-slate-400 animate-pulse">Waiting for the other player to confirm their moves...</p>
      </div>
    );
  }

  // During move selection
  return (
    <div>
      <h3 className="text-3xl font-bold mb-6 text-center text-slate-200">Round {game?.current_round} - Plan Your Moves</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 auto-rows-fr">
        {myRiders.map((rider) => (
          <RiderControl 
            key={rider.id}
            rider={rider}
            onCardSelect={handleCardSelect}
            selectedCard={selectedMoves[rider.id]}
            drawCards={drawCards}
            className="h-[450px]"
          />
        ))}
      </div>
      <div className="text-center">
        <button 
          onClick={confirmMoves} 
          disabled={!allMovesSelected}
          className="w-full max-w-xs mx-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {allMovesSelected ? 'Confirm All Moves' : 'Select a card for each rider'}
        </button>
      </div>
    </div>
  );
}
