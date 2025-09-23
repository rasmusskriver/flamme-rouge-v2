import { Rider } from './types';

interface RiderControlProps {
  rider: Rider;
  onCardSelect: (riderId: string, card: number) => void;
  selectedCard: number;
  drawCards: (rider: Rider) => void;
}

export function RiderControl({ rider, onCardSelect, selectedCard, drawCards }: RiderControlProps) {
  
  if (!rider.hand || rider.hand.length === 0) {
    return (
      <div className="rider-control">
        <h4>{rider.color} {rider.type}</h4>
        <p>Deck: {rider.deck.length} | Discard: {rider.discard_pile.length}</p>
        <button onClick={() => drawCards(rider)}>Draw Cards</button>
      </div>
    );
  }

  return (
    <div className="rider-control">
      <h4>{rider.color} {rider.type}</h4>
      <div className="hand">
        {rider.hand.map((card, index) => (
          <button
            key={`${card}-${index}`}
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
