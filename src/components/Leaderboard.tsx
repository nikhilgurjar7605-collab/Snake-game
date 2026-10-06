import type { GameState } from '../game/types';

interface LeaderboardProps {
  gameState: GameState | null;
}

export default function Leaderboard({ gameState }: LeaderboardProps) {
  if (!gameState) return null;

  const entries = gameState.snakes
    .filter((s) => s.isAlive || s.isPlayer)
    .map((s) => ({
      name: s.name,
      score: s.score,
      kills: s.kills,
      isPlayer: s.isPlayer,
      isAlive: s.isAlive,
      color: s.color,
      length: s.segments.length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return (
    <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg p-3 min-w-[180px]">
      <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1">
        <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
        Leaderboard
      </h3>
      <div className="space-y-1">
        {entries.map((entry, idx) => (
          <div
            key={entry.name}
            className={`flex items-center gap-2 text-xs py-0.5 px-1 rounded ${
              entry.isPlayer ? 'bg-cyan-950/50 border border-cyan-800/50' : ''
            } ${!entry.isAlive ? 'opacity-50' : ''}`}
          >
            <span className="text-slate-500 font-mono w-4 text-right">{idx + 1}.</span>
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            ></span>
            <span className={`flex-1 truncate ${entry.isPlayer ? 'text-cyan-300 font-bold' : 'text-slate-300'}`}>
              {entry.name}
            </span>
            <span className="text-slate-400 font-mono">{entry.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
