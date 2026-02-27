import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw } from 'lucide-react';
import {
  GameSettings, DEFAULT_SETTINGS, DURATION_OPTIONS,
  TargetShape, CursorStyle, BackgroundTheme, ColorScheme,
  TargetSizePreset, SpeedPreset, COLOR_SCHEMES, Locale,
  FPS3DMap, FPS3DCrosshairStyle, FPS3DConfig, CrosshairConfig,
} from '../types';
import { t } from '../i18n';

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

const TARGET_SHAPE_SVGS: Record<TargetShape, React.ReactNode> = {
  circle: <svg viewBox="0 0 24 24" width="28" height="28"><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".7"/><circle cx="12" cy="12" r="6" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="white"/></svg>,
  diamond: <svg viewBox="0 0 24 24" width="28" height="28"><polygon points="12,2 22,12 12,22 2,12" fill="currentColor" opacity=".7"/><polygon points="12,6 18,12 12,18 6,12" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="white"/></svg>,
  star: <svg viewBox="0 0 24 24" width="28" height="28"><polygon points="12,2 14.5,9 22,9.5 16.5,14 18,22 12,18 6,22 7.5,14 2,9.5 9.5,9" fill="currentColor" opacity=".7"/><circle cx="12" cy="12" r="1.5" fill="white"/></svg>,
  hexagon: <svg viewBox="0 0 24 24" width="28" height="28"><polygon points="12,2 21.5,7 21.5,17 12,22 2.5,17 2.5,7" fill="currentColor" opacity=".7"/><circle cx="12" cy="12" r="1.5" fill="white"/></svg>,
  triangle: <svg viewBox="0 0 24 24" width="28" height="28"><polygon points="12,3 22,21 2,21" fill="currentColor" opacity=".7"/><circle cx="12" cy="13" r="1.5" fill="white"/></svg>,
};

const CURSOR_STYLE_SVGS: Record<CursorStyle, React.ReactNode> = {
  crosshair: <svg viewBox="0 0 24 24" width="28" height="28"><line x1="12" y1="2" x2="12" y2="9" stroke="currentColor" strokeWidth="1.5"/><line x1="12" y1="15" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.5"/><line x1="15" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>,
  dot: <svg viewBox="0 0 24 24" width="28" height="28"><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>,
  ring: <svg viewBox="0 0 24 24" width="28" height="28"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>,
  precise: <svg viewBox="0 0 24 24" width="28" height="28"><line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="1"/><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/></svg>,
};

const ALL_SHAPES: TargetShape[] = ['circle', 'diamond', 'star', 'hexagon', 'triangle'];
const ALL_CURSORS: CursorStyle[] = ['crosshair', 'dot', 'ring', 'precise'];
const ALL_BACKGROUNDS: BackgroundTheme[] = ['dark', 'grid', 'gradient', 'stars'];
const COLOR_OPTIONS: ColorScheme[] = ['cyan', 'red', 'green', 'purple', 'orange'];

