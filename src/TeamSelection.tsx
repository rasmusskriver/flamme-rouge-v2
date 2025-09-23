import { useState } from 'react';
import { useGame } from './useGame';
import { supabase } from './supabaseClient';

const COLORS = ['Red', 'Black', 'Green', 'Blue'];
const SPRINTER_DECK = [2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 9, 9, 9];
const ROULEUR_DECK = [3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7];

const shuffle = (array: number[]) => array.sort(() => Math.random() - 0.5);

// Tailwind doesn't support dynamic class names well, so we map colors to classes
const colorClasses: { [key: string]: { bg: string; text: string; ring: string } } = {
  Red: { bg: 'bg-red-600', text: 'text-white', ring: 'ring-red-400' },
  Black: { bg: 'bg-gray-800', text: 'text-white', ring: 'ring-gray-400' },
  Green: { bg: 'bg-green-600', text: 'text-white', ring: 'ring-green-400' },
  Blue: { bg: 'bg-blue-600', text: 'text-white', ring: 'ring-blue-400' },
};

export function TeamSelection() {
  const { game, player, players } = useGame();
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [error, setError] = useState('');
  const isPlayer1 = player?.name === 'Player 1';

  const handleSelectColor = (color: string) => {
    if (!isPlayer1) return;
    setSelectedColors((current) =>
      current.includes(color)
        ? current.filter((c) => c !== color)
        : current.length < 2 ? [...current, color] : current
    );
  };

  const confirmTeams = async () => {
    if (selectedColors.length !== 2) {
      setError('You must select exactly 2 colors.');
      return;
    }
    setError('');

    const otherPlayer = players.find(p => p.id !== player?.id);
    if (!otherPlayer) {
      setError('Could not find the other player.');
      return;
    }

    const player1Colors = selectedColors;
    const player2Colors = COLORS.filter((c) => !player1Colors.includes(c));

    const ridersToCreate = [
      ...player1Colors.flatMap((color) => [
        { game_id: game!.id, player_id: player!.id, color, rider_type: 'Sprinter', deck: shuffle([...SPRINTER_DECK]), discard_pile: [] },
        { game_id: game!.id, player_id: player!.id, color, rider_type: 'Rouleur', deck: shuffle([...ROULEUR_DECK]), discard_pile: [] },
      ]),
      ...player2Colors.flatMap((color) => [
        { game_id: game!.id, player_id: otherPlayer.id, color, rider_type: 'Sprinter', deck: shuffle([...SPRINTER_DECK]), discard_pile: [] },
        { game_id: game!.id, player_id: otherPlayer.id, color, rider_type: 'Rouleur', deck: shuffle([...ROULEUR_DECK]), discard_pile: [] },
      ]),
    ];

    const { error: insertError } = await supabase.from('riders').insert(ridersToCreate);
    if (insertError) {
      console.error('Error creating riders:', insertError);
      setError('Failed to create teams. Please try again.');
    } else {
      await supabase.from('games').update({ game_state: 'active' }).eq('id', game!.id);
    }
  };

  return (
    <div className="text-center">
      <h3 className="text-3xl font-bold mb-2 text-slate-200">Team Selection</h3>
      <p className="mb-6 text-slate-400">
        {isPlayer1 ? 'As Player 1, choose two teams for yourself. The other two will be assigned to Player 2.' : 'Waiting for Player 1 to choose teams...'}
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
        {COLORS.map((color) => {
          const isSelected = selectedColors.includes(color);
          const isDisabled = !isPlayer1 || (selectedColors.length >= 2 && !isSelected);
          const classes = colorClasses[color];

          return (
            <button
              key={color}
              onClick={() => handleSelectColor(color)}
              className={`p-6 rounded-lg text-xl font-bold transition-all duration-200 ease-in-out transform 
                ${classes.bg} ${classes.text} 
                ${isPlayer1 ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
                ${isSelected ? `ring-4 ${classes.ring} scale-105` : 'ring-0'}
                ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              disabled={!isPlayer1}
            >
              {color}
            </button>
          );
        })}
      </div>

      {error && <p className="bg-red-900 text-red-200 border border-red-700 rounded-lg p-3 my-4">{error}</p>}

      {isPlayer1 && (
        <div className="mt-8">
          <button 
            onClick={confirmTeams} 
            disabled={selectedColors.length !== 2}
            className="w-full max-w-xs mx-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Teams
          </button>
        </div>
      )}
    </div>
  );
}
