import { useState } from 'react';
import { GameMode, GameState, GameStats, GameSettings, DEFAULT_SETTINGS } from './types';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import FPS3DScreen from './components/FPS3DScreen';
import ResultsScreen from './components/ResultsScreen';
import SettingsPanel from './components/SettingsPanel';

const SETTINGS_KEY = 'aim-trainer-settings';

function loadSettings(): GameSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(s: GameSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [mode, setMode] = useState<GameMode>('GRIDSHOT');
  const [lastStats, setLastStats] = useState<GameStats | null>(null);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);

  const handleSettingsChange = (s: GameSettings) => {
    setSettings(s);
    saveSettings(s);
  };

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
      {gameState === 'MENU' && (
        <MainMenu onStart={startGame} settings={settings} onOpenSettings={() => setShowSettings(true)} />
      )}
      {gameState === 'PLAYING' && mode !== 'FPS3D' && (
        <GameScreen mode={mode} settings={settings} onGameOver={handleGameOver} onQuit={returnToMenu} />
      )}
      {gameState === 'PLAYING' && mode === 'FPS3D' && (
        <FPS3DScreen settings={settings} onGameOver={handleGameOver} onQuit={returnToMenu} />
      )}
      {gameState === 'RESULTS' && lastStats && (
        <ResultsScreen stats={lastStats} mode={mode} settings={settings} onRetry={() => startGame(mode)} onMenu={returnToMenu} />
      )}
      <SettingsPanel
        settings={settings}
        onChange={handleSettingsChange}
        onClose={() => setShowSettings(false)}
        isOpen={showSettings}
      />
    </div>
  );
}
