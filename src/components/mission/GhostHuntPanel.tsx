import { Ghost, Play, X, CheckCircle, Clock, Skull, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGhostHuntStore } from '@/stores/ghostHuntStore';

interface GhostHuntPanelProps {
  onActivate: () => void;
  isCompact?: boolean;
}

export default function GhostHuntPanel({
  onActivate,
  isCompact = false,
}: GhostHuntPanelProps) {
  const {
    isActive,
    phase,
    difficultyLevel,
    capturedCount,
    requiredCaptures,
    startMission,
    resetMission,
  } = useGhostHuntStore();
  
  const handleActivate = () => {
    startMission();
    onActivate();
  };
  
  const handleRetry = () => {
    resetMission();
  };
  
  // Render based on phase
  if (phase === 'inactive') {
    return (
      <div className={`bg-card/90 backdrop-blur-md border border-purple-500/30 rounded-xl ${isCompact ? 'p-3' : 'p-4 md:p-6'} shadow-xl`}>
        <div className={`flex items-center gap-3 ${isCompact ? 'mb-2' : 'mb-4'} pb-3 border-b border-purple-500/20`}>
          <div className={`flex items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/30 ${isCompact ? 'h-8 w-8' : 'h-10 w-10'}`}>
            <Ghost className={`text-purple-400 ${isCompact ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </div>
          <div>
            <h3 className={`font-display font-bold uppercase tracking-wider text-foreground ${isCompact ? 'text-xs' : 'text-sm md:text-base'}`}>
              Mission 2
            </h3>
            <p className={`text-purple-400 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>Ghost Hunt</p>
          </div>
          <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded bg-purple-500/20 border border-purple-500/30">
            <Zap className="h-3 w-3 text-purple-400" />
            <span className="text-[10px] text-purple-300 font-bold">LVL {difficultyLevel}</span>
          </div>
        </div>
        
        <p className={`text-muted-foreground ${isCompact ? 'text-xs mb-3' : 'text-sm mb-4'}`}>
          Paranormal activity detected. Use your EMF detector to locate invisible ghosts, reveal them with your flashlight, and capture them before time runs out.
        </p>
        
        <div className={`bg-purple-950/30 rounded-lg p-2 mb-3 border border-purple-500/20 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Difficulty increases each success</span>
            <span className="text-purple-400 font-bold">HARD</span>
          </div>
        </div>
        
        <Button
          variant="cyber"
          className="w-full touch-manipulation select-none active:scale-[0.98] bg-purple-600 hover:bg-purple-500 border-purple-400"
          onPointerDown={(e) => {
            e.stopPropagation();
            handleActivate();
          }}
        >
          <Play className="h-4 w-4 mr-2" />
          Start Ghost Hunt
        </Button>
      </div>
    );
  }
  
  if (phase === 'briefing' || phase === 'hunting') {
    return (
      <div className={`bg-purple-950/90 backdrop-blur-md border border-purple-500/50 rounded-xl ${isCompact ? 'p-3' : 'p-4'} shadow-xl`}>
        <div className="flex items-center gap-2 mb-2">
          <Ghost className="h-5 w-5 text-purple-400 animate-pulse" />
          <span className={`font-display font-bold uppercase tracking-wider text-purple-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            HUNTING
          </span>
        </div>
        <div className={`bg-purple-900/50 rounded-lg px-3 py-2 mb-2 border border-purple-500/30`}>
          <p className="text-[10px] text-purple-300 uppercase tracking-wider mb-1">Progress:</p>
          <p className="text-white font-bold text-sm">{capturedCount} / {requiredCaptures} Ghosts</p>
        </div>
        <p className={`text-purple-200 ${isCompact ? 'text-xs' : 'text-sm'}`}>
          Use EMF to detect, flashlight to reveal, walk through to capture!
        </p>
      </div>
    );
  }
  
  if (phase === 'failed') {
    return (
      <div className={`bg-red-950/90 backdrop-blur-md border border-red-500/50 rounded-xl ${isCompact ? 'p-3' : 'p-4'} shadow-xl`}>
        <div className="flex items-center gap-2 mb-2">
          <X className="h-5 w-5 text-red-400" />
          <span className={`font-display font-bold uppercase tracking-wider text-red-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            HUNT FAILED
          </span>
        </div>
        <p className={`text-red-200 ${isCompact ? 'text-xs mb-3' : 'text-sm mb-4'}`}>
          The ghosts escaped. Train harder and try again.
        </p>
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            handleRetry();
          }}
          className="w-full h-10 rounded-md flex items-center justify-center border border-red-500/50 text-red-300 hover:bg-red-900/50 touch-manipulation select-none active:scale-[0.98] transition-all text-sm font-medium"
          data-control-ignore="true"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (phase === 'completed') {
    return (
      <div className={`bg-green-950/90 backdrop-blur-md border border-green-500/50 rounded-xl ${isCompact ? 'p-3' : 'p-4'} shadow-xl`}>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className={`font-display font-bold uppercase tracking-wider text-green-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            HUNT COMPLETE
          </span>
        </div>
        <p className={`text-green-200 ${isCompact ? 'text-xs mb-3' : 'text-sm mb-4'}`}>
          All ghosts captured! Your hunting skills have improved. Next hunt will be harder.
        </p>
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            handleRetry();
          }}
          className="w-full h-10 rounded-md flex items-center justify-center border border-green-500/50 text-green-300 hover:bg-green-900/50 touch-manipulation select-none active:scale-[0.98] transition-all text-sm font-medium"
          data-control-ignore="true"
        >
          Hunt Again (Level {difficultyLevel})
        </button>
      </div>
    );
  }
  
  return null;
}
