import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Game, Player, Rider, Move } from './types';

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

    const gameSub = supabase.channel(`game-${game.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${game.id}` }, payload => {
        setGame(payload.new as Game);
      }).subscribe();

    const playerSub = supabase.channel(`players-${game.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'players', filter: `game_id=eq.${game.id}` }, payload => {
        setPlayers(curr => [...curr, payload.new as Player]);
      }).subscribe();

    const riderSub = supabase.channel(`riders-${game.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'riders', filter: `game_id=eq.${game.id}` }, payload => {
        if (payload.eventType === 'INSERT') {
          setRiders(curr => [...curr, payload.new as Rider]);
        } else if (payload.eventType === 'UPDATE') {
          setRiders(curr => curr.map(r => r.id === payload.new.id ? payload.new as Rider : r));
        }
      }).subscribe();

    const movesSub = supabase.channel(`moves-${game.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'player_moves', filter: `game_id=eq.${game.id}` }, payload => {
        setRoundMoves(curr => [...curr, payload.new as Move]);
      }).subscribe();

    return () => {
      supabase.removeChannel(gameSub);
      supabase.removeChannel(playerSub);
      supabase.removeChannel(riderSub);
      supabase.removeChannel(movesSub);
    };
  }, [game?.id, game?.current_round]);

  const createGame = async () => {
    const { data: g } = await supabase.from('games').insert({}).select('*').single();
    const { data: p } = await supabase.from('players').insert({ game_id: g.id, name: 'Player 1' }).select('id, name').single();
    if (g && p) handleLogin(g, p);
  };

  const joinGame = async (joinGameId: string) => {
    const { data: playersInGame } = await supabase.from('players').select('id').eq('game_id', joinGameId);
    if (!playersInGame || playersInGame.length >= 2) {
      alert('Game not found or is full.');
      return;
    }
    const { data: g } = await supabase.from('games').select('*').eq('id', joinGameId).single();
    const { data: p } = await supabase.from('players').insert({ game_id: joinGameId, name: 'Player 2' }).select('id, name').single();
    if (g && p) handleLogin(g, p);
  };

  const startNextRound = async () => {
    if (!game) return;
    // Reset moves for the new round
    setRoundMoves([]);
    await supabase.from('games').update({ current_round: game.current_round + 1 }).eq('id', game.id);
  };

  return { game, player, players, riders, roundMoves, handleLogin, createGame, joinGame, startNextRound };
}