import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { TeamSelection } from './TeamSelection';
import { PlayerDashboard } from './PlayerDashboard';
import './App.css';

// Type definitions
type Rider = { id: string; player_id: string; type: 'Sprinter' | 'Rouleur'; color: string; deck: number[]; hand: number[] | null; discard_pile: number[]; };
type Player = { id: string; name: string };
type Game = { id: string; game_state: string; current_round: number };
type Move = { player_id: string; rider_id: string; selected_card: number };

function App() {
  const [game, setGame] = useState<Game | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [roundMoves, setRoundMoves] = useState<Move[]>([]);
  const [joinGameId, setJoinGameId] = useState('');

  // --- Effects for setup and real-time subscriptions ---
  useEffect(() => {
    const reJoinGame = async (gid: string, pid: string) => {
      const { data: gameData } = await supabase.from('games').select('*').eq('id', gid).single();
      const { data: playerData } = await supabase.from('players').select('id, name').eq('id', pid).single();
      if (gameData && playerData) {
        setGame(gameData);
        setPlayer(playerData);
      } else {
        localStorage.clear();
      }
    };
    const storedGameId = localStorage.getItem('flammeRougeGameId');
    const storedPlayerId = localStorage.getItem('flammeRougePlayerId');
    if (storedGameId && storedPlayerId) reJoinGame(storedGameId, storedPlayerId);
  }, []);

  useEffect(() => {
    if (!game) return;

    const fetchAll = async () => {
      const { data: playersData } = await supabase.from('players').select('*').eq('game_id', game.id);
      setPlayers(playersData || []);
      const { data: ridersData } = await supabase.from('riders').select<any, Rider>('*').eq('game_id', game.id);
      setRiders(ridersData || []);
      const { data: movesData } = await supabase.from('player_moves').select<any, Move>('*').eq('game_id', game.id).eq('round', game.current_round);
      setRoundMoves(movesData || []);
    };
    fetchAll();

    const gameSub = supabase.channel(`game-${game.id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${game.id}` }, payload => setGame(payload.new as Game)).subscribe();
    const playerSub = supabase.channel(`players-${game.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'players', filter: `game_id=eq.${game.id}` }, payload => setPlayers(curr => [...curr, payload.new as Player])).subscribe();
    const riderSub = supabase.channel(`riders-${game.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'riders', filter: `game_id=eq.${game.id}` }, () => fetchAll()).subscribe();
    const movesSub = supabase.channel(`moves-${game.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'player_moves', filter: `game_id=eq.${game.id}` }, payload => setRoundMoves(curr => [...curr, payload.new as Move])).subscribe();

    return () => {
      supabase.removeChannel(gameSub);
      supabase.removeChannel(playerSub);
      supabase.removeChannel(riderSub);
      supabase.removeChannel(movesSub);
    };
  }, [game?.id]);

  // --- Game Actions ---
  const handleLogin = (g: Game, p: Player) => {
    setGame(g);
    setPlayer(p);
    localStorage.setItem('flammeRougeGameId', g.id);
    localStorage.setItem('flammeRougePlayerId', p.id);
  };

  const createGame = async () => {
    const { data: g } = await supabase.from('games').insert({}).select('*').single();
    const { data: p } = await supabase.from('players').insert({ game_id: g.id, name: 'Player 1' }).select('id, name').single();
    if (g && p) handleLogin(g, p);
  };

  const joinGame = async () => {
    const { data: playersInGame } = await supabase.from('players').select('id').eq('game_id', joinGameId);
    if (!playersInGame || playersInGame.length >= 2) { alert('Game not found or is full.'); return; }
    const { data: g } = await supabase.from('games').select('*').eq('id', joinGameId).single();
    const { data: p } = await supabase.from('players').insert({ game_id: joinGameId, name: 'Player 2' }).select('id, name').single();
    if (g && p) handleLogin(g, p);
  };

  const startNextRound = async () => {
    if (!game) return;
    await supabase.from('games').update({ current_round: game.current_round + 1 }).eq('id', game.id);
  };

  // --- Render Logic ---
  const renderGameContent = () => {
    if (!game || !player) return null;

    const myRiders = riders.filter(r => r.player_id === player.id);
    const movesByPlayer = roundMoves.reduce((acc, move) => {
        if (!acc[move.player_id]) acc[move.player_id] = [];
        acc[move.player_id].push(move);
        return acc;
    }, {} as Record<string, Move[]>);

    const allPlayersMoved = players.length === 2 && players.every(p => movesByPlayer[p.id]?.length === myRiders.length);
    const iHaveMoved = movesByPlayer[player.id]?.length === myRiders.length;

    if (riders.length === 0) {
      return players.length === 2 ? <TeamSelection gameId={game.id} player={player} /> : <p>Waiting for Player 2...</p>;
    }

    if (allPlayersMoved) {
      return (
        <div>
          <h3>Results for Round {game.current_round}</h3>
          {Object.entries(movesByPlayer).map(([pid, moves]) => (
            <div key={pid}>
              <h4>{players.find(p => p.id === pid)?.name}'s Moves:</h4>
              <ul>{moves.map(m => <li key={m.rider_id}>{riders.find(r => r.id === m.rider_id)?.color}: {m.selected_card}</li>)}</ul>
            </div>
          ))}
          {player.name === 'Player 1' && <button onClick={startNextRound}>Start Next Round</button>}
        </div>
      );
    }

    return (
        <PlayerDashboard gameId={game.id} player={player} myRiders={myRiders} round={game.current_round} />
    );
  };

  if (!game) {
    return (
      <div className="App lobby">
        <h1>Flamme Rouge</h1>
        <button onClick={createGame}>Start New Game</button>
        <hr />
        <div>
          <input type="text" placeholder="Enter Game ID" value={joinGameId} onChange={(e) => setJoinGameId(e.target.value)} />
          <button onClick={joinGame}>Join Game</button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header>
        <h1>Flamme Rouge</h1>
        <p>Game ID: <strong>{game.id}</strong> | Round: <strong>{game.current_round}</strong></p>
      </header>
      {renderGameContent()}
    </div>
  );
}

export default App;
