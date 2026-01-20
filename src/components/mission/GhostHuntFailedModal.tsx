import { Ghost, Clock, X, RotateCcw, Home } from 'lucide-react';

interface GhostHuntFailedModalProps {
  reason: 'time' | 'death';
  capturedCount: number;
  requiredCaptures: number;
  onRetry: () => void;
  onExit: () => void;
}

export default function GhostHuntFailedModal({
  reason,
  capturedCount,
  requiredCaptures,
  onRetry,
  onExit,
}: GhostHuntFailedModalProps) {
  return (
    <div 
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      style={{ touchAction: 'manipulation' }}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="bg-background/95 border border-red-500/50 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-4">
          {reason === 'time' ? (
            <Clock className="h-12 w-12 text-red-400" />
          ) : (
            <Ghost className="h-12 w-12 text-red-400" />
          )}
        </div>
        
        <h2 className="text-center font-display text-2xl font-bold text-red-400 uppercase tracking-wider mb-2">
          Hunt Failed
        </h2>
        
        <p className="text-center text-muted-foreground mb-4">
          {reason === 'time' 
            ? "Time ran out! The ghosts have vanished into the darkness."
            : "The ghosts overwhelmed you. You need more practice."}
        </p>
        
        {/* Stats */}
        <div className="bg-red-950/30 rounded-lg p-4 mb-6 border border-red-500/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ghosts Captured:</span>
            <span className="text-foreground font-bold">{capturedCount} / {requiredCaptures}</span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onExit();
            }}
            className="flex-1 py-3 rounded-lg border border-muted-foreground/30 text-muted-foreground hover:bg-accent transition-colors touch-manipulation active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Exit
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="flex-1 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-colors touch-manipulation active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
