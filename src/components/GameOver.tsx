interface GameOverProps {
  score: number;
  kills: number;
  onRestart: () => void;
  onMenu: () => void;
}

export default function GameOver({ score, kills, onRestart, onMenu }: GameOverProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl shadow-red-900/20">
        <div className="text-6xl mb-4">💀</div>
        <h2 className="text-3xl font-bold text-red-400 mb-2">Game Over</h2>
        <p className="text-slate-400 mb-6">Your snake has been eliminated!</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-cyan-400">{score}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Score</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-orange-400">{kills}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Kills</div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-cyan-900/30"
          >
            Play Again
          </button>
          <button
            onClick={onMenu}
            className="w-full py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-all duration-200 border border-slate-700"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
