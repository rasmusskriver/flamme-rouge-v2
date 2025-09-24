import { useState } from 'react';
import type { FormEvent } from 'react';

interface LobbyProps {
  createGame: () => void;
  joinGame: (code: string) => void;
}

export function Lobby({ createGame, joinGame }: LobbyProps) {
  const [joinGameCode, setJoinGameCode] = useState('');

  const handleJoinGame = (e: FormEvent) => {
    e.preventDefault();
    if (joinGameCode.trim()) {
      joinGame(joinGameCode.trim().toUpperCase());
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-8 text-slate-200">Welcome to the Lobby</h2>
      
      <div className="space-y-6">
        <div>
          <button 
            className="w-full max-w-xs mx-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105" 
            onClick={createGame}
          >
            Start New Game
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-600" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-800 px-2 text-sm text-slate-400">OR</span>
          </div>
        </div>

        <form onSubmit={handleJoinGame} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <input 
            type="text" 
            placeholder="ENTER GAME CODE" 
            value={joinGameCode} 
            onChange={(e) => setJoinGameCode(e.target.value)}
            maxLength={6}
            className="w-full max-w-xs text-center bg-slate-900 border-2 border-slate-700 rounded-lg px-4 py-3 font-mono text-lg tracking-widest uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
          <button 
            type="submit"
            className="w-full sm:w-auto bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!joinGameCode.trim()}
          >
            Join Game
          </button>
        </form>
      </div>
    </div>
  );
}
