import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState, Snake, Direction, Particle } from './types';
import { GAME_CONFIG, SNAKE_COLORS, BOT_NAMES, DIRECTION_VECTORS } from './constants';
import {
  createSnake,
  moveSnake,
  checkSelfCollision,
  checkHeadOnCollision,
  checkHeadOnBodyCollision,
  checkFoodCollision,
  growSnake,
  killSnake,
  spawnFood,
  getAllOccupiedPositions,
} from './engine';
import { getAIDirection, initializeAI } from './ai';

export function useGameLoop() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerAlive, setPlayerAlive] = useState(true);
  const [playerScore, setPlayerScore] = useState(0);
  const [playerKills, setPlayerKills] = useState(0);
  const gameLoopRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const tickAccumulatorRef = useRef<number>(0);
  const stateRef = useRef<GameState | null>(null);

  const initGame = useCallback(() => {
    const snakes: Snake[] = [];

    const playerColor = SNAKE_COLORS[0];
    const playerSnake = createSnake(
      'player',
      'You',
      true,
      GAME_CONFIG.gridWidth,
      GAME_CONFIG.gridHeight,
      playerColor.body,
      playerColor.head
    );
    snakes.push(playerSnake);

    const usedNames = new Set<string>();
    for (let i = 1; i < GAME_CONFIG.maxSnakes; i++) {
      const colorIdx = i % SNAKE_COLORS.length;
      let botName: string;
      do {
        botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      } while (usedNames.has(botName));
      usedNames.add(botName);

      const bot = createSnake(
        `bot-${i}`,
        botName,
        false,
        GAME_CONFIG.gridWidth,
        GAME_CONFIG.gridHeight,
        SNAKE_COLORS[colorIdx].body,
        SNAKE_COLORS[colorIdx].head
      );
      initializeAI(bot.id);
      snakes.push(bot);
    }

    const food: Array<ReturnType<typeof spawnFood>> = [];
    const occupied = new Set<string>();
    for (const snake of snakes) {
      for (const seg of snake.segments) {
        occupied.add(`${seg.x},${seg.y}`);
      }
    }

    for (let i = 0; i < GAME_CONFIG.maxFood; i++) {
      const newFood = spawnFood(GAME_CONFIG.gridWidth, GAME_CONFIG.gridHeight, occupied);
      food.push(newFood);
      occupied.add(`${newFood.position.x},${newFood.position.y}`);
    }

    const state: GameState = {
      snakes,
      food,
      particles: [],
      gridWidth: GAME_CONFIG.gridWidth,
      gridHeight: GAME_CONFIG.gridHeight,
      tick: 0,
      isRunning: true,
    };

    stateRef.current = state;
    setGameState(state);
    setPlayerAlive(true);
    setPlayerScore(0);
    setPlayerKills(0);
    lastTickRef.current = performance.now();
    tickAccumulatorRef.current = 0;
  }, []);

  const setPlayerDirection = useCallback((direction: Direction) => {
    if (!stateRef.current) return;
    const player = stateRef.current.snakes.find((s) => s.isPlayer);
    if (player && player.isAlive) {
      player.nextDirection = direction;
    }
  }, []);

  const setPlayerBoost = useCallback((boosting: boolean) => {
    if (!stateRef.current) return;
    const player = stateRef.current.snakes.find((s) => s.isPlayer);
    if (player && player.isAlive) {
      if (boosting && player.boostCooldown <= 0 && player.segments.length > GAME_CONFIG.initialSnakeLength) {
        player.isBoosting = true;
      } else if (!boosting) {
        player.isBoosting = false;
      }
    }
  }, []);

  const createDeathParticles = useCallback((snake: Snake): Particle[] => {
    const particles: Particle[] = [];
    for (const segment of snake.segments) {
      for (let i = 0; i < 3; i++) {
        particles.push({
          position: { x: segment.x + Math.random() - 0.5, y: segment.y + Math.random() - 0.5 },
          velocity: {
            x: (Math.random() - 0.5) * 0.3,
            y: (Math.random() - 0.5) * 0.3,
          },
          life: 30 + Math.random() * 20,
          maxLife: 50,
          color: snake.color,
          size: 2 + Math.random() * 2,
        });
      }
    }
    return particles;
  }, []);

  const gameTick = useCallback(() => {
    const state = stateRef.current;
    if (!state || !state.isRunning) return;

    state.tick++;

    for (const snake of state.snakes) {
      if (!snake.isAlive) continue;

      if (!snake.isPlayer) {
        snake.nextDirection = getAIDirection(snake, state);
      }

      if (snake.isBoosting) {
        snake.boostCooldown--;
        if (snake.boostCooldown <= 0) {
          snake.isBoosting = false;
          snake.boostCooldown = GAME_CONFIG.boostCooldown;
        }
      } else if (snake.boostCooldown > 0) {
        snake.boostCooldown--;
      }

      moveSnake(snake, state.gridWidth, state.gridHeight);
    }

    const newParticles: Particle[] = [];

    for (const snake of state.snakes) {
      if (!snake.isAlive) continue;

      if (checkSelfCollision(snake)) {
        killSnake(snake);
        newParticles.push(...createDeathParticles(snake));
        continue;
      }

      for (const other of state.snakes) {
        if (other.id === snake.id || !other.isAlive) continue;

        if (checkHeadOnBodyCollision(snake, other)) {
          killSnake(snake);
          other.kills++;
          other.score += 50;
          newParticles.push(...createDeathParticles(snake));
          break;
        }

        if (checkHeadOnCollision(snake, other)) {
          if (snake.segments.length <= other.segments.length) {
            killSnake(snake);
            other.kills++;
            other.score += 50;
            newParticles.push(...createDeathParticles(snake));
          }
          if (other.segments.length <= snake.segments.length) {
            killSnake(other);
            snake.kills++;
            snake.score += 50;
            newParticles.push(...createDeathParticles(other));
          }
        }
      }
    }

    const foodsToRemove: string[] = [];
    for (const food of state.food) {
      for (const snake of state.snakes) {
        if (!snake.isAlive) continue;
        if (checkFoodCollision(snake, food)) {
          growSnake(snake, food.value);
          foodsToRemove.push(food.id);
          break;
        }
      }
    }

    state.food = state.food.filter((f) => !foodsToRemove.includes(f.id));

    if (state.food.length < GAME_CONFIG.maxFood && state.tick % GAME_CONFIG.foodSpawnInterval === 0) {
      const occupied = getAllOccupiedPositions(state);
      const newFood = spawnFood(state.gridWidth, state.gridHeight, occupied);
      state.food.push(newFood);
    }

    const deadBots = state.snakes.filter((s) => !s.isPlayer && !s.isAlive);
    for (const deadBot of deadBots) {
      const colorIdx = Math.floor(Math.random() * SNAKE_COLORS.length);
      let botName: string;
      const usedNames = new Set(state.snakes.filter((s) => s.isAlive).map((s) => s.name));
      do {
        botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      } while (usedNames.has(botName));

      const newBot = createSnake(
        `bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        botName,
        false,
        state.gridWidth,
        state.gridHeight,
        SNAKE_COLORS[colorIdx].body,
        SNAKE_COLORS[colorIdx].head
      );
      initializeAI(newBot.id);
      state.snakes.push(newBot);
    }

    state.snakes = state.snakes.filter((s) => s.isPlayer || s.isAlive || state.tick % 200 !== 0);

    state.particles.push(...newParticles);
    state.particles = state.particles
      .map((p) => ({
        ...p,
        position: {
          x: p.position.x + p.velocity.x,
          y: p.position.y + p.velocity.y,
        },
        life: p.life - 1,
      }))
      .filter((p) => p.life > 0);

    const player = state.snakes.find((s) => s.isPlayer);
    if (player) {
      setPlayerAlive(player.isAlive);
      setPlayerScore(player.score);
      setPlayerKills(player.kills);
      if (!player.isAlive) {
        state.isRunning = false;
      }
    }

    stateRef.current = { ...state };
    setGameState({ ...state });
  }, [createDeathParticles]);

  useEffect(() => {
    const loop = (timestamp: number) => {
      const delta = timestamp - lastTickRef.current;
      lastTickRef.current = timestamp;

      const state = stateRef.current;
      if (state && state.isRunning) {
        const player = state.snakes.find((s) => s.isPlayer);
        const speed = player?.isBoosting
          ? GAME_CONFIG.baseSpeed / GAME_CONFIG.boostSpeedMultiplier
          : GAME_CONFIG.baseSpeed;

        tickAccumulatorRef.current += delta;
        while (tickAccumulatorRef.current >= speed) {
          gameTick();
          tickAccumulatorRef.current -= speed;
        }
      }

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current !== null) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameTick]);

  return {
    gameState,
    playerAlive,
    playerScore,
    playerKills,
    initGame,
    setPlayerDirection,
    setPlayerBoost,
  };
}
