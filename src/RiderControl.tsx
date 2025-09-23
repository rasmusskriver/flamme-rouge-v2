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
  onCardSelect: (riderId: string, card: number, cardIndex: number) => void;
  selectedCard?: { value: number; index: number }; // Track both value and index
  drawCards: (rider: Rider) => void;
}

export function RiderControl({ rider, onCardSelect, selectedCard, drawCards }: RiderControlProps) {
  const riderColorClass = colorClasses[rider.color] || { border: 'border-slate-500', text: 'text-slate-400' };
  
  // Create a visual icon/badge for rider type
  const riderTypeIcon = rider.type === 'Sprinter' ? '⚡' : '🔄';
  const riderTypeColor = rider.type === 'Sprinter' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white';

  // State when hand needs to be drawn
  if (!rider.hand || rider.hand.length === 0) {
    return (
      <div className={`bg-slate-700 rounded-lg p-4 text-center border-2 ${riderColorClass.border} h-[450px] flex flex-col justify-center`}>
        <div className="mb-4">
          <h4 className={`text-2xl font-bold ${riderColorClass.text}`}>{rider.color}</h4>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold mt-2 ${riderTypeColor}`}>
            <span>{riderTypeIcon}</span>
            <span>{rider.type}</span>
          </div>
        </div>
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
    <div className={`bg-slate-700 rounded-lg p-4 border-2 ${selectedCard ? riderColorClass.border : 'border-transparent'} h-[450px] flex flex-col`}>
      <div className="text-center mb-4">
        <h4 className={`text-2xl font-bold ${riderColorClass.text}`}>{rider.color}</h4>
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold mt-2 ${riderTypeColor}`}>
          <span>{riderTypeIcon}</span>
          <span>{rider.type}</span>
        </div>
        <p className="text-sm text-slate-400 mt-2">Select a card</p>
      </div>
      <div className="grid grid-cols-4 gap-3 flex-1">
        {rider.hand.map((card, index) => {
          const isSelected = selectedCard?.index === index;
          return (
            <button
              key={`${rider.id}-card-${index}`}
              onClick={() => onCardSelect(rider.id, card, index)}
              className={`relative aspect-[3/4] rounded-md flex items-center justify-center text-2xl font-bold transition-all duration-150
                ${isSelected 
                  ? 'bg-slate-900 ring-4 ring-red-500 scale-95 shadow-lg' 
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
