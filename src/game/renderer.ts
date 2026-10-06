import type { GameState, Snake, Food, Particle } from './types';
import { CELL_SIZE } from './constants';

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasWidth: number,
  canvasHeight: number,
  cameraX: number,
  cameraY: number
): void {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  renderBackground(ctx, canvasWidth, canvasHeight, cameraX, cameraY, state);
  renderFood(ctx, state.food, cameraX, cameraY, state.tick);
  renderSnakes(ctx, state.snakes, cameraX, cameraY);
  renderParticles(ctx, state.particles, cameraX, cameraY);
}

function renderBackground(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  cameraX: number,
  cameraY: number,
  state: GameState
): void {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const gridSize = CELL_SIZE;
  const offsetX = -cameraX * gridSize;
  const offsetY = -cameraY * gridSize;

  ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
  ctx.lineWidth = 0.5;

  const startX = Math.floor(cameraX / 1) * 1;
  const startY = Math.floor(cameraY / 1) * 1;
  const endX = startX + Math.ceil(canvasWidth / gridSize) + 2;
  const endY = startY + Math.ceil(canvasHeight / gridSize) + 2;

  for (let x = startX; x <= endX; x++) {
    const screenX = (x % state.gridWidth) * gridSize + offsetX;
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, canvasHeight);
    ctx.stroke();
  }

  for (let y = startY; y <= endY; y++) {
    const screenY = (y % state.gridHeight) * gridSize + offsetY;
    ctx.beginPath();
    ctx.moveTo(0, screenY);
    ctx.lineTo(canvasWidth, screenY);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
  ctx.lineWidth = 2;
  ctx.strokeRect(offsetX, offsetY, state.gridWidth * gridSize, state.gridHeight * gridSize);
}

function renderFood(
  ctx: CanvasRenderingContext2D,
  foods: Food[],
  cameraX: number,
  cameraY: number,
  tick: number
): void {
  for (const food of foods) {
    const screenX = food.position.x * CELL_SIZE - cameraX * CELL_SIZE + CELL_SIZE / 2;
    const screenY = food.position.y * CELL_SIZE - cameraY * CELL_SIZE + CELL_SIZE / 2;

    const pulse = Math.sin(tick * 0.1 + food.pulsePhase) * 0.3 + 1;
    const radius = (CELL_SIZE / 2 - 1) * pulse;

    ctx.save();
    ctx.shadowColor = food.color;
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
    ctx.fillStyle = food.color;
    ctx.fill();

    if (food.value > 1) {
      ctx.beginPath();
      ctx.arc(screenX, screenY, radius * 1.4, 0, Math.PI * 2);
      ctx.strokeStyle = food.color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}

function renderSnakes(
  ctx: CanvasRenderingContext2D,
  snakes: Snake[],
  cameraX: number,
  cameraY: number
): void {
  for (const snake of snakes) {
    if (!snake.isAlive) continue;
    renderSnake(ctx, snake, cameraX, cameraY);
  }
}

function renderSnake(
  ctx: CanvasRenderingContext2D,
  snake: Snake,
  cameraX: number,
  cameraY: number
): void {
  const segments = snake.segments;

  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i];
    const screenX = segment.x * CELL_SIZE - cameraX * CELL_SIZE;
    const screenY = segment.y * CELL_SIZE - cameraY * CELL_SIZE;

    const progress = i / segments.length;
    const alpha = 1 - progress * 0.3;
    const size = CELL_SIZE - 2 - progress * 2;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (i === 0) {
      ctx.shadowColor = snake.headColor;
      ctx.shadowBlur = snake.isBoosting ? 12 : 6;

      ctx.fillStyle = snake.headColor;
      ctx.beginPath();
      ctx.roundRect(
        screenX + (CELL_SIZE - size) / 2,
        screenY + (CELL_SIZE - size) / 2,
        size + 2,
        size + 2,
        3
      );
      ctx.fill();

      renderEyes(ctx, snake, screenX, screenY);
    } else {
      ctx.fillStyle = snake.color;
      ctx.beginPath();
      ctx.roundRect(
        screenX + (CELL_SIZE - size) / 2,
        screenY + (CELL_SIZE - size) / 2,
        size,
        size,
        2
      );
      ctx.fill();
    }

    ctx.restore();
  }

  renderNameTag(ctx, snake, cameraX, cameraY);
}

function renderEyes(
  ctx: CanvasRenderingContext2D,
  snake: Snake,
  screenX: number,
  screenY: number
): void {
  const centerX = screenX + CELL_SIZE / 2;
  const centerY = screenY + CELL_SIZE / 2;

  let eye1X: number, eye1Y: number, eye2X: number, eye2Y: number;

  switch (snake.direction) {
    case 'UP':
      eye1X = centerX - 2;
      eye1Y = centerY - 2;
      eye2X = centerX + 2;
      eye2Y = centerY - 2;
      break;
    case 'DOWN':
      eye1X = centerX - 2;
      eye1Y = centerY + 2;
      eye2X = centerX + 2;
      eye2Y = centerY + 2;
      break;
    case 'LEFT':
      eye1X = centerX - 2;
      eye1Y = centerY - 2;
      eye2X = centerX - 2;
      eye2Y = centerY + 2;
      break;
    case 'RIGHT':
      eye1X = centerX + 2;
      eye1Y = centerY - 2;
      eye2X = centerX + 2;
      eye2Y = centerY + 2;
      break;
  }

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(eye1X, eye1Y, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eye2X, eye2Y, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(eye1X, eye1Y, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eye2X, eye2Y, 0.8, 0, Math.PI * 2);
  ctx.fill();
}

function renderNameTag(
  ctx: CanvasRenderingContext2D,
  snake: Snake,
  cameraX: number,
  cameraY: number
): void {
  const head = snake.segments[0];
  const screenX = head.x * CELL_SIZE - cameraX * CELL_SIZE + CELL_SIZE / 2;
  const screenY = head.y * CELL_SIZE - cameraY * CELL_SIZE - 8;

  ctx.save();
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  const textWidth = ctx.measureText(snake.name).width;
  ctx.fillRect(screenX - textWidth / 2 - 2, screenY - 10, textWidth + 4, 12);

  ctx.fillStyle = snake.isPlayer ? '#22d3ee' : '#94a3b8';
  ctx.fillText(snake.name, screenX, screenY);
  ctx.restore();
}

function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  cameraX: number,
  cameraY: number
): void {
  for (const particle of particles) {
    const screenX = particle.position.x * CELL_SIZE - cameraX * CELL_SIZE;
    const screenY = particle.position.y * CELL_SIZE - cameraY * CELL_SIZE;
    const alpha = particle.life / particle.maxLife;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(screenX, screenY, particle.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
