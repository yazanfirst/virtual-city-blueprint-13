import { Ghost, Trophy, Star, Zap, ArrowRight } from 'lucide-react';

interface GhostHuntCompleteModalProps {
  capturedCount: number;
  totalGhosts: number;
  nextDifficulty: number;
  timeBonus: number;
  onContinue: () => void;
}

export default function GhostHuntCompleteModal({
  capturedCount,
  totalGhosts,
  nextDifficulty,
  timeBonus,
  onContinue,
}: GhostHuntCompleteModalProps) {
  // Calculate stars based on performance
  const getStars = (): number => {
    const captureRatio = capturedCount / totalGhosts;
    if (captureRatio >= 1) return 3;
    if (captureRatio >= 0.75) return 2;
    return 1;
  };
  
  const stars = getStars();
  
  return (
    <div 
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      style={{ touchAction: 'manipulation' }}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="bg-background/95 border border-purple-500/50 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
        {/* Header with animation */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="h-12 w-12 text-yellow-400" />
        </div>
        
        <h2 className="text-center font-display text-2xl font-bold text-purple-400 uppercase tracking-wider mb-2">
          Hunt Complete!
        </h2>
        
        {/* Stars */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <Star
              key={i}
              className={`h-8 w-8 ${
                i <= stars 
                  ? 'text-yellow-400 fill-yellow-400' 
                  : 'text-muted-foreground'
              }`}
            />
          ))}
        </div>
        
        {/* Stats */}
        <div className="bg-purple-950/30 rounded-lg p-4 mb-4 border border-purple-500/30 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Ghost className="h-4 w-4" />
              Ghosts Captured:
            </span>
            <span className="text-foreground font-bold">{capturedCount} / {totalGhosts}</span>
          </div>
          
          {timeBonus > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Time Bonus:</span>
              <span className="text-green-400 font-bold">+{timeBonus} XP</span>
            </div>
          )}
        </div>
        
        {/* Next difficulty */}
        <div className="bg-purple-950/50 rounded-lg p-3 mb-6 border border-purple-500/20">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-purple-400" />
            <span className="text-muted-foreground">Next hunt difficulty:</span>
            <span className="text-purple-300 font-bold">Level {nextDifficulty}</span>
          </div>
        </div>
        
        {/* Continue button */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            onContinue();
          }}
          className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors touch-manipulation active:scale-[0.98] flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
