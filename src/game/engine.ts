import type { Position, Snake, Food, Direction, GameState } from './types';
import { GAME_CONFIG, DIRECTION_VECTORS, OPPOSITE_DIRECTIONS } from './constants';

export function createSnake(
  id: string,
  name: string,
  isPlayer: boolean,
  gridWidth: number,
  gridHeight: number,
  colorBody: string,
  colorHead: string
): Snake {
  const startX = Math.floor(Math.random() * (gridWidth - 20)) + 10;
  const startY = Math.floor(Math.random() * (gridHeight - 20)) + 10;
  const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  const direction = directions[Math.floor(Math.random() * 4)];

  const segments: Position[] = [];
  const vector = DIRECTION_VECTORS[direction];

  for (let i = 0; i < GAME_CONFIG.initialSnakeLength; i++) {
    segments.push({
      x: startX - vector.x * i,
      y: startY - vector.y * i,
    });
  }

  return {
    id,
    name,
    segments,
    direction,
    nextDirection: direction,
    color: colorBody,
    headColor: colorHead,
    score: 0,
    isAlive: true,
    isPlayer,
    speed: GAME_CONFIG.baseSpeed,
    boostCooldown: 0,
    isBoosting: false,
    kills: 0,
  };
}

export function moveSnake(snake: Snake, gridWidth: number, gridHeight: number): void {
  if (!snake.isAlive) return;

  const currentDir = snake.nextDirection;
  if (OPPOSITE_DIRECTIONS[currentDir] !== snake.direction) {
    snake.direction = currentDir;
  }

  const vector = DIRECTION_VECTORS[snake.direction];
  const head = snake.segments[0];
  const newHead: Position = {
    x: (head.x + vector.x + gridWidth) % gridWidth,
    y: (head.y + vector.y + gridHeight) % gridHeight,
  };

  snake.segments.unshift(newHead);

  if (snake.isBoosting && snake.segments.length > GAME_CONFIG.initialSnakeLength) {
    snake.segments.pop();
  }
}

export function checkSelfCollision(snake: Snake): boolean {
  if (snake.segments.length <= 4) return false;
  const head = snake.segments[0];
  for (let i = 1; i < snake.segments.length; i++) {
    if (head.x === snake.segments[i].x && head.y === snake.segments[i].y) {
      return true;
    }
  }
  return false;
}

export function checkHeadOnCollision(snakeA: Snake, snakeB: Snake): boolean {
  if (!snakeA.isAlive || !snakeB.isAlive) return false;
  const headA = snakeA.segments[0];
  const headB = snakeB.segments[0];
  return headA.x === headB.x && headA.y === headB.y;
}

export function checkHeadOnBodyCollision(snake: Snake, otherSnake: Snake): boolean {
  if (!snake.isAlive || !otherSnake.isAlive) return false;
  const head = snake.segments[0];
  for (let i = 1; i < otherSnake.segments.length; i++) {
    if (head.x === otherSnake.segments[i].x && head.y === otherSnake.segments[i].y) {
      return true;
    }
  }
  return false;
}

export function checkFoodCollision(snake: Snake, food: Food): boolean {
  if (!snake.isAlive) return false;
  const head = snake.segments[0];
  return head.x === food.position.x && head.y === food.position.y;
}

export function growSnake(snake: Snake, amount: number): void {
  const tail = snake.segments[snake.segments.length - 1];
  for (let i = 0; i < amount; i++) {
    snake.segments.push({ x: tail.x, y: tail.y });
  }
  snake.score += amount * 10;
}

export function killSnake(snake: Snake): void {
  snake.isAlive = false;
}

export function spawnFood(gridWidth: number, gridHeight: number, existingPositions: Set<string>): Food {
  let position: Position;
  let attempts = 0;

  do {
    position = {
      x: Math.floor(Math.random() * gridWidth),
      y: Math.floor(Math.random() * gridHeight),
    };
    attempts++;
  } while (existingPositions.has(`${position.x},${position.y}`) && attempts < 100);

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
  const value = Math.random() < 0.2 ? 3 : 1;

  return {
    id: `food-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    position,
    value,
    color: colors[Math.floor(Math.random() * colors.length)],
    pulsePhase: Math.random() * Math.PI * 2,
  };
}

export function getAllOccupiedPositions(state: GameState): Set<string> {
  const positions = new Set<string>();
  for (const snake of state.snakes) {
    if (!snake.isAlive) continue;
    for (const segment of snake.segments) {
      positions.add(`${segment.x},${segment.y}`);
    }
  }
  for (const food of state.food) {
    positions.add(`${food.position.x},${food.position.y}`);
  }
  return positions;
}

export function getDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function getDirectionTowards(from: Position, to: Position, currentDirection: Direction): Direction {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  const gridWidth = GAME_CONFIG.gridWidth;
  const gridHeight = GAME_CONFIG.gridHeight;

  const wrappedDx = Math.abs(dx) > gridWidth / 2 ? -Math.sign(dx) : Math.sign(dx);
  const wrappedDy = Math.abs(dy) > gridHeight / 2 ? -Math.sign(dy) : Math.sign(dy);

  let preferred: Direction;

  if (Math.abs(wrappedDx) > Math.abs(wrappedDy)) {
    preferred = wrappedDx > 0 ? 'RIGHT' : 'LEFT';
  } else if (Math.abs(wrappedDy) > Math.abs(wrappedDx)) {
    preferred = wrappedDy > 0 ? 'DOWN' : 'UP';
  } else {
    preferred = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';
    if (wrappedDy !== 0) {
      preferred = wrappedDy > 0 ? 'DOWN' : 'UP';
    }
  }

  if (OPPOSITE_DIRECTIONS[preferred] === currentDirection) {
    const alternatives: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'].filter(
      (d) => d !== currentDirection && OPPOSITE_DIRECTIONS[d] !== currentDirection
    ) as Direction[];
    if (alternatives.length > 0) {
      return alternatives[Math.floor(Math.random() * alternatives.length)];
    }
  }

  return preferred;
}
