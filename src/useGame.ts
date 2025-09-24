import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import { Game, Player, Rider, Move } from './types';
import { generateGameCode, isValidGameCode } from './gameCodeUtils';

export function useGame() {
  const [game, setGame] = useState<Game | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [roundMoves, setRoundMoves] = useState<Move[]>([]);

  const channelsRef = useRef<{ gameSub: any; playerSub: any; riderSub: any; movesSub: any } | null>(null);

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

    const setupSubscriptions = async () => {
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
        });

      const playerSub = supabase.channel(playersChannelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${game.id}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newPlayer = payload.new as Player;
              setPlayers((currentPlayers) => {
                if (currentPlayers.some((p) => p.id === newPlayer.id)) {
                  return currentPlayers; // Already exists, do nothing
                }
                return [...currentPlayers, newPlayer];
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedPlayer = payload.new as Player;
              setPlayers((currentPlayers) =>
                currentPlayers.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p))
              );
            } else if (payload.eventType === 'DELETE') {
              const oldPlayer = payload.old as { id: string }; // Only need id for delete
              setPlayers((currentPlayers) => currentPlayers.filter((p) => p.id !== oldPlayer.id));
            }
          }
        );

      const riderSub = supabase.channel(ridersChannelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'riders',
          filter: `game_id=eq.${game.id}`
        }, async () => {
          // Refetch all riders for this game
          const { data: ridersData } = await supabase.from('riders').select('*').eq('game_id', game.id);
          setRiders(ridersData || []);
        });

      const movesSub = supabase.channel(movesChannelName)
        .on('postgres_changes', {
          event: '*', // Listen to all events for moves to ensure updates
          schema: 'public',
          table: 'player_moves',
          filter: `game_id=eq.${game.id},round=eq.${game.current_round}`
        }, async () => {
          // Refetch moves for the current round
          const { data: movesData } = await supabase.from('player_moves').select('*').eq('game_id', game.id).eq('round', game.current_round);
          setRoundMoves(movesData || []);
        });

      // Subscribe to channels
      await gameSub.subscribe();
      await playerSub.subscribe();
      await riderSub.subscribe();
      await movesSub.subscribe();

      // Store channels for cleanup
      channelsRef.current = { gameSub, playerSub, riderSub, movesSub };

      // Fetch initial data after subscriptions are active
      const { data: playersData } = await supabase.from('players').select('*').eq('game_id', game.id);
      setPlayers(playersData || []);
      const { data: ridersData } = await supabase.from('riders').select('*').eq('game_id', game.id);
      setRiders(ridersData || []);
      const { data: movesData } = await supabase.from('player_moves').select('*').eq('game_id', game.id).eq('round', game.current_round);
      setRoundMoves(movesData || []);
    };

    setupSubscriptions();

    return () => {
      if (channelsRef.current) {
        supabase.removeChannel(channelsRef.current.gameSub);
        supabase.removeChannel(channelsRef.current.playerSub);
        supabase.removeChannel(channelsRef.current.riderSub);
        supabase.removeChannel(channelsRef.current.movesSub);
        channelsRef.current = null;
      }
    };

  }, [game?.id, game?.current_round, game]);

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

  const drawCards = async (rider: Rider) => {
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

    const { data, error } = await supabase
      .from('riders')
      .update({ hand: hand, deck: newDeck, discard_pile: discardPile })
      .eq('id', rider.id)
      .select()
      .single();

    if (error) {
      console.error('Error drawing cards:', error);
      return;
    }

    if (data) {
      setRiders(currentRiders => currentRiders.map(r => r.id === rider.id ? data : r));
    }
  };

  const confirmMoves = async (selectedMoves: { [riderId: string]: number }, myRiders: Rider[]) => {
    if (!game || !player) return;

    const movesToInsert = myRiders.map(rider => ({
      game_id: game.id,
      player_id: player.id,
      rider_id: rider.id,
      selected_card: selectedMoves[rider.id],
      round: game.current_round,
    }));

    const { error } = await supabase.from('player_moves').insert(movesToInsert);

    if (error) {
      console.error('Error confirming moves:', error);
      return;
    }

    // Update roundMoves locally to trigger UI update immediately
    setRoundMoves(current => [...current, ...movesToInsert]);

    const riderUpdates = myRiders.map(async (rider) => {
      const playedCard = selectedMoves[rider.id];
      const remainingHand = rider.hand?.filter(c => c !== playedCard) || [];
      const newDiscardPile = [...rider.discard_pile, playedCard, ...remainingHand];

      const { data, error } = await supabase
        .from('riders')
        .update({ 
            hand: [], // Clear hand
            discard_pile: newDiscardPile
        })
        .eq('id', rider.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating rider:', error);
        return null;
      }
      return data;
    });

    const updatedRiders = (await Promise.all(riderUpdates)).filter(Boolean) as Rider[];

    setRiders(currentRiders => {
      const newRiders = [...currentRiders];
      updatedRiders.forEach(updatedRider => {
        const index = newRiders.findIndex(r => r.id === updatedRider.id);
        if (index !== -1) {
          newRiders[index] = updatedRider;
        }
      });
      return newRiders;
    });
  };

  return { game, player, players, riders, roundMoves, handleLogin, createGame, joinGame, startNextRound, drawCards, confirmMoves };
}