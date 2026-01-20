import { useState, useEffect } from 'react';
import { Target, Skull, AlertTriangle, CheckCircle, X, Play, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMissionStore } from '@/stores/missionStore';
import { ShopBranding } from '@/hooks/use3DShops';
import { ShopItem } from '@/hooks/useShopItems';
import { selectMissionTargetShop } from '@/lib/missionShopSelection';
import { generateDiamondMissionQuestions, generateDiamondClues } from '@/lib/diamondMission';
import { usePlayerStore } from '@/stores/playerStore';

interface MissionPanelProps {
  shops: ShopBranding[];
  shopItemsMap: Map<string, ShopItem[]>;
  onActivate: () => void;
  isCompact?: boolean;
}

export default function MissionPanel({
  shops,
  shopItemsMap,
  onActivate,
  isCompact = false,
}: MissionPanelProps) {
  const {
    phase,
    targetShop,
    deceptiveMessageShown,
    activateMission,
    activateDiamondMission,
    resetMission,
    recentlyUsedShopIds,
    missionNumber,
    questionsAnswered,
    questionsCorrect,
    questions,
    lastAnswerCorrect,
    revealedClues,
  } = useMissionStore();
  const playerPosition = usePlayerStore((state) => state.position);
  
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

  const handleActivateDiamond = () => {
    const selected = selectMissionTargetShop(shops, shopItemsMap, recentlyUsedShopIds);
    if (selected) {
      const questions = generateDiamondMissionQuestions();
      const clues = generateDiamondClues(selected.shop, playerPosition);
      activateDiamondMission(selected.shop, questions, clues);
      onActivate();
    }
  };
  
  const handleRetry = () => {
    resetMission();
  };
  
  // Render based on phase
  if (phase === 'inactive') {
    return (
      <div className="space-y-3">
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
          </div>
        
          <p className={`text-muted-foreground ${isCompact ? 'text-xs mb-3' : 'text-sm mb-4'}`}>
            Escape the zombies, find the target shop, and remember everything you see. Trust your memory — you may only get one chance.
          </p>
        
          <Button
            variant="cyber"
            className="w-full touch-manipulation select-none active:scale-[0.98]"
            onPointerDown={(e) => {
              e.stopPropagation();
              if (canActivate) handleActivate();
            }}
            disabled={!canActivate}
          >
            <Play className="h-4 w-4 mr-2" />
            {canActivate ? 'Activate Mission' : 'No Shops Available'}
          </Button>
        </div>

        <div className={`bg-card/90 backdrop-blur-md border border-border/50 rounded-xl ${isCompact ? 'p-3' : 'p-4 md:p-6'} shadow-xl`}>
          <div className={`flex items-center gap-3 ${isCompact ? 'mb-2' : 'mb-4'} pb-3 border-b border-border/30`}>
            <div className={`flex items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 ${isCompact ? 'h-8 w-8' : 'h-10 w-10'}`}>
              <Gem className={`text-amber-400 ${isCompact ? 'h-4 w-4' : 'h-5 w-5'}`} />
            </div>
            <div>
              <h3 className={`font-display font-bold uppercase tracking-wider text-foreground ${isCompact ? 'text-xs' : 'text-sm md:text-base'}`}>
                Mission 2
              </h3>
              <p className={`text-muted-foreground ${isCompact ? 'text-[10px]' : 'text-xs'}`}>Diamond Hunt</p>
            </div>
          </div>

          <p className={`text-muted-foreground ${isCompact ? 'text-xs mb-3' : 'text-sm mb-4'}`}>
            Answer trivia to unlock clues. Follow the directions to locate the hidden diamond shop.
          </p>

          <Button
            variant="cyber"
            className="w-full touch-manipulation select-none active:scale-[0.98]"
            onPointerDown={(e) => {
              e.stopPropagation();
              if (canActivate) handleActivateDiamond();
            }}
            disabled={!canActivate}
          >
            <Play className="h-4 w-4 mr-2" />
            {canActivate ? 'Start Diamond Hunt' : 'No Shops Available'}
          </Button>
        </div>
      </div>
    );
  }
  
  if (phase === 'escape' && missionNumber === 1) {
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
  
  if (phase === 'observation' && missionNumber === 1) {
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
    return (
      <div className={`bg-green-950/90 backdrop-blur-md border border-green-500/50 rounded-xl ${isCompact ? 'p-3' : 'p-4'} shadow-xl`}>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className={`font-display font-bold uppercase tracking-wider text-green-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            {missionNumber === 2 ? 'DIAMOND FOUND' : 'MISSION COMPLETE'}
          </span>
        </div>
        <p className={`text-green-200 ${isCompact ? 'text-xs mb-3' : 'text-sm mb-4'}`}>
          {missionNumber === 2
            ? `You found the diamond at ${targetShop?.shopName || 'the shop'}!`
            : 'Your memory served you well. The zombies have vanished.'}
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
          Play Again
        </button>
      </div>
    );
  }
  
  // Deceptive message after wrong answer
  if (deceptiveMessageShown && phase === 'question' && missionNumber === 1) {
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
  if (phase === 'question' && missionNumber === 1) {
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

  if (missionNumber === 2 && (phase === 'question' || phase === 'hunt')) {
    return (
      <div className={`bg-amber-950/90 backdrop-blur-md border border-amber-500/50 rounded-xl ${isCompact ? 'p-3' : 'p-4'} shadow-xl`}>
        <div className="flex items-center gap-2 mb-2">
          <Gem className="h-5 w-5 text-amber-300" />
          <span className={`font-display font-bold uppercase tracking-wider text-amber-300 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            DIAMOND HUNT
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-amber-200 mb-2 uppercase tracking-wider">
          <span>Trivia Progress</span>
          <span>{questionsAnswered}/{questions.length}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-amber-200 mb-2 uppercase tracking-wider">
          <span>Correct Answers</span>
          <span>{questionsCorrect}</span>
        </div>
        <p className={`text-amber-100 ${isCompact ? 'text-xs mb-2' : 'text-sm mb-3'}`}>
          Answer questions to unlock clues. Enter the shop where the diamond is hidden.
        </p>
        {phase === 'question' && lastAnswerCorrect === false && (
          <p className="text-[10px] text-amber-200/80 mb-2">Wrong answer. No clue awarded.</p>
        )}
        {questionsCorrect > 0 && (
          <div className="space-y-1 text-[10px] text-amber-100/90">
            <p className="uppercase tracking-wider text-amber-300/80">Clues</p>
            <ul className="list-disc list-inside space-y-1">
              {revealedClues.map((clue, index) => (
                <li key={`${clue}-${index}`}>{clue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  
  return null;
}
