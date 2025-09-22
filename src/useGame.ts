import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Game, Player, Rider, Move } from './types';
import { generateGameCode, isValidGameCode } from './gameCodeUtils';

export function useGame() {
  const [game, setGame] = useState<Game | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [roundMoves, setRoundMoves] = useState<Move[]>([]);

  const handleLogin = (g: Game, p: Player) => {
    setGame(g);
    setPlayer(p);
    localStorage.setItem('flammeRougeGameId', g.id);
    localStorage.setItem('flammeRougePlayerId', p.id);
  };

  const reJoinGame = useCallback(async (gid: string, pid: string) => {
    const { data: gameData } = await supabase.from('games').select('*').eq('id', gid).single();
    const { data: playerData } = await supabase.from('players').select('id, name').eq('id', pid).single();
    if (gameData && playerData) {
      handleLogin(gameData, playerData);
    } else {
      localStorage.clear();
    }
  }, []);

  useEffect(() => {
    const storedGameId = localStorage.getItem('flammeRougeGameId');
    const storedPlayerId = localStorage.getItem('flammeRougePlayerId');
    if (storedGameId && storedPlayerId) {
      reJoinGame(storedGameId, storedPlayerId);
    }
  }, [reJoinGame]);

  useEffect(() => {
    if (!game) return;

    const fetchInitialData = async () => {
      const { data: playersData } = await supabase.from('players').select('*').eq('game_id', game.id);
      setPlayers(playersData || []);
      const { data: ridersData } = await supabase.from('riders').select<any, Rider>('*').eq('game_id', game.id);
      setRiders(ridersData || []);
      const { data: movesData } = await supabase.from('player_moves').select<any, Move>('*').eq('game_id', game.id).eq('round', game.current_round);
      setRoundMoves(movesData || []);
    };
    fetchInitialData();

    // Create unique channel names to avoid conflicts
    const gameChannelName = `game-updates-${game.id}`;
    const playersChannelName = `players-updates-${game.id}`;
    const ridersChannelName = `riders-updates-${game.id}`;
    const movesChannelName = `moves-updates-${game.id}-round-${game.current_round}`;

    const gameSub = supabase.channel(gameChannelName)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'games', 
        filter: `id=eq.${game.id}` 
      }, payload => {
        setGame(payload.new as Game);
      })
      .subscribe();

    const playerSub = supabase.channel(playersChannelName)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'players', 
        filter: `game_id=eq.${game.id}` 
      }, payload => {
        setPlayers(curr => [...curr, payload.new as Player]);
      })
      .subscribe();

    const riderSub = supabase.channel(ridersChannelName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'riders', 
        filter: `game_id=eq.${game.id}` 
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setRiders(curr => [...curr, payload.new as Rider]);
        } else if (payload.eventType === 'UPDATE') {
          setRiders(curr => curr.map(r => r.id === payload.new.id ? payload.new as Rider : r));
        }
      })
      .subscribe();

    const movesSub = supabase.channel(movesChannelName)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'player_moves', 
        filter: `game_id=eq.${game.id}` 
      }, payload => {
        const move = payload.new as Move;
        if (move.round === game.current_round) {
          setRoundMoves(curr => [...curr, move]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(gameSub);
      supabase.removeChannel(playerSub);
      supabase.removeChannel(riderSub);
      supabase.removeChannel(movesSub);
    };

    
  }, [game?.id, game?.current_round]);

  const createGame = async () => {
    const gameCode = generateGameCode();
    const { data: g, error: gameError } = await supabase
      .from('games')
      .insert({ game_code: gameCode, game_state: 'setup', current_round: 1 })
      .select('*')
      .single();

    if (gameError || !g) {
      console.error('Failed to create game:', gameError);
      return;
    }

    const { data: p, error: playerError } = await supabase
      .from('players')
      .insert({ game_id: g.id, name: 'Player 1' })
      .select('id, name')
      .single();

    if (playerError || !p) {
      console.error('Failed to create player:', playerError);
      return;
    }

    handleLogin(g, p);
  };

  const joinGame = async (joinGameCode: string) => {
    // Validate the game code format
    if (!isValidGameCode(joinGameCode)) {
      alert('Invalid game code format. Please enter a 6-character code.');
      return;
    }

    // Find game by game code
    const { data: gameData } = await supabase.from('games').select('*').eq('game_code', joinGameCode).single();
    if (!gameData) {
      alert('Game not found. Please check the game code.');
      return;
    }

    const { data: playersInGame } = await supabase.from('players').select('id').eq('game_id', gameData.id);
    if (!playersInGame || playersInGame.length >= 2) {
      alert('Game is full.');
      return;
    }
    
    const { data: p } = await supabase.from('players').insert({ game_id: gameData.id, name: 'Player 2' }).select('id, name').single();
    if (gameData && p) handleLogin(gameData, p);
  };

  const startNextRound = async () => {
    if (!game) return;
    // Reset moves for the new round
    setRoundMoves([]);
    await supabase.from('games').update({ current_round: game.current_round + 1 }).eq('id', game.id);
  };

  return { game, player, players, riders, roundMoves, handleLogin, createGame, joinGame, startNextRound };
}