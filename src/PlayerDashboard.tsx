import { useState } from 'react';
import { useGame } from './useGame';
import { supabase } from './supabaseClient';
import { RiderControl } from './RiderControl';
import { Rider } from './types';

export function PlayerDashboard() {
  const { game, player, riders, roundMoves, drawCards, confirmMoves: confirmMovesHook } = useGame();
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

  if (isConfirmed) {
    return (
        <div className="player-dashboard">
            <h3>Your moves for round {game?.current_round} are locked in!</h3>
            <ul>
                {myRiders.map(rider => (
                    <li key={rider.id}>{rider.color} {rider.type} played: <strong>{selectedMoves[rider.id]}</strong></li>
                ))}
            </ul>
            <p>Waiting for the other player to confirm their moves...</p>
        </div>
    );
  }

  return (
    <div className="player-dashboard">
      <h3>Round {game?.current_round} - Plan Your Moves</h3>
      <div className="riders-container">
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
      <button onClick={confirmMoves} disabled={!allMovesSelected} className="confirm-moves-btn">
        {allMovesSelected ? 'Confirm All Moves' : 'Select a card for each rider'}
      </button>
    </div>
  );
}