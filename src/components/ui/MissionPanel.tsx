import { useState } from 'react';
import { Target, Eye, EyeOff, MapPin, AlertTriangle, Trophy, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MissionClue } from '@/stores/missionStore';
import { MISSION_CONFIG } from '@/config/mystery-box.config';

type MissionPanelProps = {
  isActive: boolean;
  clues: MissionClue[];
  visitsRemaining: number;
  visitsUsed: number;
  boxCollected: boolean;
  missionFailed: boolean;
  unrevealedCount: number;
  onStartMission: () => void;
  onRevealClue: () => void;
  onClose: () => void;
  onReset: () => void;
  eligibleShopCount: number;
};

export default function MissionPanel({
  isActive,
  clues,
  visitsRemaining,
  visitsUsed,
  boxCollected,
  missionFailed,
  unrevealedCount,
  onStartMission,
  onRevealClue,
  onClose,
  onReset,
  eligibleShopCount,
}: MissionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const revealedClues = clues.filter(c => c.revealed);
  const canReveal = unrevealedCount > 0 && visitsUsed > 0;

  const getClueIcon = (type: string) => {
    switch (type) {
      case 'symbolic':
        return <Sparkles className="h-3 w-3" />;
      case 'spatial':
        return <MapPin className="h-3 w-3" />;
      case 'exclusionary':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Eye className="h-3 w-3" />;
    }
  };

  // Mission not started
  if (!isActive && !boxCollected && !missionFailed) {
    return (
      <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-xl p-4 md:p-6 shadow-xl w-[90vw] max-w-md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
              Mystery Box
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A Mystery Box is hidden in one of the shops. Use the clues to find it!
          </p>

          <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Shop Visits:</span>
              <span className="text-foreground font-medium">{MISSION_CONFIG.maxShopVisits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Eligible Shops:</span>
              <span className="text-foreground font-medium">{eligibleShopCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reward:</span>
              <span className="text-primary font-medium">
                {MISSION_CONFIG.boxCollectionReward.coins} coins + {MISSION_CONFIG.boxCollectionReward.xp} XP
              </span>
            </div>
          </div>

          {eligibleShopCount < 3 ? (
            <p className="text-xs text-destructive">
              Not enough eligible shops on this street. Visit a busier area!
            </p>
          ) : (
            <Button
              onClick={onStartMission}
              className="w-full"
              variant="default"
            >
              <Target className="h-4 w-4 mr-2" />
              Start Mystery Box Hunt
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Mission completed successfully
  if (boxCollected) {
    return (
      <div className="bg-background/95 backdrop-blur-md border border-primary/50 rounded-xl p-4 md:p-6 shadow-xl w-[90vw] max-w-md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-primary/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 border border-primary/40">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-display text-lg font-bold uppercase tracking-wider text-primary">
              Box Found!
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center py-4 space-y-3">
          <div className="text-4xl">🎉</div>
          <p className="text-foreground font-medium">
            Congratulations! You found the Mystery Box!
          </p>
          <p className="text-sm text-muted-foreground">
            Shops visited: {visitsUsed}/{MISSION_CONFIG.maxShopVisits}
          </p>
        </div>

        <Button
          onClick={onReset}
          variant="outline"
          className="w-full mt-4"
        >
          Hunt Again
        </Button>
      </div>
    );
  }

  // Mission failed
  if (missionFailed) {
    return (
      <div className="bg-background/95 backdrop-blur-md border border-destructive/50 rounded-xl p-4 md:p-6 shadow-xl w-[90vw] max-w-md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-destructive/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/20 border border-destructive/40">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <h3 className="font-display text-lg font-bold uppercase tracking-wider text-destructive">
              Mission Failed
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center py-4 space-y-3">
          <p className="text-foreground">
            You've exceeded the maximum number of shop visits.
          </p>
          <p className="text-sm text-muted-foreground">
            Study the clues more carefully next time!
          </p>
        </div>

        <Button
          onClick={onReset}
          variant="outline"
          className="w-full mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Active mission - collapsible panel
  return (
    <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-xl overflow-hidden w-[90vw] max-w-md">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 md:p-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
              Mystery Box Hunt
            </h3>
            <p className="text-xs text-muted-foreground">
              Visits: {visitsUsed}/{MISSION_CONFIG.maxShopVisits}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            visitsRemaining > 1 ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
          }`}>
            {visitsRemaining} left
          </div>
          {isExpanded ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="p-3 md:p-4 pt-0 border-t border-border/30 space-y-3">
          {/* Clues */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Clues
            </h4>
            {revealedClues.map((clue) => (
              <div
                key={clue.id}
                className="flex items-start gap-2 p-2 bg-muted/20 rounded-lg"
              >
                <div className="flex-shrink-0 mt-0.5 text-primary">
                  {getClueIcon(clue.type)}
                </div>
                <p className="text-xs text-foreground italic leading-relaxed">
                  "{clue.text}"
                </p>
              </div>
            ))}
            
            {unrevealedCount > 0 && (
              <div className="text-xs text-muted-foreground">
                {unrevealedCount} more clue{unrevealedCount > 1 ? 's' : ''} hidden
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {canReveal && (
              <Button
                onClick={onRevealClue}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <Eye className="h-3 w-3 mr-1" />
                Reveal Clue
              </Button>
            )}
            <Button
              onClick={onReset}
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
            >
              Give Up
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
