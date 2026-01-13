
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  LEVEL_CLEAR = 'LEVEL_CLEAR',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export interface Fly {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  size: number;
  alive: boolean;
  speed: number;
  jitter: number;
}

export interface Splat {
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
}

export interface LevelConfig {
  flyCount: number;
  flySpeed: number;
  flySize: number;
  swatterSizeScale: number;
  erraticness: number;
  timer: number;
}
