import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GameMode, GameStats, GameSettings, COLOR_SCHEMES } from '../types';
import { RotateCcw, Home, Trophy, Target, MousePointerClick, Clock, Star, Github } from 'lucide-react';
import { t } from '../i18n';

interface Props {
  stats: GameStats;
  mode: GameMode;
  settings: GameSettings;
  onRetry: () => void;
  onMenu: () => void;
}

function useAnimatedNumber(target: number, duration = 1000): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let animId: number;
    function tick() {
      const progress = Math.min(1, (performance.now() - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) animId = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(animId);
  }, [target, duration]);
  return value;
}

function getGrade(accuracy: number): { letter: string; color: string } {
  if (accuracy >= 95) return { letter: 'S', color: '#facc15' };
  if (accuracy >= 80) return { letter: 'A', color: '#22c55e' };
  if (accuracy >= 65) return { letter: 'B', color: '#3b82f6' };
  if (accuracy >= 50) return { letter: 'C', color: '#f97316' };
  return { letter: 'D', color: '#ef4444' };
}

const MODE_LABELS: Record<GameMode, string> = {
  GRIDSHOT: 'Gridshot',
  SPIDERSHOT: 'Spidershot',
  MICROFLICK: 'Microflick',
  TRACKING: 'Tracking',
};

export default function ResultsScreen({ stats, mode, settings, onRetry, onMenu }: Props) {
  const colors = COLOR_SCHEMES[settings.colorScheme];
  const grade = getGrade(stats.accuracy);
  const l = settings.locale;

  const animScore = useAnimatedNumber(stats.score, 1200);
  const animAccuracy = useAnimatedNumber(Math.round(stats.accuracy * 10), 1000);
  const animHits = useAnimatedNumber(stats.hits, 800);
  const animMisses = useAnimatedNumber(stats.misses, 800);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black tracking-tighter mb-2"
            style={{
              background: `linear-gradient(135deg, ${colors.secondary}, ${colors.primary})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('results.title', l)}
          </motion.h1>
          <p className="text-zinc-400 font-medium uppercase tracking-widest text-sm">
            {MODE_LABELS[mode]} MODE
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 15 }}
          className="flex justify-center mb-8"
        >
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl font-black"
            style={{
              background: `${grade.color}15`,
              color: grade.color,
              border: `2px solid ${grade.color}40`,
              boxShadow: `0 0 30px ${grade.color}30`,
            }}
          >
            {grade.letter}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="col-span-2 bg-zinc-800/50 rounded-2xl p-6 flex flex-col items-center justify-center border border-zinc-700/50">
            <Trophy className="w-7 h-7 text-yellow-500 mb-2" />
            <div className="text-5xl font-mono font-bold text-white mb-1">{animScore.toLocaleString()}</div>
            <div className="text-zinc-400 text-xs font-medium uppercase tracking-wider">{t('results.score', l)}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-zinc-800/50 rounded-2xl p-5 flex flex-col items-center justify-center border border-zinc-700/50">
            <Target className="w-6 h-6 mb-2" style={{ color: colors.primary }} />
            <div className="text-3xl font-mono font-bold text-white mb-1">{(animAccuracy / 10).toFixed(1)}%</div>
            <div className="text-zinc-400 text-xs font-medium uppercase tracking-wider">{t('results.accuracy', l)}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="bg-zinc-800/50 rounded-2xl p-5 flex flex-col items-center justify-center border border-zinc-700/50">
            <MousePointerClick className="w-6 h-6 text-rose-500 mb-2" />
            <div className="text-3xl font-mono font-bold text-white mb-1">{animHits} <span className="text-zinc-600">/</span> {animMisses}</div>
            <div className="text-zinc-400 text-xs font-medium uppercase tracking-wider">{t('results.hitsMisses', l)}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="col-span-2 bg-zinc-800/50 rounded-2xl p-5 flex flex-col items-center justify-center border border-zinc-700/50">
            <Clock className="w-6 h-6 text-emerald-500 mb-2" />
            <div className="text-3xl font-mono font-bold text-white mb-1">{formatTime(stats.totalTime)}</div>
            <div className="text-zinc-400 text-xs font-medium uppercase tracking-wider">{t('results.duration', l)}</div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex gap-4">
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 font-bold py-4 px-6 rounded-xl transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: colors.primary, color: '#fff' }}
          >
            <RotateCcw className="w-5 h-5" />
            {t('results.retry', l)}
          </button>
          <button
            onClick={onMenu}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-[0.98]"
          >
            <Home className="w-5 h-5" />
            {t('results.menu', l)}
          </button>
        </motion.div>

        <motion.a
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          href="https://github.com/DanZai233/AIMBOT"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center justify-center gap-2 text-zinc-500 hover:text-yellow-400 transition-colors group"
        >
          <Star className="w-4 h-4 group-hover:fill-yellow-400 transition-all" />
          <span className="text-sm">{t('results.star', l)}</span>
          <Github className="w-4 h-4" />
        </motion.a>
      </motion.div>
    </div>
  );
}
