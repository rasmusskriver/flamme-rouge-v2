import { useGame } from './useGame';
import { Lobby } from './Lobby';
import { Game } from './Game';
import './App.css';

function App() {
  const { game, createGame, joinGame } = useGame();

  return (
    <div className="App">
      {game ? (
        <>
          <header>
            <h1>Flamme Rouge</h1>
            <p>Game Code: <strong>{game.game_code}</strong> | Round: <strong>{game.current_round}</strong></p>
          </header>
          <Game />
        </>
      ) : (
        <Lobby createGame={createGame} joinGame={joinGame} />
      )}
    </div>
  );
}

export default App;
