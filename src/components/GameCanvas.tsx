import { useEffect, useRef } from 'react';
import type { GameState } from '../game/types';
import { renderGame } from '../game/renderer';
import { CELL_SIZE } from '../game/constants';

interface GameCanvasProps {
  gameState: GameState | null;
}

export default function GameCanvas({ gameState }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      if (!gameState) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      const player = gameState.snakes.find((s) => s.isPlayer);
      let cameraX = 0;
      let cameraY = 0;

      if (player && player.isAlive) {
        const head = player.segments[0];
        const viewCellsX = canvas.width / CELL_SIZE;
        const viewCellsY = canvas.height / CELL_SIZE;
        cameraX = head.x - viewCellsX / 2;
        cameraY = head.y - viewCellsY / 2;
      } else {
        cameraX = gameState.gridWidth / 2 - canvas.width / (2 * CELL_SIZE);
        cameraY = gameState.gridHeight / 2 - canvas.height / (2 * CELL_SIZE);
      }

      renderGame(ctx, gameState, canvas.width, canvas.height, cameraX, cameraY);
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
