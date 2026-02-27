import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, Trophy } from 'lucide-react';
import { GameMode, LeaderboardEntry, COLOR_SCHEMES, GameSettings } from '../types';
import { t, Locale } from '../i18n';

interface Props {
  isOpen: boolean;
  settings: GameSettings;
  initialMode?: GameMode;
  playerTag?: string;
  onClose: () => void;
}

const MODES: GameMode[] = ['GRIDSHOT', 'SPIDERSHOT', 'MICROFLICK', 'TRACKING', 'FPS3D'];
const MODE_LABELS: Record<GameMode, string> = {
  GRIDSHOT: 'Gridshot', SPIDERSHOT: 'Spider', MICROFLICK: 'Micro', TRACKING: 'Track', FPS3D: '3D',
};

async function fetchLeaderboard(mode: string): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(`/api/leaderboard?mode=${mode}&limit=50`);
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export default function LeaderboardPanel({ isOpen, settings, initialMode, playerTag, onClose }: Props) {
  const l = settings.locale;
  const accent = COLOR_SCHEMES[settings.colorScheme].primary;
  const [mode, setMode] = useState<GameMode>(initialMode ?? 'GRIDSHOT');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    const data = await fetchLeaderboard(mode);
    if (data.length === 0 && entries.length === 0) {
      const res = await fetch(`/api/leaderboard?mode=${mode}&limit=1`).catch(() => null);
      if (!res || !res.ok) setError(true);
    }
    setEntries(data);
    setLoading(false);
  }, [mode]);

  useEffect(() => { if (isOpen) load(); }, [isOpen, load]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" style={{ color: accent }} />
                <h2 className="text-lg font-bold text-zinc-100">{t('lb.title', l)}</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={load} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-1 p-3 bg-zinc-800/30 border-b border-zinc-800">
              {MODES.map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className="flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all"
                  style={mode === m ? { background: accent, color: '#fff' } : { color: '#a1a1aa' }}>
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto p-3">
              {loading && (
                <div className="text-center text-zinc-500 py-12">{t('lb.loading', l)}</div>
              )}
              {error && !loading && (
                <div className="text-center text-zinc-500 py-12">{t('lb.error', l)}</div>
              )}
              {!loading && !error && entries.length === 0 && (
                <div className="text-center text-zinc-500 py-12">{t('lb.empty', l)}</div>
              )}
              {!loading && entries.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-zinc-500 text-xs uppercase tracking-wider">
                      <th className="text-left py-2 px-2 w-10">{t('lb.rank', l)}</th>
                      <th className="text-left py-2 px-2">{t('lb.player', l)}</th>
                      <th className="text-right py-2 px-2">{t('lb.score', l)}</th>
                      <th className="text-right py-2 px-2">{t('lb.accuracy', l)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(e => {
                      const isMe = playerTag && e.tag === playerTag;
                      return (
                        <tr key={e.id}
                          className="border-t border-zinc-800/50 transition-colors"
                          style={isMe ? { background: `${accent}10` } : undefined}>
                          <td className="py-2.5 px-2 font-mono text-zinc-500">
                            {e.rank <= 3 ? ['🥇', '🥈', '🥉'][e.rank - 1] : e.rank}
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="text-zinc-200 font-medium">{e.name}</span>
                            <span className="text-zinc-600 text-xs ml-1">#{e.tag.split('#')[1]}</span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-medium" style={{ color: isMe ? accent : '#e4e4e7' }}>
                            {e.score.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-zinc-400">
                            {e.accuracy.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
