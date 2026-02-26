import { GameMode, GameStats } from '../types';
import { RotateCcw, Home, Trophy, Target, MousePointerClick, Clock } from 'lucide-react';

interface Props {
  stats: GameStats;
  mode: GameMode;
  onRetry: () => void;
  onMenu: () => void;
}

export default function ResultsScreen({ stats, mode, onRetry, onMenu }: Props) {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-950">
      <div className="w-full max-w-2xl bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600 mb-2">
            RESULTS
          </h1>
          <p className="text-zinc-400 font-medium uppercase tracking-widest text-sm">
            {mode} MODE
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-10">
          {/* Score */}
          <div className="col-span-2 bg-zinc-800/50 rounded-2xl p-6 flex flex-col items-center justify-center border border-zinc-700/50">
            <Trophy className="w-8 h-8 text-yellow-500 mb-3" />
            <div className="text-5xl font-mono font-bold text-white mb-1">
              {stats.score.toLocaleString()}
            </div>
            <div className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
              Final Score
            </div>
          </div>

          {/* Accuracy */}
          <div className="bg-zinc-800/50 rounded-2xl p-6 flex flex-col items-center justify-center border border-zinc-700/50">
            <Target className="w-6 h-6 text-cyan-500 mb-3" />
            <div className="text-3xl font-mono font-bold text-white mb-1">
              {stats.accuracy.toFixed(1)}%
            </div>
            <div className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
              Accuracy
            </div>
          </div>

          {/* Hits / Misses */}
          <div className="bg-zinc-800/50 rounded-2xl p-6 flex flex-col items-center justify-center border border-zinc-700/50">
            <MousePointerClick className="w-6 h-6 text-rose-500 mb-3" />
            <div className="text-3xl font-mono font-bold text-white mb-1">
              {stats.hits} <span className="text-zinc-600">/</span> {stats.misses}
            </div>
            <div className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
              Hits / Misses
            </div>
          </div>

          {/* Time */}
          <div className="col-span-2 bg-zinc-800/50 rounded-2xl p-6 flex flex-col items-center justify-center border border-zinc-700/50">
            <Clock className="w-6 h-6 text-emerald-500 mb-3" />
            <div className="text-3xl font-mono font-bold text-white mb-1">
              {formatTime(stats.totalTime)}
            </div>
            <div className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
              Duration
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 px-6 rounded-xl transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            PLAY AGAIN
          </button>
          <button
            onClick={onMenu}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 px-6 rounded-xl transition-colors"
          >
            <Home className="w-5 h-5" />
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
