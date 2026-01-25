import { ArrowRight, Trophy } from 'lucide-react';

interface ZombieMissionCompleteModalProps {
  isOpen: boolean;
  currentLevel: number;
  unlockedLevel: number;
  maxLevel: number;
  onContinue: () => void;
  onExit: () => void;
}

export default function ZombieMissionCompleteModal({
  isOpen,
  currentLevel,
  unlockedLevel,
  maxLevel,
  onContinue,
  onExit,
}: ZombieMissionCompleteModalProps) {
  if (!isOpen) return null;

  const nextLevel = Math.min(maxLevel, unlockedLevel);
  const hasNext = unlockedLevel > currentLevel && currentLevel < maxLevel;
  const canContinue = currentLevel >= maxLevel || hasNext;

  return (
    <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-emerald-950/95 border border-emerald-400/40 rounded-xl p-6 max-w-sm mx-4 shadow-2xl text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Trophy className="h-6 w-6 text-emerald-300" />
          <h2 className="font-display text-lg font-bold text-emerald-200 uppercase tracking-wider">
            Level {currentLevel} Complete
          </h2>
        </div>
        <p className="text-sm text-emerald-100/80 mb-4">
          You escaped the zombies. Keep pushing or return to explore.
        </p>
        <div className="space-y-2">
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onContinue();
            }}
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider transition-colors touch-manipulation active:scale-[0.98] flex items-center justify-center gap-2"
            disabled={!canContinue}
          >
            {hasNext ? `Continue to Level ${nextLevel}` : `Replay Level ${currentLevel}`}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onExit();
            }}
            className="w-full py-2 rounded-lg border border-emerald-400/60 text-emerald-100 hover:bg-emerald-950/60 transition-colors touch-manipulation active:scale-[0.98]"
          >
            Exit to Explore
          </button>
        </div>
      </div>
    </div>
  );
}
