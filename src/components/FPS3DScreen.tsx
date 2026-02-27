import { useEffect, useRef, useState, useCallback } from 'react';
import { GameStats, GameSettings, COLOR_SCHEMES } from '../types';
import { FPS3DEngine } from '../lib/FPS3DEngine';
import { ArrowLeft, MousePointer } from 'lucide-react';
import { t } from '../i18n';

interface Props {
  settings: GameSettings;
  onGameOver: (stats: GameStats) => void;
  onQuit: () => void;
}

export default function FPS3DScreen({ settings, onGameOver, onQuit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FPS3DEngine | null>(null);
  const colors = COLOR_SCHEMES[settings.colorScheme];
  const l = settings.locale;

  const [stats, setStats] = useState({ score: 0, hits: 0, misses: 0, timeLeft: settings.duration * 1000 });
  const [hasStarted, setHasStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [locked, setLocked] = useState(false);

  const stableGameOver = useCallback((s: GameStats) => onGameOver(s), [onGameOver]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new FPS3DEngine(canvasRef.current, settings);
    engineRef.current = engine;
    engine.onUpdateStats = s => setStats(prev => ({ ...prev, ...s }));
    engine.onGameOver = s => stableGameOver(s);
    engine.onPointerLockChange = l => setLocked(l);
    return () => { engine.stop(); };
  }, [settings, stableGameOver]);

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
    const s = Math.ceil(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const accuracy = stats.hits + stats.misses > 0
    ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(0) : '100';

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Crosshair */}
      {hasStarted && locked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <svg width="36" height="36" viewBox="0 0 36 36">
            <line x1="18" y1="3" x2="18" y2="13" stroke={colors.primary} strokeWidth="2" opacity=".9" />
            <line x1="18" y1="23" x2="18" y2="33" stroke={colors.primary} strokeWidth="2" opacity=".9" />
            <line x1="3" y1="18" x2="13" y2="18" stroke={colors.primary} strokeWidth="2" opacity=".9" />
            <line x1="23" y1="18" x2="33" y2="18" stroke={colors.primary} strokeWidth="2" opacity=".9" />
            <circle cx="18" cy="18" r="2" fill={colors.primary} />
          </svg>
        </div>
      )}

      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-start z-10 pointer-events-none">
        <div className="flex items-start gap-8">
          <div>
            <div className="text-4xl font-mono font-bold drop-shadow-lg" style={{ color: colors.text }}>{stats.score.toLocaleString()}</div>
            <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-1">Score</div>
          </div>
          <div>
            <div className="text-lg font-mono font-semibold text-zinc-300">{accuracy}%</div>
            <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-1">Accuracy</div>
          </div>
        </div>
        <div className="flex items-start gap-6">
          <div className="text-sm font-mono font-medium text-zinc-400 uppercase tracking-widest">FPS 3D</div>
          <div className="text-right">
            <div className="text-4xl font-mono font-bold text-white drop-shadow-lg">{formatTime(stats.timeLeft)}</div>
            <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-1">Time</div>
          </div>
        </div>
      </div>

      {/* Quit */}
      <button
        onClick={onQuit}
        className="absolute bottom-6 left-6 p-3 bg-zinc-800/50 hover:bg-zinc-700/80 rounded-full text-zinc-400 hover:text-white transition-colors z-20 cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Pointer lock prompt */}
      {hasStarted && !locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20 cursor-pointer"
          onClick={() => engineRef.current?.requestLock()}
        >
          <MousePointer className="w-10 h-10 mb-4" style={{ color: colors.primary }} />
          <p className="text-zinc-300 text-lg font-medium">{t('fps.clickToLock', l)}</p>
          <p className="text-zinc-500 text-sm mt-2">ESC {t('fps.toUnlock', l)}</p>
        </div>
      )}

      {/* Countdown */}
      {!hasStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 z-30 backdrop-blur-sm">
          <div className="text-9xl font-black animate-pulse" style={{ color: colors.primary, filter: `drop-shadow(0 0 40px ${colors.glow})` }}>
            {countdown > 0 ? countdown : 'GO!'}
          </div>
        </div>
      )}
    </div>
  );
}
