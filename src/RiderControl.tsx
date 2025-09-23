import { Rider } from './types';

// Map rider colors to Tailwind classes for consistency
const colorClasses: { [key: string]: { border: string; text: string } } = {
  Red: { border: 'border-red-500', text: 'text-red-400' },
  Black: { border: 'border-gray-500', text: 'text-gray-400' },
  Green: { border: 'border-green-500', text: 'text-green-400' },
  Blue: { border: 'border-blue-500', text: 'text-blue-400' },
};

interface RiderControlProps {
  rider: Rider;
  onCardSelect: (riderId: string, card: number) => void;
  selectedCard?: number; // Make it optional to handle undefined case better
  drawCards: (rider: Rider) => void;
}

export function RiderControl({ rider, onCardSelect, selectedCard, drawCards }: RiderControlProps) {
  const riderColorClass = colorClasses[rider.color] || { border: 'border-slate-500', text: 'text-slate-400' };

  // State when hand needs to be drawn
  if (!rider.hand || rider.hand.length === 0) {
    return (
      <div className={`bg-slate-700 rounded-lg p-4 text-center border-2 ${riderColorClass.border}`}>
        <h4 className={`text-2xl font-bold ${riderColorClass.text}`}>{rider.color} {rider.rider_type}</h4>
        <div className="my-4">
          <p className="text-sm text-slate-400">Deck: <span className="font-bold text-white">{rider.deck.length}</span></p>
          <p className="text-sm text-slate-400">Discard: <span className="font-bold text-white">{rider.discard_pile.length}</span></p>
        </div>
        <button 
          className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
          onClick={() => drawCards(rider)}
        >
          Draw 4 Cards
        </button>
      </div>
    );
  }

  // State when selecting a card from hand
  return (
    <div className={`bg-slate-700 rounded-lg p-4 border-2 ${selectedCard ? riderColorClass.border : 'border-transparent'}`}>
      <h4 className={`text-2xl font-bold text-center ${riderColorClass.text}`}>{rider.color} {rider.rider_type}</h4>
      <p className="text-center text-sm text-slate-400 mb-4">Select a card</p>
      <div className="grid grid-cols-4 gap-3">
        {rider.hand.map((card, index) => {
          const isSelected = selectedCard === card;
          return (
            <button
              key={`${card}-${index}`}
              onClick={() => onCardSelect(rider.id, card)}
              className={`relative aspect-[3/4] rounded-md flex items-center justify-center text-2xl font-bold transition-all duration-150 transform
                ${isSelected 
                  ? 'bg-slate-900 ring-4 ring-red-500 -translate-y-1 shadow-lg' 
                  : 'bg-slate-800 hover:bg-slate-900 hover:scale-105'
                }`}
            >
              <span className="absolute top-1 left-2 text-base">{card}</span>
              <span className="text-4xl">{card}</span>
              <span className="absolute bottom-1 right-2 text-base transform rotate-180">{card}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
