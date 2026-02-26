import { useState } from 'react';
import { GameMode, GameState, GameStats } from './types';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import ResultsScreen from './components/ResultsScreen';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [mode, setMode] = useState<GameMode>('GRIDSHOT');
  const [lastStats, setLastStats] = useState<GameStats | null>(null);

  const startGame = (selectedMode: GameMode) => {
    setMode(selectedMode);
    setGameState('PLAYING');
  };

  const handleGameOver = (stats: GameStats) => {
    setLastStats(stats);
    setGameState('RESULTS');
  };

  const returnToMenu = () => {
    setGameState('MENU');
    setLastStats(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-500/30">
      {gameState === 'MENU' && <MainMenu onStart={startGame} />}
      {gameState === 'PLAYING' && <GameScreen mode={mode} onGameOver={handleGameOver} onQuit={returnToMenu} />}
      {gameState === 'RESULTS' && lastStats && (
        <ResultsScreen stats={lastStats} mode={mode} onRetry={() => startGame(mode)} onMenu={returnToMenu} />
      )}
    </div>
  );
}
