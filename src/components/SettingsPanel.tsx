import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw } from 'lucide-react';
import {
  GameSettings, DEFAULT_SETTINGS, DURATION_OPTIONS,
  TargetShape, CursorStyle, BackgroundTheme, ColorScheme,
  TargetSizePreset, SpeedPreset, COLOR_SCHEMES,
} from '../types';

interface Props {
  settings: GameSettings;
  onChange: (s: GameSettings) => void;
  onClose: () => void;
  isOpen: boolean;
}

function Segment<T extends string>({
  label, options, value, onChange, accentColor,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  accentColor: string;
}) {
  return (
    <div className="mb-5">
      <label className="text-xs text-zinc-400 mb-2 block font-medium uppercase tracking-wider">{label}</label>
      <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-1">
        {options.map(o => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="flex-1 py-2 px-2 rounded-md text-sm font-medium transition-all"
            style={value === o.value ? { background: accentColor, color: '#fff' } : { color: '#a1a1aa' }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const TARGET_SHAPES: { value: TargetShape; label: string; svg: React.ReactNode }[] = [
  {
    value: 'circle', label: '圆形',
    svg: <svg viewBox="0 0 24 24" width="28" height="28"><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".7"/><circle cx="12" cy="12" r="6" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="white"/></svg>,
  },
  {
    value: 'diamond', label: '菱形',
    svg: <svg viewBox="0 0 24 24" width="28" height="28"><polygon points="12,2 22,12 12,22 2,12" fill="currentColor" opacity=".7"/><polygon points="12,6 18,12 12,18 6,12" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="white"/></svg>,
  },
  {
    value: 'star', label: '星形',
    svg: <svg viewBox="0 0 24 24" width="28" height="28"><polygon points="12,2 14.5,9 22,9.5 16.5,14 18,22 12,18 6,22 7.5,14 2,9.5 9.5,9" fill="currentColor" opacity=".7"/><circle cx="12" cy="12" r="1.5" fill="white"/></svg>,
  },
  {
    value: 'hexagon', label: '六边形',
    svg: <svg viewBox="0 0 24 24" width="28" height="28"><polygon points="12,2 21.5,7 21.5,17 12,22 2.5,17 2.5,7" fill="currentColor" opacity=".7"/><circle cx="12" cy="12" r="1.5" fill="white"/></svg>,
  },
  {
    value: 'triangle', label: '三角形',
    svg: <svg viewBox="0 0 24 24" width="28" height="28"><polygon points="12,3 22,21 2,21" fill="currentColor" opacity=".7"/><circle cx="12" cy="13" r="1.5" fill="white"/></svg>,
  },
];

const CURSOR_STYLES: { value: CursorStyle; label: string; svg: React.ReactNode }[] = [
  {
    value: 'crosshair', label: '十字线',
    svg: <svg viewBox="0 0 24 24" width="28" height="28"><line x1="12" y1="2" x2="12" y2="9" stroke="currentColor" strokeWidth="1.5"/><line x1="12" y1="15" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.5"/><line x1="15" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>,
  },
  {
    value: 'dot', label: '圆点',
    svg: <svg viewBox="0 0 24 24" width="28" height="28"><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>,
  },
  {
    value: 'ring', label: '圆环',
    svg: <svg viewBox="0 0 24 24" width="28" height="28"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>,
  },
  {
    value: 'precise', label: '精确',
    svg: <svg viewBox="0 0 24 24" width="28" height="28"><line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="1"/><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/></svg>,
  },
];

const BACKGROUNDS: { value: BackgroundTheme; label: string; desc: string }[] = [
  { value: 'dark', label: '暗黑', desc: '纯暗色背景' },
  { value: 'grid', label: '网格', desc: '暗色网格线' },
  { value: 'gradient', label: '渐变', desc: '动态渐变' },
  { value: 'stars', label: '星空', desc: '闪烁星点' },
];

const COLOR_OPTIONS: ColorScheme[] = ['cyan', 'red', 'green', 'purple', 'orange'];
const COLOR_LABELS: Record<ColorScheme, string> = {
  cyan: '青', red: '红', green: '绿', purple: '紫', orange: '橙',
};

export default function SettingsPanel({ settings, onChange, onClose, isOpen }: Props) {
  const update = <K extends keyof GameSettings>(key: K, val: GameSettings[K]) => {
    onChange({ ...settings, [key]: val });
  };

  const accent = COLOR_SCHEMES[settings.colorScheme].primary;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-[380px] max-w-full bg-zinc-900/95 border-l border-zinc-800 backdrop-blur-xl overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-zinc-100">游戏设置</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => onChange({ ...DEFAULT_SETTINGS })}
                    className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                    title="重置默认"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Game Parameters */}
              <div className="mb-8">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4 font-semibold">游戏参数</div>

                <Segment
                  label="训练时间"
                  options={DURATION_OPTIONS.map(d => ({ value: String(d), label: `${d}秒` }))}
                  value={String(settings.duration)}
                  onChange={v => update('duration', Number(v))}
                  accentColor={accent}
                />

                <Segment<TargetSizePreset>
                  label="目标大小"
                  options={[
                    { value: 'small', label: '小' },
                    { value: 'medium', label: '中' },
                    { value: 'large', label: '大' },
                  ]}
                  value={settings.targetSize}
                  onChange={v => update('targetSize', v)}
                  accentColor={accent}
                />

                <Segment<SpeedPreset>
                  label="目标速度"
                  options={[
                    { value: 'slow', label: '慢速' },
                    { value: 'normal', label: '正常' },
                    { value: 'fast', label: '快速' },
                  ]}
                  value={settings.speed}
                  onChange={v => update('speed', v)}
                  accentColor={accent}
                />
              </div>

              {/* Personalization */}
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4 font-semibold">个性化</div>

                {/* Target Shape */}
                <div className="mb-5">
                  <label className="text-xs text-zinc-400 mb-2 block font-medium uppercase tracking-wider">目标形状</label>
                  <div className="flex gap-2">
                    {TARGET_SHAPES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => update('targetShape', s.value)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all border"
                        style={{
                          borderColor: settings.targetShape === s.value ? accent : 'transparent',
                          background: settings.targetShape === s.value ? `${accent}15` : 'rgba(39,39,42,0.5)',
                          color: settings.targetShape === s.value ? accent : '#a1a1aa',
                        }}
                        title={s.label}
                      >
                        {s.svg}
                        <span className="text-[10px]">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cursor Style */}
                <div className="mb-5">
                  <label className="text-xs text-zinc-400 mb-2 block font-medium uppercase tracking-wider">光标样式</label>
                  <div className="flex gap-2">
                    {CURSOR_STYLES.map(c => (
                      <button
                        key={c.value}
                        onClick={() => update('cursorStyle', c.value)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all border"
                        style={{
                          borderColor: settings.cursorStyle === c.value ? accent : 'transparent',
                          background: settings.cursorStyle === c.value ? `${accent}15` : 'rgba(39,39,42,0.5)',
                          color: settings.cursorStyle === c.value ? accent : '#a1a1aa',
                        }}
                        title={c.label}
                      >
                        {c.svg}
                        <span className="text-[10px]">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Scheme */}
                <div className="mb-5">
                  <label className="text-xs text-zinc-400 mb-2 block font-medium uppercase tracking-wider">主题配色</label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c}
                        onClick={() => update('colorScheme', c)}
                        className="flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all border"
                        style={{
                          borderColor: settings.colorScheme === c ? COLOR_SCHEMES[c].primary : 'transparent',
                          background: settings.colorScheme === c ? `${COLOR_SCHEMES[c].primary}15` : 'rgba(39,39,42,0.5)',
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-full shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${COLOR_SCHEMES[c].primary}, ${COLOR_SCHEMES[c].secondary})`,
                            boxShadow: settings.colorScheme === c ? `0 0 12px ${COLOR_SCHEMES[c].glow}` : 'none',
                          }}
                        />
                        <span className="text-[10px] text-zinc-400">{COLOR_LABELS[c]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background */}
                <div className="mb-5">
                  <label className="text-xs text-zinc-400 mb-2 block font-medium uppercase tracking-wider">背景主题</label>
                  <div className="grid grid-cols-2 gap-2">
                    {BACKGROUNDS.map(bg => (
                      <button
                        key={bg.value}
                        onClick={() => update('background', bg.value)}
                        className="p-3 rounded-lg text-left transition-all border"
                        style={{
                          borderColor: settings.background === bg.value ? accent : 'transparent',
                          background: settings.background === bg.value ? `${accent}15` : 'rgba(39,39,42,0.5)',
                        }}
                      >
                        <div
                          className="text-sm font-medium mb-0.5"
                          style={{ color: settings.background === bg.value ? accent : '#e4e4e7' }}
                        >
                          {bg.label}
                        </div>
                        <div className="text-[10px] text-zinc-500">{bg.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
