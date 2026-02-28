import { useState } from 'react';
import { GameMode, GameState, GameStats, GameSettings, DEFAULT_SETTINGS, PlayerIdentity, COLOR_SCHEMES } from './types';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import FPS3DScreen from './components/FPS3DScreen';
import ResultsScreen from './components/ResultsScreen';
import SettingsPanel from './components/SettingsPanel';
import LeaderboardPanel from './components/LeaderboardPanel';
import NameInputModal from './components/NameInputModal';

const SETTINGS_KEY = 'aim-trainer-settings';
const PLAYER_KEY = 'aim-trainer-player';

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

function loadOrCreatePlayer(): PlayerIdentity {
  try {
    const saved = localStorage.getItem(PLAYER_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  const identity: PlayerIdentity = {
    name: 'Player',
    tag: `Player#${Math.floor(1000 + Math.random() * 9000)}`,
  };
  try { localStorage.setItem(PLAYER_KEY, JSON.stringify(identity)); } catch { /* ignore */ }
  return identity;
}

function savePlayer(p: PlayerIdentity) {
  try { localStorage.setItem(PLAYER_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [mode, setMode] = useState<GameMode>('GRIDSHOT');
  const [lastStats, setLastStats] = useState<GameStats | null>(null);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [player, setPlayer] = useState<PlayerIdentity>(loadOrCreatePlayer);
  const [showNameInput, setShowNameInput] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleSettingsChange = (s: GameSettings) => { setSettings(s); saveSettings(s); };
  const startGame = (m: GameMode) => { setMode(m); setGameState('PLAYING'); };
  const handleGameOver = (stats: GameStats) => { setLastStats(stats); setGameState('RESULTS'); };
  const returnToMenu = () => { setGameState('MENU'); setLastStats(null); };

  const handleNameSave = (identity: PlayerIdentity) => {
    setPlayer(identity);
    savePlayer(identity);
    setShowNameInput(false);
  };

  const accent = COLOR_SCHEMES[settings.colorScheme].primary;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-500/30">
      {gameState === 'MENU' && (
        <MainMenu onStart={startGame} settings={settings} player={player}
          onOpenSettings={() => setShowSettings(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onEditName={() => setShowNameInput(true)} />
      )}
      {gameState === 'PLAYING' && mode !== 'FPS3D' && (
        <GameScreen mode={mode} settings={settings} onGameOver={handleGameOver} onQuit={returnToMenu} />
      )}
      {gameState === 'PLAYING' && mode === 'FPS3D' && (
        <FPS3DScreen settings={settings} onGameOver={handleGameOver} onQuit={returnToMenu} />
      )}
      {gameState === 'RESULTS' && lastStats && (
        <ResultsScreen stats={lastStats} mode={mode} settings={settings} player={player}
          onRetry={() => startGame(mode)} onMenu={returnToMenu}
          onEditName={() => setShowNameInput(true)}
          onViewLeaderboard={() => setShowLeaderboard(true)} />
      )}

      <SettingsPanel settings={settings} onChange={handleSettingsChange}
        onClose={() => setShowSettings(false)} isOpen={showSettings} />
      <LeaderboardPanel isOpen={showLeaderboard} settings={settings}
        initialMode={mode} playerTag={player.tag}
        onClose={() => setShowLeaderboard(false)} />
      <NameInputModal isOpen={showNameInput} locale={settings.locale} accent={accent}
        onSave={handleNameSave} onClose={() => setShowNameInput(false)} />
    </div>
  );
}
