import { useState } from 'react';

interface LobbyProps {
  createGame: () => void;
  joinGame: (code: string) => void;
}

export function Lobby({ createGame, joinGame }: LobbyProps) {
  const [joinGameCode, setJoinGameCode] = useState('');

  const handleJoinGame = () => {
    if (joinGameCode.trim()) {
      joinGame(joinGameCode.trim().toUpperCase());
    }
  };

  return (
    <div className="App lobby">
      <h1>Flamme Rouge</h1>
      <button onClick={createGame}>Start New Game</button>
      <hr />
      <div>
        <input 
          type="text" 
          placeholder="Enter Game Code (6 characters)" 
          value={joinGameCode} 
          onChange={(e) => setJoinGameCode(e.target.value)}
          maxLength={6}
          style={{ textTransform: 'uppercase' }}
        />
        <button onClick={handleJoinGame}>Join Game</button>
      </div>
    </div>
  );
}
