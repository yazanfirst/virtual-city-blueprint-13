import { useState, useEffect } from 'react';
import { Target, Skull, AlertTriangle, CheckCircle, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMissionStore } from '@/stores/missionStore';
import { ShopBranding } from '@/hooks/use3DShops';
import { ShopItem } from '@/hooks/useShopItems';
import { selectMissionTargetShop } from '@/lib/missionShopSelection';

interface MissionPanelProps {
  shops: ShopBranding[];
  shopItemsMap: Map<string, ShopItem[]>;
  onActivate: () => void;
  isCompact?: boolean;
  disableActivation?: boolean;
}

export default function MissionPanel({
  shops,
  shopItemsMap,
  onActivate,
  isCompact = false,
  disableActivation = false,
}: MissionPanelProps) {
  const {
    isActive,
    phase,
    targetShop,
    deceptiveMessageShown,
    activateMission,
    resetMission,
    recentlyUsedShopIds,
    level,
    unlockedLevel,
    maxLevel,
    setLevel,
  } = useMissionStore();
  
  const [canActivate, setCanActivate] = useState(false);
  // Check if mission can be activated
  useEffect(() => {
    const eligible = selectMissionTargetShop(shops, shopItemsMap, recentlyUsedShopIds);
    setCanActivate(eligible !== null);
  }, [shops, shopItemsMap, recentlyUsedShopIds]);
  
  const handleActivate = () => {
    const selected = selectMissionTargetShop(shops, shopItemsMap, recentlyUsedShopIds);
    if (selected) {
      activateMission(selected.shop, selected.items);
      onActivate();
    }
  };
  
  const handleRetry = () => {
    resetMission();
  };
  
  // Render based on phase
  if (phase === 'inactive') {
    const activationDisabled = disableActivation || !canActivate;
    const activationLabel = disableActivation
      ? 'Finish Current Mission'
      : canActivate
        ? 'Activate Mission'
        : 'No Shops Available';
    return (
      <div className={`bg-card/90 backdrop-blur-md border border-border/50 rounded-xl ${isCompact ? 'p-3' : 'p-4 md:p-6'} shadow-xl`}>
        <div className={`flex items-center gap-3 ${isCompact ? 'mb-2' : 'mb-4'} pb-3 border-b border-border/30`}>
          <div className={`flex items-center justify-center rounded-lg bg-primary/10 border border-primary/30 ${isCompact ? 'h-8 w-8' : 'h-10 w-10'}`}>
            <Target className={`text-primary ${isCompact ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </div>
          <div>
            <h3 className={`font-display font-bold uppercase tracking-wider text-foreground ${isCompact ? 'text-xs' : 'text-sm md:text-base'}`}>
              Mission 1
            </h3>
            <p className={`text-muted-foreground ${isCompact ? 'text-[10px]' : 'text-xs'}`}>Night Escape</p>
          </div>
          <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded bg-primary/20 border border-primary/30">
            <Target className="h-3 w-3 text-primary" />
            <span className="text-[10px] text-primary font-bold">LVL {level}/{maxLevel}</span>
          </div>
        </div>
        
        <p className={`text-muted-foreground ${isCompact ? 'text-xs mb-3' : 'text-sm mb-4'}`}>
          Escape the zombies, find the target shop, and remember everything you see. Trust your memory — you may only get one chance.
          Finish before the countdown reaches zero.
        </p>
        <div className={`bg-emerald-950/20 rounded-lg p-2 mb-3 border border-emerald-500/20 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Unlocked Level {unlockedLevel}/{maxLevel}</span>
            <span className="text-emerald-300 font-bold">ESCAPE</span>
          </div>
        </div>
        {unlockedLevel > level && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              setLevel(unlockedLevel);
            }}
            className="w-full mb-2 h-9 rounded-md flex items-center justify-center border border-emerald-500/40 text-emerald-100 hover:bg-emerald-900/40 touch-manipulation select-none active:scale-[0.98] transition-all text-xs font-semibold"
            data-control-ignore="true"
          >
            Switch to Level {unlockedLevel}
          </button>
        )}
        {disableActivation && (
          <p className={`text-xs text-yellow-300/90 mb-3 ${isCompact ? '' : 'md:text-sm'}`}>
            Finish your current mission to start another.
          </p>
        )}
        
        <Button
          variant="cyber"
          className="w-full touch-manipulation select-none active:scale-[0.98]"
          onPointerDown={(e) => {
            e.stopPropagation();
            if (!activationDisabled) handleActivate();
          }}
          disabled={activationDisabled}
        >
          <Play className="h-4 w-4 mr-2" />
          {activationLabel}
        </Button>
      </div>
    );
  }
  
  if (phase === 'escape') {
    return (
      <div className={`bg-red-950/90 backdrop-blur-md border border-red-500/50 rounded-xl ${isCompact ? 'p-3' : 'p-4'} shadow-xl`}>
        <div className="flex items-center gap-2 mb-2">
          <Skull className="h-5 w-5 text-red-400 animate-pulse" />
          <span className={`font-display font-bold uppercase tracking-wider text-red-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            ESCAPE!
          </span>
        </div>
        <div className={`bg-red-900/50 rounded-lg px-3 py-2 mb-2 border border-red-500/30`}>
          <p className="text-[10px] text-red-300 uppercase tracking-wider mb-1">Target Shop:</p>
          <p className="text-white font-bold text-sm">{targetShop?.shopName || 'Unknown'}</p>
        </div>
        <p className={`text-red-200 ${isCompact ? 'text-xs' : 'text-sm'}`}>
          Zombies are coming! Avoid laser traps and reach the target shop!
        </p>
      </div>
    );
  }
  
  if (phase === 'observation') {
    return (
      <div className={`bg-blue-950/90 backdrop-blur-md border border-blue-500/50 rounded-xl ${isCompact ? 'p-3' : 'p-4'} shadow-xl`}>
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-5 w-5 text-blue-400" />
          <span className={`font-display font-bold uppercase tracking-wider text-blue-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            OBSERVE
          </span>
        </div>
        <div className={`bg-blue-900/50 rounded-lg px-3 py-2 mb-2 border border-blue-500/30`}>
          <p className="text-[10px] text-blue-300 uppercase tracking-wider mb-1">Current Shop:</p>
          <p className="text-white font-bold text-sm">{targetShop?.shopName || 'Unknown'}</p>
        </div>
        <p className={`text-blue-200 ${isCompact ? 'text-xs' : 'text-sm'}`}>
          You're safe! Study everything — item names, prices, positions. You'll be tested when you leave.
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
            MISSION FAILED
          </span>
        </div>
        <p className={`text-red-200 ${isCompact ? 'text-xs mb-3' : 'text-sm mb-4'}`}>
          The zombies got you. Better luck next time.
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
    const allComplete = level >= maxLevel;
    return (
      <div className={`bg-green-950/90 backdrop-blur-md border border-green-500/50 rounded-xl ${isCompact ? 'p-3' : 'p-4'} shadow-xl`}>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className={`font-display font-bold uppercase tracking-wider text-green-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            {allComplete ? 'ALL MISSIONS COMPLETE' : 'MISSION COMPLETE'}
          </span>
        </div>
        <p className={`text-green-200 ${isCompact ? 'text-xs mb-3' : 'text-sm mb-4'}`}>
          {allComplete
            ? 'You finished every Zombie Escape level.'
            : 'Your memory served you well. The zombies have vanished.'}
        </p>
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            handleRetry();
            setLevel(1);
          }}
          className="w-full h-10 rounded-md flex items-center justify-center border border-green-500/50 text-green-300 hover:bg-green-900/50 touch-manipulation select-none active:scale-[0.98] transition-all text-sm font-medium"
          data-control-ignore="true"
        >
          {allComplete ? 'Restart from Level 1' : 'Play Again'}
        </button>
      </div>
    );
  }
  
  // Deceptive message after wrong answer
  if (deceptiveMessageShown && phase === 'question') {
    return (
      <div className={`bg-yellow-950/90 backdrop-blur-md border border-yellow-500/50 rounded-xl ${isCompact ? 'p-3' : 'p-4'} shadow-xl`}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-yellow-400 animate-pulse" />
          <span className={`font-display font-bold uppercase tracking-wider text-yellow-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            WRONG ANSWER
          </span>
        </div>
        <p className={`text-yellow-200 ${isCompact ? 'text-xs' : 'text-sm'}`}>
          You may return to the shop one last time.
        </p>
        <p className={`text-yellow-300/60 text-[10px] mt-2 italic`}>
          Protection is ending...
        </p>
      </div>
    );
  }
  
  // Default question phase display
  if (phase === 'question') {
    return (
      <div className={`bg-purple-950/90 backdrop-blur-md border border-purple-500/50 rounded-xl ${isCompact ? 'p-3' : 'p-4'} shadow-xl`}>
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-5 w-5 text-purple-400" />
          <span className={`font-display font-bold uppercase tracking-wider text-purple-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            MEMORY TEST
          </span>
        </div>
        <p className={`text-purple-200 ${isCompact ? 'text-xs' : 'text-sm'}`}>
          Answer the question correctly to survive.
        </p>
      </div>
    );
  }
  
  return null;
}
