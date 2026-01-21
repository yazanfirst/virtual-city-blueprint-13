import { Sparkles, Play, Clock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMirrorWorldStore } from '@/stores/mirrorWorldStore';

interface MirrorWorldPanelProps {
  onActivate: () => void;
  isCompact?: boolean;
}

export default function MirrorWorldPanel({ onActivate, isCompact = false }: MirrorWorldPanelProps) {
  const { phase, startMission, resetMission } = useMirrorWorldStore();

  const handleActivate = () => {
    startMission();
    onActivate();
  };

  if (phase === 'failed') {
    return (
      <div className={`bg-slate-950/90 backdrop-blur-md border border-purple-500/40 rounded-xl ${isCompact ? 'p-3' : 'p-4'} shadow-xl`}>
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="h-5 w-5 text-purple-300" />
          <span className={`font-display font-bold uppercase tracking-wider text-purple-200 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            Mirror World Failed
          </span>
        </div>
        <p className={`text-purple-200 ${isCompact ? 'text-xs mb-3' : 'text-sm mb-4'}`}>
          The shadow consumed the path back. Try again to restore reality.
        </p>
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            resetMission();
          }}
          className="w-full h-10 rounded-md flex items-center justify-center border border-purple-500/50 text-purple-200 hover:bg-purple-900/50 touch-manipulation select-none active:scale-[0.98] transition-all text-sm font-medium"
          data-control-ignore="true"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-card/90 backdrop-blur-md border border-purple-500/30 rounded-xl ${isCompact ? 'p-3' : 'p-4 md:p-6'} shadow-xl`}>
      <div className={`flex items-center gap-3 ${isCompact ? 'mb-2' : 'mb-4'} pb-3 border-b border-purple-500/20`}>
        <div className={`flex items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/30 ${isCompact ? 'h-8 w-8' : 'h-10 w-10'}`}>
          <Sparkles className={`text-purple-300 ${isCompact ? 'h-4 w-4' : 'h-5 w-5'}`} />
        </div>
        <div>
          <h3 className={`font-display font-bold uppercase tracking-wider text-foreground ${isCompact ? 'text-xs' : 'text-sm md:text-base'}`}>
            Mission 3
          </h3>
          <p className={`text-purple-300 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>Mirror World</p>
        </div>
        <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded bg-purple-500/20 border border-purple-500/30">
          <Clock className="h-3 w-3 text-purple-300" />
          <span className="text-[10px] text-purple-200 font-bold">75S</span>
        </div>
      </div>

      <p className={`text-muted-foreground ${isCompact ? 'text-xs mb-3' : 'text-sm mb-4'}`}>
        Enter the inverted city, clear 5 anchor challenges, and outrun your Shadow.
      </p>

      <div className={`bg-purple-950/30 rounded-lg p-2 mb-3 border border-purple-500/20 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Shadow speeds up every 10s</span>
          <span className="text-purple-300 font-bold">HARD</span>
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
        Enter Mirror World
      </Button>
    </div>
  );
}
