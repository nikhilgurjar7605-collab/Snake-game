export interface Position {
  x: number;
  y: number;
}

export interface SnakeSegment extends Position {
  isHead: boolean;
}

export interface Snake {
  id: string;
  name: string;
  segments: Position[];
  direction: Direction;
  nextDirection: Direction;
  color: string;
  headColor: string;
  score: number;
  isAlive: boolean;
  isPlayer: boolean;
  speed: number;
  boostCooldown: number;
  isBoosting: boolean;
  kills: number;
}

export interface Food {
  id: string;
  position: Position;
  value: number;
  color: string;
  pulsePhase: number;
}

export interface Particle {
  position: Position;
  velocity: Position;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface GameState {
  snakes: Snake[];
  food: Food[];
  particles: Particle[];
  gridWidth: number;
  gridHeight: number;
  tick: number;
  isRunning: boolean;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  kills: number;
  isPlayer: boolean;
  isAlive: boolean;
  color: string;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type GameScreen = 'MENU' | 'PLAYING' | 'GAME_OVER';

export interface GameConfig {
  gridWidth: number;
  gridHeight: number;
  maxFood: number;
  maxSnakes: number;
  initialSnakeLength: number;
  foodSpawnInterval: number;
  baseSpeed: number;
  boostSpeedMultiplier: number;
  boostDuration: number;
  boostCooldown: number;
}
