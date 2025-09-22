import { useState } from 'react';
import { supabase } from './supabaseClient';
import { FatigueSlider } from './FatigueSlider';

// Define the Rider type again for clarity within the component
type Rider = {
  id: string;
  player_id: string;
  type: 'Sprinter' | 'Rouleur';
  color: 'Red' | 'Black' | 'Green' | 'Blue';
  deck: number[];
  hand: number[] | null;
  discard_pile: number[];
};

interface RiderControlProps {
  rider: Rider;
  onCardSelect: (riderId: string, card: number) => void;
  selectedCard: number | undefined;
}

export function RiderControl({ rider, onCardSelect, selectedCard }: RiderControlProps) {
  const [hand, setHand] = useState<number[]>(rider.hand || []);
  const [isLoading, setIsLoading] = useState(false);

  const drawCards = async () => {
    setIsLoading(true);
    let currentDeck = [...rider.deck];
    let currentDiscard = [...rider.discard_pile];

    if (currentDeck.length < 4) {
      // Reshuffle discard pile into deck
      console.log(`Reshuffling ${currentDiscard.length} cards for ${rider.color} ${rider.type}`);
      currentDeck.push(...currentDiscard.sort(() => Math.random() - 0.5));
      currentDiscard = [];
    }

    // If still not enough cards, add fatigue cards
    while (currentDeck.length < 4) {
        console.log(`Adding fatigue card to ${rider.color} ${rider.type}`);
        currentDeck.push(2); // Add a fatigue card
    }

    const newHand = currentDeck.slice(0, 4);
    const remainingDeck = currentDeck.slice(4);

    const { error } = await supabase
      .from('riders')
      .update({ 
        deck: remainingDeck,
        hand: newHand,
        discard_pile: currentDiscard // This is now empty if a reshuffle happened
      })
      .eq('id', rider.id);

    if (error) {
      console.error('Error drawing cards:', error);
    } else {
      setHand(newHand);
    }
    setIsLoading(false);
  };

  const [isAddingFatigue, setIsAddingFatigue] = useState(false);

  const addFatigueCard = async () => {
    if (isAddingFatigue) return;
    setIsAddingFatigue(true);

    const newDiscardPile = [...rider.discard_pile, 2];

    const { error } = await supabase
      .from('riders')
      .update({ discard_pile: newDiscardPile })
      .eq('id', rider.id);

    if (error) {
      console.error('Error adding fatigue card:', error);
    }
    // The UI will update automatically via the subscription in App.tsx
    setIsAddingFatigue(false);
  };

  return (
    <div className={`rider-control ${selectedCard ? 'move-selected' : ''}`}>
      <h4 style={{ backgroundColor: rider.color.toLowerCase(), padding: '5px', color: ['Black', 'Blue'].includes(rider.color) ? 'white' : 'black' }}>
        {rider.color} {rider.type}
      </h4>
      <p>Deck: {rider.deck.length} cards | Discard: {rider.discard_pile.length} cards</p>

      {hand.length === 0 ? (
        <button onClick={drawCards} disabled={isLoading}>{isLoading ? 'Drawing...' : 'Draw 4 Cards'}</button>
      ) : (
        <div className="hand-selection">
          <p>Choose a card:</p>
          <div className="card-options">
            {hand.map((card, index) => (
              <button 
                key={index} 
                className={`card ${selectedCard === card ? 'selected' : ''}`}
                onClick={() => onCardSelect(rider.id, card)}
              >
                {card}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="fatigue-zone">
        <FatigueSlider onConfirm={addFatigueCard} label=">> Add Fatigue" color={rider.color.toLowerCase()} />
      </div>
    </div>
  );
}
