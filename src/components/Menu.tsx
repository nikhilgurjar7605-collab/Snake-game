interface MenuProps {
  onStart: () => void;
}

export default function Menu({ onStart }: MenuProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 z-50">
      <div className="text-center max-w-lg mx-4">
        <div className="mb-8">
          <div className="text-7xl mb-4 animate-bounce">🐍</div>
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 mb-2">
            SNAKE ARENA
          </h1>
          <p className="text-slate-400 text-lg">Multiplayer Battle Royale</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8 text-left">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3">How to Play</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">⌨️</span>
              <span>Use <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs font-mono">WASD</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs font-mono">Arrow Keys</kbd> to move</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 font-bold">⚡</span>
              <span>Hold <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs font-mono">Space</kbd> to boost (costs length)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 font-bold">🍎</span>
              <span>Eat food to grow and earn points</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">💀</span>
              <span>Make other snakes crash into you to earn kill bonus</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">🏆</span>
              <span>Survive and dominate the arena!</span>
            </li>
          </ul>
        </div>

        <button
          onClick={onStart}
          className="group relative px-12 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xl font-bold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl shadow-cyan-900/40"
        >
          <span className="relative z-10">🎮 Enter Arena</span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity blur-xl"></div>
        </button>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            7 bots online
          </span>
          <span>•</span>
          <span>Arena #4291</span>
        </div>
      </div>
    </div>
  );
}
