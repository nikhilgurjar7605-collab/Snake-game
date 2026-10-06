import { useEffect, useCallback } from 'react';
import type { Direction } from './game/types';
import { useGameLoop } from './game/useGameLoop';
import type { GameScreen } from './game/types';
import GameCanvas from './components/GameCanvas';
import Leaderboard from './components/Leaderboard';
import GameOver from './components/GameOver';
import Menu from './components/Menu';
import { useState } from 'react';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('MENU');
  const {
    gameState,
    playerAlive,
    playerScore,
    playerKills,
    initGame,
    setPlayerDirection,
    setPlayerBoost,
  } = useGameLoop();

  const handleStart = useCallback(() => {
    initGame();
    setScreen('PLAYING');
  }, [initGame]);

  const handleRestart = useCallback(() => {
    initGame();
    setScreen('PLAYING');
  }, [initGame]);

  const handleMenu = useCallback(() => {
    setScreen('MENU');
  }, []);

  useEffect(() => {
    if (screen !== 'PLAYING') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let direction: Direction | null = null;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = 'RIGHT';
          break;
        case ' ':
          e.preventDefault();
          setPlayerBoost(true);
          break;
      }

      if (direction) {
        e.preventDefault();
        setPlayerDirection(direction);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setPlayerBoost(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [screen, setPlayerDirection, setPlayerBoost]);

  useEffect(() => {
    if (screen === 'PLAYING' && !playerAlive && gameState) {
      const timer = setTimeout(() => {
        setScreen('GAME_OVER');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [playerAlive, screen, gameState]);

  return (
    <div className="w-screen h-screen bg-slate-950 overflow-hidden relative select-none">
      {screen === 'MENU' && <Menu onStart={handleStart} />}

      {screen === 'PLAYING' && (
        <>
          <GameCanvas gameState={gameState} />
          <Leaderboard gameState={gameState} />

          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg p-3">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Score</div>
                <div className="text-xl font-bold text-cyan-400 font-mono">{playerScore}</div>
              </div>
              <div className="w-px h-8 bg-slate-700"></div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Kills</div>
                <div className="text-xl font-bold text-orange-400 font-mono">{playerKills}</div>
              </div>
              <div className="w-px h-8 bg-slate-700"></div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Length</div>
                <div className="text-xl font-bold text-green-400 font-mono">
                  {gameState?.snakes.find((s) => s.isPlayer)?.segments.length ?? 0}
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 text-xs text-slate-600 space-y-0.5">
            <div>WASD / Arrows — Move</div>
            <div>Space — Boost</div>
          </div>

          {!playerAlive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-4xl font-bold text-red-500 animate-pulse">ELIMINATED</div>
            </div>
          )}
        </>
      )}

      {screen === 'GAME_OVER' && (
        <>
          <GameCanvas gameState={gameState} />
          <GameOver
            score={playerScore}
            kills={playerKills}
            onRestart={handleRestart}
            onMenu={handleMenu}
          />
        </>
      )}
    </div>
  );
}
