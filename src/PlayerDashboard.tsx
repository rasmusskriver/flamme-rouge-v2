import { useState } from 'react';
import { supabase } from './supabaseClient';
import { RiderControl } from './RiderControl';

// Define the Rider type again for clarity
type Rider = {
  id: string;
  player_id: string;
  type: 'Sprinter' | 'Rouleur';
  color: 'Red' | 'Black' | 'Green' | 'Blue';
  deck: number[];
  hand: number[] | null;
  discard_pile: number[];
};

interface PlayerDashboardProps {
  gameId: string;
  player: { id: string; name: string };
  myRiders: Rider[];
  round: number;
}

export function PlayerDashboard({ gameId, player, myRiders, round }: PlayerDashboardProps) {
  const [selectedMoves, setSelectedMoves] = useState<{ [riderId: string]: number }>({});
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleCardSelect = (riderId: string, card: number) => {
    setSelectedMoves((current) => ({
      ...current,
      [riderId]: card,
    }));
  };

  const allMovesSelected = myRiders.length > 0 && myRiders.every((rider) => selectedMoves[rider.id] !== undefined);

  const confirmMoves = async () => {
    if (!allMovesSelected) return;

    const movesToInsert = myRiders.map(rider => ({
      game_id: gameId,
      player_id: player.id,
      rider_id: rider.id,
      selected_card: selectedMoves[rider.id],
      round: round,
    }));

    // 1. Insert all moves into the database
    const { error } = await supabase.from('player_moves').insert(movesToInsert);

    if (error) {
      console.error('Error confirming moves:', error);
      return;
    }

    // 2. Update each rider's deck state (move hand to discard)
    const riderUpdates = myRiders.map(rider => {
        const playedCard = selectedMoves[rider.id];
        const remainingHand = rider.hand?.filter(c => c !== playedCard) || [];
        const newDiscardPile = [...rider.discard_pile, playedCard, ...remainingHand];

        return supabase
            .from('riders')
            .update({ 
                hand: [], // Clear hand
                discard_pile: newDiscardPile
            })
            .eq('id', rider.id);
    });

    await Promise.all(riderUpdates);

    setIsConfirmed(true);
  };

  if (isConfirmed) {
    return (
        <div className="player-dashboard">
            <h3>Your moves for round {round} are locked in!</h3>
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
      <h3>Round {round} - Plan Your Moves</h3>
      <div className="riders-container">
        {myRiders.map((rider) => (
          <RiderControl 
            key={rider.id} 
            rider={rider} 
            onCardSelect={handleCardSelect} 
            selectedCard={selectedMoves[rider.id]}
          />
        ))}
      </div>
      <button onClick={confirmMoves} disabled={!allMovesSelected} className="confirm-moves-btn">
        {allMovesSelected ? 'Confirm All Moves' : 'Select a card for each rider'}
      </button>
    </div>
  );
}
