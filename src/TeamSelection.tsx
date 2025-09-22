import { useState } from 'react';
import { supabase } from './supabaseClient';

const COLORS = ['Red', 'Black', 'Green', 'Blue'];
const SPRINTER_DECK = [2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 9, 9, 9];
const ROULEUR_DECK = [3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7];

// Helper to shuffle an array
const shuffle = (array: number[]) => {
  return array.sort(() => Math.random() - 0.5);
};

interface TeamSelectionProps {
  gameId: string;
  player: { id: string; name: string };
}

export function TeamSelection({ gameId, player }: TeamSelectionProps) {
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [error, setError] = useState('');
  const isPlayer1 = player.name === 'Player 1';

  const handleSelectColor = (color: string) => {
    if (!isPlayer1) return; // Only Player 1 can select

    setSelectedColors((current) =>
      current.includes(color)
        ? current.filter((c) => c !== color)
        : [...current, color]
    );
  };

  const confirmTeams = async () => {
    if (selectedColors.length !== 2) {
      setError('You must select exactly 2 colors.');
      return;
    }
    setError('');

    // Get the other player
    const { data: otherPlayer, error: playerError } = await supabase
      .from('players')
      .select('id')
      .eq('game_id', gameId)
      .neq('id', player.id)
      .single();

    if (playerError || !otherPlayer) {
      console.error('Could not find the other player.');
      return;
    }

    const player1Colors = selectedColors;
    const player2Colors = COLORS.filter((c) => !player1Colors.includes(c));

    const ridersToCreate = [
      // Player 1's riders
      ...player1Colors.flatMap((color) => [
        { game_id: gameId, player_id: player.id, color, rider_type: 'Sprinter', deck: shuffle([...SPRINTER_DECK]), discard_pile: [] },
        { game_id: gameId, player_id: player.id, color, rider_type: 'Rouleur', deck: shuffle([...ROULEUR_DECK]), discard_pile: [] },
      ]),
      // Player 2's riders
      ...player2Colors.flatMap((color) => [
        { game_id: gameId, player_id: otherPlayer.id, color, rider_type: 'Sprinter', deck: shuffle([...SPRINTER_DECK]), discard_pile: [] },
        { game_id: gameId, player_id: otherPlayer.id, color, rider_type: 'Rouleur', deck: shuffle([...ROULEUR_DECK]), discard_pile: [] },
      ]),
    ];

    // Insert all riders into the database
    const { error: insertError } = await supabase.from('riders').insert(ridersToCreate);
    if (insertError) {
      console.error('Error creating riders:', insertError);
      setError('Failed to create teams. Please try again.');
    } else {
      // Optionally, update game state to 'active'
      await supabase.from('games').update({ game_state: 'active' }).eq('id', gameId);
    }
  };

  return (
    <div className="team-selection">
      <h3>Team Selection</h3>
      <p>{isPlayer1 ? 'Choose 2 teams:' : 'Waiting for Player 1 to choose teams...'}</p>
      <div className="color-picker">
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => handleSelectColor(color)}
            className={`color-btn ${selectedColors.includes(color) ? 'selected' : ''}`}
            style={{ backgroundColor: color.toLowerCase(), color: ['Black', 'Blue'].includes(color) ? 'white' : 'black' }}
            disabled={!isPlayer1 || (selectedColors.length >= 2 && !selectedColors.includes(color))}
          >
            {color}
          </button>
        ))}
      </div>
      {isPlayer1 && <button onClick={confirmTeams} disabled={selectedColors.length !== 2}>Confirm Teams</button>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
