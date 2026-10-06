import type { GameConfig } from './types';

export const GAME_CONFIG: GameConfig = {
  gridWidth: 80,
  gridHeight: 60,
  maxFood: 50,
  maxSnakes: 8,
  initialSnakeLength: 5,
  foodSpawnInterval: 30,
  baseSpeed: 120,
  boostSpeedMultiplier: 1.8,
  boostDuration: 30,
  boostCooldown: 100,
};

export const CELL_SIZE = 10;

export const SNAKE_COLORS: Array<{ body: string; head: string }> = [
  { body: '#22d3ee', head: '#06b6d4' },
  { body: '#f97316', head: '#ea580c' },
  { body: '#a855f7', head: '#9333ea' },
  { body: '#10b981', head: '#059669' },
  { body: '#f43f5e', head: '#e11d48' },
  { body: '#eab308', head: '#ca8a04' },
  { body: '#6366f1', head: '#4f46e5' },
  { body: '#ec4899', head: '#db2777' },
];

export const BOT_NAMES = [
  'Viper',
  'Cobra',
  'Mamba',
  'Python',
  'Asp',
  'Adder',
  'Taipan',
  'Rattler',
  'Sidewinder',
  'Copperhead',
  'Boa',
  'Anaconda',
];

export const FOOD_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
];

export const DIRECTION_VECTORS: Record<string, { x: number; y: number }> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export const OPPOSITE_DIRECTIONS: Record<string, string> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};
