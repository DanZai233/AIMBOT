export type GameMode = 'GRIDSHOT' | 'SPIDERSHOT' | 'MICROFLICK' | 'TRACKING' | 'FPS3D';

export type GameState = 'MENU' | 'PLAYING' | 'RESULTS';

export type Locale = 'zh' | 'en';
export type TargetShape = 'circle' | 'diamond' | 'star' | 'hexagon' | 'triangle';
export type CursorStyle = 'crosshair' | 'dot' | 'ring' | 'precise';
export type BackgroundTheme = 'dark' | 'grid' | 'gradient' | 'stars';
export type ColorScheme = 'cyan' | 'red' | 'green' | 'purple' | 'orange';
export type TargetSizePreset = 'small' | 'medium' | 'large';
export type SpeedPreset = 'slow' | 'normal' | 'fast';

export interface SchemeColors {
  primary: string;
  secondary: string;
  glow: string;
  bg: string;
  text: string;
}

export interface GameSettings {
  duration: number;
  targetSize: TargetSizePreset;
  speed: SpeedPreset;
  targetShape: TargetShape;
  cursorStyle: CursorStyle;
  background: BackgroundTheme;
  colorScheme: ColorScheme;
  locale: Locale;
}

export const DEFAULT_SETTINGS: GameSettings = {
  duration: 60,
  targetSize: 'medium',
  speed: 'normal',
  targetShape: 'circle',
  cursorStyle: 'crosshair',
  background: 'dark',
  colorScheme: 'cyan',
  locale: 'zh',
};

export const DURATION_OPTIONS = [15, 30, 60, 120] as const;

export const COLOR_SCHEMES: Record<ColorScheme, SchemeColors> = {
  cyan:   { primary: '#06b6d4', secondary: '#22d3ee', glow: 'rgba(6,182,212,0.5)',   bg: 'rgba(6,182,212,0.15)',   text: '#67e8f9' },
  red:    { primary: '#ef4444', secondary: '#f87171', glow: 'rgba(239,68,68,0.5)',   bg: 'rgba(239,68,68,0.15)',   text: '#fca5a5' },
  green:  { primary: '#22c55e', secondary: '#4ade80', glow: 'rgba(34,197,94,0.5)',   bg: 'rgba(34,197,94,0.15)',   text: '#86efac' },
  purple: { primary: '#a855f7', secondary: '#c084fc', glow: 'rgba(168,85,247,0.5)', bg: 'rgba(168,85,247,0.15)', text: '#d8b4fe' },
  orange: { primary: '#f97316', secondary: '#fb923c', glow: 'rgba(249,115,22,0.5)', bg: 'rgba(249,115,22,0.15)', text: '#fdba74' },
};

export const TARGET_SIZE_MULTIPLIERS: Record<TargetSizePreset, number> = {
  small: 0.6,
  medium: 1.0,
  large: 1.4,
};

export const SPEED_MULTIPLIERS: Record<SpeedPreset, number> = {
  slow: 0.6,
  normal: 1.0,
  fast: 1.5,
};

export interface Target {
  id: string;
  x: number;
  y: number;
  radius: number;
  createdAt: number;
  vx?: number;
  vy?: number;
}

export interface HitMarker {
  x: number;
  y: number;
  createdAt: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface ScorePopup {
  x: number;
  y: number;
  value: number;
  createdAt: number;
}

export interface GameStats {
  score: number;
  hits: number;
  misses: number;
  totalTime: number;
  accuracy: number;
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
