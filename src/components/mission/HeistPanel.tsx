import { AlertTriangle, CheckCircle, Lock, ShieldAlert, Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHeistStore } from '@/stores/heistStore';

interface HeistPanelProps {
  onActivate: () => void;
  isCompact?: boolean;
}

export default function HeistPanel({ onActivate, isCompact = false }: HeistPanelProps) {
  const {
    phase,
    difficultyLevel,
    targetShopName,
    targetItemName,
    startMission,
    completeBriefing,
    resetMission,
    failReason,
    timeRemaining,
    detectionLevel,
  } = useHeistStore();

  const handleStart = () => {
    startMission('heist-target', 'Luxury Vault', 'Diamond Necklace');
    onActivate();
  };

  if (phase === 'inactive') {
    return (
      <div className={`bg-amber-950/90 backdrop-blur-md border border-amber-500/50 rounded-xl ${isCompact ? 'p-3' : 'p-4'} shadow-xl`}>
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-5 w-5 text-amber-400" />
          <span className={`font-display font-bold uppercase tracking-wider text-amber-300 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            The Heist
          </span>
        </div>
        <p className={`text-amber-200 ${isCompact ? 'text-xs mb-3' : 'text-sm mb-4'}`}>
          Hack terminals, avoid security drones, and steal the target item before time runs out.
        </p>
        <p className="text-[10px] uppercase tracking-wider text-amber-300/80 mb-3">
          Difficulty: Level {difficultyLevel}
        </p>
        <Button
          variant="cyber"
          className="w-full touch-manipulation select-none active:scale-[0.98]"
          onPointerDown={(e) => {
            e.stopPropagation();
            handleStart();
          }}
        >
          Start Heist
        </Button>
      </div>
    );
  }

  if (phase === 'briefing') {
    return (
      <div className={`bg-amber-950/90 backdrop-blur-md border border-amber-500/50 rounded-xl ${isCompact ? 'p-3' : 'p-4'} shadow-xl`}>
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="h-5 w-5 text-amber-400" />
          <span className={`font-display font-bold uppercase tracking-wider text-amber-300 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            Briefing
          </span>
        </div>
        <p className={`text-amber-200 ${isCompact ? 'text-xs mb-3' : 'text-sm mb-4'}`}>
          Target: <strong>{targetItemName}</strong> at <strong>{targetShopName || 'Unknown Shop'}</strong>. Disable lasers and stay unseen.
        </p>
        <Button
          variant="cyber"
          className="w-full touch-manipulation select-none active:scale-[0.98]"
          onPointerDown={(e) => {
            e.stopPropagation();
            completeBriefing();
          }}
        >
          Begin Infiltration
        </Button>
      </div>
    );
  }

  if (phase === 'infiltrating') {
    return (
      <div className={`bg-amber-950/90 backdrop-blur-md border border-amber-500/50 rounded-xl ${isCompact ? 'p-3' : 'p-4'} shadow-xl`}>
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-5 w-5 text-amber-400" />
          <span className={`font-display font-bold uppercase tracking-wider text-amber-300 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            Infiltrating
          </span>
        </div>
        <p className={`text-amber-200 ${isCompact ? 'text-xs' : 'text-sm'}`}>
          Detection: {Math.round(detectionLevel)}% • Time: {timeRemaining}s
        </p>
      </div>
    );
  }

  if (phase === 'escaping') {
    return (
      <div className={`bg-red-950/90 backdrop-blur-md border border-red-500/50 rounded-xl ${isCompact ? 'p-3' : 'p-4'} shadow-xl`}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-red-400 animate-pulse" />
          <span className={`font-display font-bold uppercase tracking-wider text-red-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            Escape!
          </span>
        </div>
        <p className={`text-red-200 ${isCompact ? 'text-xs' : 'text-sm'}`}>
          You have the item. Reach the exit before security catches you.
        </p>
      </div>
    );
  }

  if (phase === 'completed') {
    return (
      <div className={`bg-green-950/90 backdrop-blur-md border border-green-500/50 rounded-xl ${isCompact ? 'p-3' : 'p-4'} shadow-xl`}>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className={`font-display font-bold uppercase tracking-wider text-green-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            Heist Complete
          </span>
        </div>
        <Button
          variant="cyber"
          className="w-full touch-manipulation select-none active:scale-[0.98]"
          onPointerDown={(e) => {
            e.stopPropagation();
            resetMission();
          }}
        >
          Play Again
        </Button>
      </div>
    );
  }

  if (phase === 'failed') {
    return (
      <div className={`bg-red-950/90 backdrop-blur-md border border-red-500/50 rounded-xl ${isCompact ? 'p-3' : 'p-4'} shadow-xl`}>
        <div className="flex items-center gap-2 mb-2">
          <Skull className="h-5 w-5 text-red-400" />
          <span className={`font-display font-bold uppercase tracking-wider text-red-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            Heist Failed
          </span>
        </div>
        <p className={`text-red-200 ${isCompact ? 'text-xs mb-3' : 'text-sm mb-4'}`}>
          Security breach: {failReason ?? 'unknown'}
        </p>
        <Button
          variant="cyber"
          className="w-full touch-manipulation select-none active:scale-[0.98]"
          onPointerDown={(e) => {
            e.stopPropagation();
            resetMission();
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return null;
}
