export type Rider = {
  id: string;
  player_id: string;
  rider_type: 'Sprinter' | 'Rouleur';
  color: string;
  deck: number[];
  hand: number[] | null;
  discard_pile: number[];
};

export type Player = { id: string; name: string };

export type Game = { 
  id: string; 
  game_code: string;
  game_state: string; 
  current_round: number; 
};

export type Move = { 
  player_id: string; 
  rider_id: string; 
  selected_card: number; 
  round: number; 
};
