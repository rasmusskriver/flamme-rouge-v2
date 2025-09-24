import { useGame } from "./useGame";
import { Lobby } from "./Lobby";
import { Game } from "./Game";

function App() {
  const { game, createGame, joinGame } = useGame();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-800 rounded-lg shadow-xl p-8">
        {game ? (
          <>
            <header className="mb-6 text-center">
              <h1 className="text-5xl font-extrabold text-red-500 tracking-tight">
                Flamme Rouge
              </h1>
              <p className="text-slate-400 mt-2">
                Game Code:{" "}
                <strong className="text-white">{game.game_code}</strong> |
                Round:{" "}
                <strong className="text-white">{game.current_round}</strong>
              </p>
            </header>
            <Game />
          </>
        ) : (
          <Lobby createGame={createGame} joinGame={joinGame} />
        )}
      </div>
    </div>
  );
}

export default App;
