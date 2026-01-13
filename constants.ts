
import { LevelConfig } from './types';

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    flyCount: 1,
    flySpeed: 2,
    flySize: 60,
    swatterSizeScale: 0.5,
    erraticness: 0, // Linear
    timer: 10
  },
  {
    flyCount: 2,
    flySpeed: 2,
    flySize: 45,
    swatterSizeScale: 0.35,
    erraticness: 0, // Linear
    timer: 10
  },
  {
    flyCount: 3,
    flySpeed: 2,
    flySize: 35,
    swatterSizeScale: 0.25,
    erraticness: 0.05, // Random direction changes
    timer: 10
  },
  {
    flyCount: 3,
    flySpeed: 2.6, // 30% faster than L3
    flySize: 30,
    swatterSizeScale: 0.2,
    erraticness: 0.05, // Random direction changes
    timer: 10
  },
  {
    flyCount: 5,
    flySpeed: 5,
    flySize: 20,
    swatterSizeScale: 0.15,
    erraticness: 0.2, // Erratic swarm
    timer: 20
  }
];

export const SPLAT_COLORS = [
  'rgba(173, 255, 47, 0.9)',  // GreenYellow
  'rgba(0, 255, 0, 0.8)',      // Lime
  'rgba(255, 20, 147, 0.85)',  // DeepPink
  'rgba(255, 255, 0, 0.9)',    // Yellow
  'rgba(0, 255, 255, 0.8)'     // Cyan
];

export const TIMER_DURATION = 10; // Default fallback