export default function SettingsPanel({ settings, onChange, onClose, isOpen }: Props) {
  const l = settings.locale;
  const update = <K extends keyof GameSettings>(key: K, val: GameSettings[K]) => {
    onChange({ ...settings, [key]: val });
  };
  const fps = settings.fps3d;
  const xh = fps.crosshair;
  const updateFps = (patch: Partial<FPS3DConfig>) => {
    onChange({ ...settings, fps3d: { ...fps, ...patch } });
  };
  const updateCH = (patch: Partial<CrosshairConfig>) => {
    onChange({ ...settings, fps3d: { ...fps, crosshair: { ...xh, ...patch } } });
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
                <h2 className="text-xl font-bold text-zinc-100">{t('settings.title', l)}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => onChange({ ...DEFAULT_SETTINGS, locale: l })}
                    className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                    title={t('settings.reset', l)}
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

              {/* Language */}
              <Segment<Locale>
                label={t('settings.language', l)}
                options={[
                  { value: 'zh', label: '中文' },
                  { value: 'en', label: 'English' },
                ]}
                value={l}
                onChange={v => update('locale', v)}
                accentColor={accent}
              />

              {/* Game Parameters */}
              <div className="mb-8">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4 font-semibold">{t('settings.section.game', l)}</div>

                <Segment
                  label={t('settings.duration', l)}
                  options={DURATION_OPTIONS.map(d => ({ value: String(d), label: `${d}${t('summary.sec', l)}` }))}
                  value={String(settings.duration)}
                  onChange={v => update('duration', Number(v))}
                  accentColor={accent}
                />

                <Segment<TargetSizePreset>
                  label={t('settings.targetSize', l)}
                  options={[
                    { value: 'small', label: t('size.small', l) },
                    { value: 'medium', label: t('size.medium', l) },
                    { value: 'large', label: t('size.large', l) },
                  ]}
                  value={settings.targetSize}
                  onChange={v => update('targetSize', v)}
                  accentColor={accent}
                />

                <Segment<SpeedPreset>
                  label={t('settings.speed', l)}
                  options={[
                    { value: 'slow', label: t('speed.slow', l) },
                    { value: 'normal', label: t('speed.normal', l) },
                    { value: 'fast', label: t('speed.fast', l) },
                  ]}
                  value={settings.speed}
                  onChange={v => update('speed', v)}
                  accentColor={accent}
                />
              </div>

              {/* Personalization */}
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4 font-semibold">{t('settings.section.personal', l)}</div>

                {/* Target Shape */}
                <div className="mb-5">
                  <label className="text-xs text-zinc-400 mb-2 block font-medium uppercase tracking-wider">{t('settings.shape', l)}</label>
                  <div className="flex gap-2">
                    {ALL_SHAPES.map(s => (
                      <button
                        key={s}
                        onClick={() => update('targetShape', s)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all border"
                        style={{
                          borderColor: settings.targetShape === s ? accent : 'transparent',
                          background: settings.targetShape === s ? `${accent}15` : 'rgba(39,39,42,0.5)',
                          color: settings.targetShape === s ? accent : '#a1a1aa',
                        }}
                        title={t(`shape.${s}`, l)}
                      >
                        {TARGET_SHAPE_SVGS[s]}
                        <span className="text-[10px]">{t(`shape.${s}`, l)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cursor Style */}
                <div className="mb-5">
                  <label className="text-xs text-zinc-400 mb-2 block font-medium uppercase tracking-wider">{t('settings.cursor', l)}</label>
                  <div className="flex gap-2">
                    {ALL_CURSORS.map(c => (
                      <button
                        key={c}
                        onClick={() => update('cursorStyle', c)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all border"
                        style={{
                          borderColor: settings.cursorStyle === c ? accent : 'transparent',
                          background: settings.cursorStyle === c ? `${accent}15` : 'rgba(39,39,42,0.5)',
                          color: settings.cursorStyle === c ? accent : '#a1a1aa',
                        }}
                        title={t(`cursor.${c}`, l)}
                      >
                        {CURSOR_STYLE_SVGS[c]}
                        <span className="text-[10px]">{t(`cursor.${c}`, l)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Scheme */}
                <div className="mb-5">
                  <label className="text-xs text-zinc-400 mb-2 block font-medium uppercase tracking-wider">{t('settings.color', l)}</label>
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
                        <span className="text-[10px] text-zinc-400">{t(`color.${c}`, l)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background */}
                <div className="mb-5">
                  <label className="text-xs text-zinc-400 mb-2 block font-medium uppercase tracking-wider">{t('settings.background', l)}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_BACKGROUNDS.map(bg => (
                      <button
                        key={bg}
                        onClick={() => update('background', bg)}
                        className="p-3 rounded-lg text-left transition-all border"
                        style={{
                          borderColor: settings.background === bg ? accent : 'transparent',
                          background: settings.background === bg ? `${accent}15` : 'rgba(39,39,42,0.5)',
                        }}
                      >
                        <div
                          className="text-sm font-medium mb-0.5"
                          style={{ color: settings.background === bg ? accent : '#e4e4e7' }}
                        >
                          {t(`bg.${bg}`, l)}
                        </div>
                        <div className="text-[10px] text-zinc-500">{t(`bg.${bg}.desc`, l)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* FPS 3D Section */}
              <div className="mt-8">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4 font-semibold">{t('settings.section.fps3d', l)}</div>

                {/* Sensitivity */}
                <RangeSlider label={t('settings.sensitivity', l)} value={fps.sensitivity} min={0.1} max={5} step={0.1}
                  onChange={v => updateFps({ sensitivity: v })} accent={accent} suffix="x" />

                {/* Map */}
                <div className="mb-5">
                  <label className="text-xs text-zinc-400 mb-2 block font-medium uppercase tracking-wider">{t('settings.map', l)}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_MAPS.map(m => (
                      <button key={m} onClick={() => updateFps({ map: m })}
                        className="p-3 rounded-lg text-left transition-all border"
                        style={{ borderColor: fps.map === m ? accent : 'transparent', background: fps.map === m ? `${accent}15` : 'rgba(39,39,42,0.5)' }}>
                        <div className="text-sm font-medium mb-0.5" style={{ color: fps.map === m ? accent : '#e4e4e7' }}>{t(`map.${m}`, l)}</div>
                        <div className="text-[10px] text-zinc-500">{t(`map.${m}.desc`, l)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Crosshair Style */}
                <div className="mb-5">
                  <label className="text-xs text-zinc-400 mb-2 block font-medium uppercase tracking-wider">{t('settings.crosshairStyle', l)}</label>
                  <div className="flex gap-2">
                    {ALL_XHAIR_STYLES.map(s => (
                      <button key={s} onClick={() => updateCH({ style: s })}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all border"
                        style={{ borderColor: xh.style === s ? accent : 'transparent', background: xh.style === s ? `${accent}15` : 'rgba(39,39,42,0.5)', color: xh.style === s ? accent : '#a1a1aa' }}>
                        <CrosshairPreview style={s} color={xh.style === s ? accent : '#a1a1aa'} />
                        <span className="text-[10px]">{t(`xhair.${s}`, l)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Crosshair live preview */}
                <div className="mb-4 flex justify-center">
                  <div className="w-20 h-20 bg-zinc-800/80 rounded-lg flex items-center justify-center border border-zinc-700/50">
                    <CrosshairPreviewFull config={xh} color={accent} />
                  </div>
                </div>

                {/* Crosshair detail sliders */}
                <div className="mb-2">
                  <label className="text-xs text-zinc-400 mb-2 block font-medium uppercase tracking-wider">{t('settings.crosshairDetail', l)}</label>
                </div>
                <RangeSlider label={t('settings.thickness', l)} value={xh.thickness} min={1} max={5} step={0.5} onChange={v => updateCH({ thickness: v })} accent={accent} />
                <RangeSlider label={t('settings.gapV', l)} value={xh.gapV} min={0} max={15} step={1} onChange={v => updateCH({ gapV: v })} accent={accent} suffix="px" />
                <RangeSlider label={t('settings.gapH', l)} value={xh.gapH} min={0} max={15} step={1} onChange={v => updateCH({ gapH: v })} accent={accent} suffix="px" />
                <RangeSlider label={t('settings.lineSize', l)} value={xh.size} min={3} max={25} step={1} onChange={v => updateCH({ size: v })} accent={accent} suffix="px" />
                <RangeSlider label={t('settings.opacity', l)} value={xh.opacity} min={0.2} max={1} step={0.05} onChange={v => updateCH({ opacity: v })} accent={accent} />
                <RangeSlider label={t('settings.dotSize', l)} value={xh.dotSize} min={0} max={5} step={0.5} onChange={v => updateCH({ dotSize: v })} accent={accent} suffix="px" />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Helpers ──────────────────────────────────────────

const ALL_MAPS: FPS3DMap[] = ['void', 'arena', 'cyber', 'outdoor', 'neon'];
const ALL_XHAIR_STYLES: FPS3DCrosshairStyle[] = ['cross', 'dot', 'circle', 'crossDot', 'tcross'];

function RangeSlider({ label, value, min, max, step, onChange, accent, suffix }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; accent: string; suffix?: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-[11px] text-zinc-400 mb-1.5">
        <span>{label}</span>
        <span className="font-mono">{Number.isInteger(value) ? value : value.toFixed(1)}{suffix ?? ''}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
          [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full"
        style={{ accentColor: accent }}
      />
    </div>
  );
}

function CrosshairPreview({ style, color }: { style: FPS3DCrosshairStyle; color: string }) {
  const s = 24, h = s / 2;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {(style === 'cross' || style === 'crossDot' || style === 'tcross') && <>
        {style !== 'tcross' && <line x1={h} y1={2} x2={h} y2={h - 3} stroke={color} strokeWidth="1.5" />}
        <line x1={h} y1={h + 3} x2={h} y2={s - 2} stroke={color} strokeWidth="1.5" />
        <line x1={2} y1={h} x2={h - 3} y2={h} stroke={color} strokeWidth="1.5" />
        <line x1={h + 3} y1={h} x2={s - 2} y2={h} stroke={color} strokeWidth="1.5" />
      </>}
      {style === 'circle' && <circle cx={h} cy={h} r={h - 3} stroke={color} strokeWidth="1.5" fill="none" />}
      {(style === 'crossDot' || style === 'dot' || style === 'circle') && <circle cx={h} cy={h} r={2} fill={color} />}
    </svg>
  );
}

function CrosshairPreviewFull({ config, color }: { config: CrosshairConfig; color: string }) {
  const { style, thickness, gapV, gapH, size, opacity, dotSize } = config;
  const cx = 40, cy = 40;
  const hasLines = style === 'cross' || style === 'crossDot' || style === 'tcross';
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      {hasLines && <>
        {style !== 'tcross' && <line x1={cx} y1={cy - gapV} x2={cx} y2={Math.max(0, cy - gapV - size)} stroke={color} strokeWidth={thickness} opacity={opacity} strokeLinecap="round" />}
        <line x1={cx} y1={cy + gapV} x2={cx} y2={Math.min(80, cy + gapV + size)} stroke={color} strokeWidth={thickness} opacity={opacity} strokeLinecap="round" />
        <line x1={cx - gapH} y1={cy} x2={Math.max(0, cx - gapH - size)} y2={cy} stroke={color} strokeWidth={thickness} opacity={opacity} strokeLinecap="round" />
        <line x1={cx + gapH} y1={cy} x2={Math.min(80, cx + gapH + size)} y2={cy} stroke={color} strokeWidth={thickness} opacity={opacity} strokeLinecap="round" />
      </>}
      {style === 'circle' && <circle cx={cx} cy={cy} r={gapH + size / 2} stroke={color} strokeWidth={thickness} fill="none" opacity={opacity} />}
      {(style === 'crossDot' || style === 'dot' || style === 'circle') && dotSize > 0 && (
        <circle cx={cx} cy={cy} r={dotSize} fill={color} opacity={opacity} />
      )}
    </svg>
  );
}
