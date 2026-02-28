import { useEffect, useRef, useState, useCallback } from 'react';
import { GameStats, GameSettings, COLOR_SCHEMES, CrosshairConfig, FPS3DCrosshairStyle, FPS3DSubMode } from '../types';
import { FPS3DEngine } from '../lib/FPS3DEngine';
import { ArrowLeft, MousePointer, Menu } from 'lucide-react';
import { t } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';

const FPS3D_SUBMODES: FPS3DSubMode[] = ['GRIDSHOT', 'SPIDERSHOT', 'MICROFLICK', 'TRACKING'];

interface Props {
  settings: GameSettings;
  onGameOver: (stats: GameStats, fps3dSubMode?: FPS3DSubMode) => void;
  onQuit: () => void;
}

function Crosshair3D({ config, color }: { config: CrosshairConfig; color: string }) {
  const { style, thickness, gapV, gapH, size, opacity, dotSize } = config;
  const cx = 50, cy = 50;
  const hasLines = (s: FPS3DCrosshairStyle) => s === 'cross' || s === 'crossDot' || s === 'tcross';
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="pointer-events-none">
      {hasLines(style) && <>
        {style !== 'tcross' && <line x1={cx} y1={cy - gapV} x2={cx} y2={cy - gapV - size} stroke={color} strokeWidth={thickness} opacity={opacity} strokeLinecap="round" />}
        <line x1={cx} y1={cy + gapV} x2={cx} y2={cy + gapV + size} stroke={color} strokeWidth={thickness} opacity={opacity} strokeLinecap="round" />
        <line x1={cx - gapH} y1={cy} x2={cx - gapH - size} y2={cy} stroke={color} strokeWidth={thickness} opacity={opacity} strokeLinecap="round" />
        <line x1={cx + gapH} y1={cy} x2={cx + gapH + size} y2={cy} stroke={color} strokeWidth={thickness} opacity={opacity} strokeLinecap="round" />
      </>}
      {style === 'circle' && <circle cx={cx} cy={cy} r={gapH + size / 2} stroke={color} strokeWidth={thickness} fill="none" opacity={opacity} />}
      {(style === 'crossDot' || style === 'dot' || style === 'circle') && dotSize > 0 && (
        <circle cx={cx} cy={cy} r={dotSize} fill={color} opacity={opacity} />
      )}
    </svg>
  );
}

export default function FPS3DScreen({ settings, onGameOver, onQuit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FPS3DEngine | null>(null);
  const hasStartedRef = useRef(false);
  const subModeRef = useRef<FPS3DSubMode>('GRIDSHOT');
  const colors = COLOR_SCHEMES[settings.colorScheme];
  const l = settings.locale;

  const [stats, setStats] = useState({ score: 0, hits: 0, misses: 0, timeLeft: settings.duration * 1000 });
  const [hasStarted, setHasStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [locked, setLocked] = useState(false);
  const [subMode, setSubMode] = useState<FPS3DSubMode>('GRIDSHOT');
  const [menuOpen, setMenuOpen] = useState(false);

  hasStartedRef.current = hasStarted;
  subModeRef.current = subMode;
  const stableGameOver = useCallback((s: GameStats) => onGameOver(s, subModeRef.current), [onGameOver]);

  const doRestart = useCallback((mode: FPS3DSubMode) => {
    setMenuOpen(false);
    setSubMode(mode);
    setHasStarted(false);
    setCountdown(3);
    setStats({ score: 0, hits: 0, misses: 0, timeLeft: settings.duration * 1000 });
    engineRef.current?.stopGame();
  }, [settings.duration]);

  useEffect(() => {
    if (countdown > 0) return;
    if (countdown === 0 && !hasStarted) {
      setHasStarted(true);
      engineRef.current?.start(subMode);
    }
  }, [countdown, hasStarted, subMode]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new FPS3DEngine(canvasRef.current, settings);
    engineRef.current = engine;
    engine.onUpdateStats = s => setStats(prev => ({ ...prev, ...s }));
    engine.onGameOver = s => stableGameOver(s);
    engine.onPointerLockChange = lk => {
      setLocked(lk);
      if (!lk && hasStartedRef.current) setMenuOpen(true);
    };
    return () => { engine.stop(); };
  }, [settings, stableGameOver]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatTime = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const accuracy = stats.hits + stats.misses > 0
    ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(0) : '100';

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {hasStarted && locked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Crosshair3D config={settings.fps3d.crosshair} color={colors.primary} />
        </div>
      )}

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
          <div className="text-sm font-mono font-medium text-zinc-400 uppercase tracking-widest">FPS 3D · {t(`mode.${subMode.toLowerCase()}`, l)}</div>
          <div className="text-right">
            <div className="text-4xl font-mono font-bold text-white drop-shadow-lg">{formatTime(stats.timeLeft)}</div>
            <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-1">Time</div>
          </div>
        </div>
      </div>

      <button onClick={onQuit} className="absolute bottom-6 left-6 p-3 bg-zinc-800/50 hover:bg-zinc-700/80 rounded-full text-zinc-400 hover:text-white transition-colors z-20 cursor-pointer">
        <ArrowLeft className="w-5 h-5" />
      </button>

      {hasStarted && !locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
          <AnimatePresence mode="wait">
            {menuOpen ? (
              <motion.div
                key="menu"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md mx-4 p-6 rounded-2xl bg-zinc-900/95 border border-zinc-700/80 backdrop-blur-xl shadow-2xl pointer-events-auto"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                  <Menu className="w-5 h-5" style={{ color: colors.primary }} />
                  {t('fps.menu', l)}
                </h3>
                <p className="text-zinc-400 text-sm mb-4">{t('fps.modeSelect', l)}</p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {FPS3D_SUBMODES.map(m => (
                    <button
                      key={m}
                      onClick={() => doRestart(m)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                        subMode === m
                          ? 'text-white'
                          : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80'
                      }`}
                      style={subMode === m ? { background: colors.bg, borderWidth: 2, borderColor: colors.primary } : {}}
                    >
                      {t(`mode.${m.toLowerCase()}`, l)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setMenuOpen(false); engineRef.current?.requestLock(); }}
                    className="flex-1 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-medium transition-colors"
                  >
                    {t('fps.clickToLock', l)}
                  </button>
                  <button
                    onClick={() => doRestart(subMode)}
                    className="flex-1 py-3 rounded-xl font-medium transition-colors"
                    style={{ background: colors.bg, color: colors.primary }}
                  >
                    {t('fps.restart', l)}
                  </button>
                </div>
                <button
                  onClick={onQuit}
                  className="w-full mt-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm"
                >
                  {t('fps.quit', l)}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="resume"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center pointer-events-none"
              >
                <div className="flex gap-4 mb-6 pointer-events-auto">
                  <button
                    onClick={() => setMenuOpen(true)}
                    className="p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 transition-colors"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => engineRef.current?.requestLock()}
                    className="p-3 rounded-xl flex items-center gap-2"
                    style={{ background: colors.bg, color: colors.primary }}
                  >
                    <MousePointer className="w-5 h-5" />
                    <span>{t('fps.clickToLock', l)}</span>
                  </button>
                </div>
                <p className="text-zinc-500 text-sm">ESC {t('fps.toUnlock', l)}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

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
