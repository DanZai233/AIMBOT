import { useEffect, useRef, useState } from 'react';
import { GameMode, GameStats, GameSettings, COLOR_SCHEMES } from '../types';
import { GameEngine } from '../lib/GameEngine';
import { ArrowLeft } from 'lucide-react';

interface Props {
  mode: GameMode;
  settings: GameSettings;
  onGameOver: (stats: GameStats) => void;
  onQuit: () => void;
}

const MODE_LABELS: Record<GameMode, string> = {
  GRIDSHOT: 'Gridshot',
  SPIDERSHOT: 'Spidershot',
  MICROFLICK: 'Microflick',
  TRACKING: 'Tracking',
  FPS3D: 'FPS 3D',
};

export default function GameScreen({ mode, settings, onGameOver, onQuit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const colors = COLOR_SCHEMES[settings.colorScheme];

  const [stats, setStats] = useState({
    score: 0,
    hits: 0,
    misses: 0,
    timeLeft: settings.duration * 1000,
  });

  const [hasStarted, setHasStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new GameEngine(canvasRef.current, mode, settings);
    engineRef.current = engine;
    engine.onUpdateStats = (newStats) => { setStats(prev => ({ ...prev, ...newStats })); };
    engine.onGameOver = (finalStats) => { onGameOver(finalStats); };
    return () => { engine.stop(); };
  }, [mode, settings, onGameOver]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !hasStarted) {
      setHasStarted(true);
      engineRef.current?.start();
    }
  }, [countdown, hasStarted]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const accuracy = stats.hits + stats.misses > 0
    ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(0)
    : '100';

  return (
    <div className="relative w-full h-screen overflow-hidden bg-zinc-900">
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-start z-10 pointer-events-none">
        <div className="flex items-start gap-8">
          <div>
            <div className="text-4xl font-mono font-bold drop-shadow-lg" style={{ color: colors.text }}>
              {stats.score.toLocaleString()}
            </div>
            <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-1">Score</div>
          </div>
          <div>
            <div className="text-lg font-mono font-semibold text-zinc-300">
              {accuracy}%
            </div>
            <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-1">Accuracy</div>
          </div>
        </div>

        <div className="flex items-start gap-6">
          <div className="text-center">
            <div className="text-sm font-mono font-medium text-zinc-400 uppercase tracking-widest">
              {MODE_LABELS[mode]}
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-mono font-bold text-white drop-shadow-lg">
              {formatTime(stats.timeLeft)}
            </div>
            <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-1">Time</div>
          </div>
        </div>
      </div>

      {/* Quit Button */}
      <button
        onClick={onQuit}
        className="absolute bottom-6 left-6 p-3 bg-zinc-800/50 hover:bg-zinc-700/80 rounded-full text-zinc-400 hover:text-white transition-colors z-20 cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Game Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Countdown Overlay */}
      {!hasStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 z-30 backdrop-blur-sm">
          <div
            className="text-9xl font-black animate-pulse"
            style={{
              color: colors.primary,
              filter: `drop-shadow(0 0 40px ${colors.glow})`,
            }}
          >
            {countdown > 0 ? countdown : 'GO!'}
          </div>
        </div>
      )}
    </div>
  );
}
