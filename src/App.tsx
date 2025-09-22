import { useState } from 'react';
import { useGame } from './useGame';
import { TeamSelection } from './TeamSelection';
import { PlayerDashboard } from './PlayerDashboard';
import './App.css';
import { Move } from './types';

function App() {
  const { game, player, players, riders, roundMoves, createGame, joinGame, startNextRound } = useGame();
  const [joinGameId, setJoinGameId] = useState('');

  const handleJoinGame = () => {
    if (joinGameId) {
      joinGame(joinGameId);
    }
  };

  const renderGameContent = () => {
    if (!game || !player) return null;

    const myRiders = riders.filter(r => r.player_id === player.id);
    const movesByPlayer = roundMoves.reduce((acc, move) => {
        if (!acc[move.player_id]) acc[move.player_id] = [];
        acc[move.player_id].push(move);
        return acc;
    }, {} as Record<string, Move[]>);

    const allPlayersMoved = players.length === 2 && players.every(p => movesByPlayer[p.id]?.length === 2);

    if (riders.length === 0) {
      return players.length === 2 ? <TeamSelection /> : <p>Waiting for Player 2...</p>;
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
        <PlayerDashboard />
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
          <button onClick={handleJoinGame}>Join Game</button>
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