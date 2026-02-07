import { Sparkles, Trophy, Coins, Zap } from 'lucide-react';
import { useMirrorWorldStore } from '@/stores/mirrorWorldStore';

interface MirrorWorldCompleteProps {
  isOpen: boolean;
  onContinue: () => void;
  onExit: () => void;
  nextLevel: number;
  currentLevel: number;
  coinsEarned?: number;
  xpEarned?: number;
}

export default function MirrorWorldComplete({
  isOpen,
  onContinue,
  onExit,
  nextLevel,
  currentLevel,
  coinsEarned,
  xpEarned,
}: MirrorWorldCompleteProps) {
  const { timeRemaining } = useMirrorWorldStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-950/95 border border-purple-500/40 rounded-xl p-6 max-w-sm mx-4 shadow-2xl text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="h-6 w-6 text-purple-300" />
          <h2 className="font-display text-lg font-bold text-purple-200 uppercase tracking-wider">
            Reality Restored
          </h2>
        </div>
        <p className="text-sm text-purple-100/80 mb-4">
          You stabilized the Mirror World just in time.
        </p>
        <div className="flex items-center justify-center gap-3 text-purple-200 text-sm mb-3">
          <span className="flex items-center gap-1">
            <Trophy className="h-4 w-4 text-purple-300" />
            Time bonus: {Math.floor(timeRemaining * 2)}
          </span>
        </div>
        {(coinsEarned || xpEarned) && (
          <div className="flex items-center justify-center gap-4 mb-4 py-2 px-3 rounded-lg bg-purple-900/30 border border-purple-400/20">
            {coinsEarned != null && coinsEarned > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-bold text-yellow-300">
                <Coins className="h-4 w-4" />
                +{coinsEarned}
              </span>
            )}
            {xpEarned != null && xpEarned > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-bold text-purple-300">
                <Zap className="h-4 w-4" />
                +{xpEarned} XP
              </span>
            )}
          </div>
        )}
        <div className="space-y-2">
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onContinue();
            }}
            className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-wider transition-colors touch-manipulation active:scale-[0.98]"
          >
            {nextLevel > currentLevel ? `Continue to Level ${nextLevel}` : `Replay Level ${currentLevel}`}
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onExit();
            }}
            className="w-full py-2 rounded-lg border border-purple-400/60 text-purple-100 hover:bg-purple-950/60 transition-colors touch-manipulation active:scale-[0.98]"
          >
            Exit to Explore
          </button>
        </div>
      </div>
    </div>
  );
}
