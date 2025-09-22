import { useGame } from './useGame';
import { Rider } from './types';
import { supabase } from './supabaseClient';

interface RiderControlProps {
  rider: Rider;
  onCardSelect: (riderId: string, card: number) => void;
  selectedCard: number;
}

export function RiderControl({ rider, onCardSelect, selectedCard }: RiderControlProps) {
  const { game } = useGame();

  const drawCards = async () => {
    let deck = [...rider.deck];
    let discardPile = [...rider.discard_pile];
    let hand = [];

    if (deck.length < 4) {
      const shuffledDiscard = discardPile.sort(() => Math.random() - 0.5);
      deck = [...deck, ...shuffledDiscard];
      discardPile = [];
    }

    hand = deck.slice(0, 4);
    const newDeck = deck.slice(4);

    await supabase
      .from('riders')
      .update({ hand: hand, deck: newDeck, discard_pile: discardPile })
      .eq('id', rider.id);
  };

  if (!rider.hand || rider.hand.length === 0) {
    return (
      <div className="rider-control">
        <h4>{rider.color} {rider.type}</h4>
        <p>Deck: {rider.deck.length} | Discard: {rider.discard_pile.length}</p>
        <button onClick={drawCards}>Draw Cards</button>
      </div>
    );
  }

  return (
    <div className="rider-control">
      <h4>{rider.color} {rider.type}</h4>
      <div className="hand">
        {rider.hand.map((card) => (
          <button 
            key={card} 
            onClick={() => onCardSelect(rider.id, card)}
            className={selectedCard === card ? 'selected' : ''}
          >
            {card}
          </button>
        ))}
      </div>
    </div>
  );
}
