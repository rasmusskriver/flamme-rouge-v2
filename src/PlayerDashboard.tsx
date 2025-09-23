import { useState } from 'react';
import { useGame } from './useGame';
import { RiderControl } from './RiderControl';

export function PlayerDashboard() {
  const { game, player, riders, drawCards, confirmMoves: confirmMovesHook } = useGame();
  const [selectedMoves, setSelectedMoves] = useState<{ [riderId: string]: number }>({});
  const [isConfirmed, setIsConfirmed] = useState(false);

  const myRiders = riders.filter(r => r.player_id === player?.id);

  const handleCardSelect = (riderId: string, card: number) => {
    setSelectedMoves((current) => ({
      ...current,
      [riderId]: card,
    }));
  };

  const allMovesSelected = myRiders.length > 0 && myRiders.every((rider) => selectedMoves[rider.id] !== undefined);

  const confirmMoves = async () => {
    if (!allMovesSelected) return;
    await confirmMovesHook(selectedMoves, myRiders);
    setIsConfirmed(true);
  };

  // After moves are confirmed
  if (isConfirmed) {
    return (
      <div className="text-center p-8 bg-slate-700 rounded-lg">
        <h3 className="text-2xl font-bold mb-4 text-slate-200">Your moves for round {game?.current_round} are locked in!</h3>
        <ul className="space-y-2 my-4">
          {myRiders.map(rider => (
            <li key={rider.id} className="flex items-center justify-center gap-2 text-lg bg-slate-600 p-2 rounded-md max-w-sm mx-auto">
              <span className="font-bold">{rider.color} {rider.rider_type}:</span>
              <span className="font-mono text-yellow-400">{selectedMoves[rider.id]}</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {myRiders.map((rider) => (
          <RiderControl 
            key={rider.id} 
            rider={rider} 
            onCardSelect={handleCardSelect} 
            selectedCard={selectedMoves[rider.id]}
            drawCards={drawCards}
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
