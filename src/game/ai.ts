import type { Snake, Food, GameState, Direction } from './types';
import { GAME_CONFIG } from './constants';
import { getDirectionTowards, getDistance } from './engine';

interface AIState {
  targetFood: Food | null;
  avoidTimer: number;
  personality: 'aggressive' | 'cautious' | 'food-focused';
  changeTargetTimer: number;
}

const aiStates: Map<string, AIState> = new Map();

export function initializeAI(snakeId: string): void {
  const personalities: Array<'aggressive' | 'cautious' | 'food-focused'> = [
    'aggressive',
    'cautious',
    'food-focused',
  ];
  const personality = personalities[Math.floor(Math.random() * personalities.length)];

  aiStates.set(snakeId, {
    targetFood: null,
    avoidTimer: 0,
    personality,
    changeTargetTimer: 0,
  });
}

export function removeAI(snakeId: string): void {
  aiStates.delete(snakeId);
}

export function getAIDirection(snake: Snake, state: GameState): Direction {
  const aiState = aiStates.get(snake.id);
  if (!aiState) {
    initializeAI(snake.id);
    return snake.direction;
  }

  const head = snake.segments[0];

  aiState.changeTargetTimer--;
  aiState.avoidTimer--;

  const dangerDirection = detectDanger(snake, state);
  if (dangerDirection !== null) {
    return dangerDirection;
  }

  if (aiState.personality === 'aggressive' && aiState.changeTargetTimer <= 0) {
    const nearestPlayer = findNearestPlayerSnake(snake, state);
    if (nearestPlayer && getDistance(head, nearestPlayer.segments[0]) < 15) {
      const targetPos = nearestPlayer.segments[0];
      return getDirectionTowards(head, targetPos, snake.direction);
    }
  }

  if (aiState.changeTargetTimer <= 0 || aiState.targetFood === null) {
    aiState.targetFood = findBestFood(snake, state, aiState.personality);
    aiState.changeTargetTimer = 10 + Math.floor(Math.random() * 20);
  }

  if (aiState.targetFood) {
    const foodExists = state.food.some((f) => f.id === aiState.targetFood!.id);
    if (!foodExists) {
      aiState.targetFood = findBestFood(snake, state, aiState.personality);
    }
  }

  if (aiState.targetFood) {
    return getDirectionTowards(head, aiState.targetFood.position, snake.direction);
  }

  return getRandomSafeDirection(snake, state);
}

function detectDanger(snake: Snake, state: GameState): Direction | null {
  const head = snake.segments[0];
  const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  const opposite: Record<string, string> = {
    UP: 'DOWN',
    DOWN: 'UP',
    LEFT: 'RIGHT',
    RIGHT: 'LEFT',
  };

  const vectors: Record<string, { x: number; y: number }> = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
  };

  const occupiedCells = new Set<string>();
  for (const otherSnake of state.snakes) {
    if (otherSnake.id === snake.id || !otherSnake.isAlive) continue;
    for (const segment of otherSnake.segments) {
      occupiedCells.add(`${segment.x},${segment.y}`);
    }
  }

  for (let i = 1; i < snake.segments.length; i++) {
    occupiedCells.add(`${snake.segments[i].x},${snake.segments[i].y}`);
  }

  const safeDirections: Direction[] = [];

  for (const dir of directions) {
    if (dir === opposite[snake.direction]) continue;

    const vec = vectors[dir];
    const nextX = (head.x + vec.x + GAME_CONFIG.gridWidth) % GAME_CONFIG.gridWidth;
    const nextY = (head.y + vec.y + GAME_CONFIG.gridHeight) % GAME_CONFIG.gridHeight;

    if (!occupiedCells.has(`${nextX},${nextY}`)) {
      safeDirections.push(dir);
    }
  }

  if (safeDirections.length === 0) {
    return null;
  }

  if (!safeDirections.includes(snake.direction)) {
    return safeDirections[Math.floor(Math.random() * safeDirections.length)];
  }

  return null;
}

function findBestFood(snake: Snake, state: GameState, personality: string): Food | null {
  if (state.food.length === 0) return null;

  const head = snake.segments[0];

  let candidates = [...state.food];

  if (personality === 'food-focused') {
    candidates.sort((a, b) => {
      const distA = getDistance(head, a.position) - a.value * 5;
      const distB = getDistance(head, b.position) - b.value * 5;
      return distA - distB;
    });
  } else if (personality === 'aggressive') {
    candidates = candidates.filter((f) => getDistance(head, f.position) < 25);
    if (candidates.length === 0) candidates = [...state.food];
    candidates.sort((a, b) => getDistance(head, a.position) - getDistance(head, b.position));
  } else {
    candidates.sort((a, b) => {
      const dangerA = countNearbySnakes(a.position, state, snake.id);
      const dangerB = countNearbySnakes(b.position, state, snake.id);
      if (dangerA !== dangerB) return dangerA - dangerB;
      return getDistance(head, a.position) - getDistance(head, b.position);
    });
  }

  return candidates[0] || null;
}

function countNearbySnakes(position: { x: number; y: number }, state: GameState, excludeId: string): number {
  let count = 0;
  for (const snake of state.snakes) {
    if (snake.id === excludeId || !snake.isAlive) continue;
    if (getDistance(position, snake.segments[0]) < 10) {
      count++;
    }
  }
  return count;
}

function findNearestPlayerSnake(snake: Snake, state: GameState): Snake | null {
  const head = snake.segments[0];
  let nearest: Snake | null = null;
  let minDist = Infinity;

  for (const other of state.snakes) {
    if (other.id === snake.id || !other.isAlive) continue;
    const dist = getDistance(head, other.segments[0]);
    if (dist < minDist) {
      minDist = dist;
      nearest = other;
    }
  }

  return nearest;
}

function getRandomSafeDirection(snake: Snake, state: GameState): Direction {
  const head = snake.segments[0];
  const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  const opposite: Record<string, string> = {
    UP: 'DOWN',
    DOWN: 'UP',
    LEFT: 'RIGHT',
    RIGHT: 'LEFT',
  };

  const vectors: Record<string, { x: number; y: number }> = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
  };

  const occupiedCells = new Set<string>();
  for (const otherSnake of state.snakes) {
    if (otherSnake.id === snake.id || !otherSnake.isAlive) continue;
    for (const segment of otherSnake.segments) {
      occupiedCells.add(`${segment.x},${segment.y}`);
    }
  }
  for (let i = 1; i < snake.segments.length; i++) {
    occupiedCells.add(`${snake.segments[i].x},${snake.segments[i].y}`);
  }

  const safeDirections: Direction[] = [];
  for (const dir of directions) {
    if (dir === opposite[snake.direction]) continue;
    const vec = vectors[dir];
    const nextX = (head.x + vec.x + GAME_CONFIG.gridWidth) % GAME_CONFIG.gridWidth;
    const nextY = (head.y + vec.y + GAME_CONFIG.gridHeight) % GAME_CONFIG.gridHeight;
    if (!occupiedCells.has(`${nextX},${nextY}`)) {
      safeDirections.push(dir);
    }
  }

  if (safeDirections.length > 0) {
    return safeDirections[Math.floor(Math.random() * safeDirections.length)];
  }

  return snake.direction;
}
