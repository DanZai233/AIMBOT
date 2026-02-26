export type GameMode = 'GRIDSHOT' | 'SPIDERSHOT' | 'MICROFLICK' | 'TRACKING';

export type GameState = 'MENU' | 'PLAYING' | 'RESULTS';

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

export interface GameStats {
  score: number;
  hits: number;
  misses: number;
  totalTime: number;
  accuracy: number;
}
