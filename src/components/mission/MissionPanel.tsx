import React from 'react';
import { Sun, Moon, Target, Eye, EyeOff, Gift, X, AlertCircle, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMissionStore } from '@/stores/missionStore';

interface MissionPanelProps {
  onClose?: () => void;
}

export default function MissionPanel({ onClose }: MissionPanelProps) {
  const {
    missionActive,
    missionComplete,
    missionSuccess,
    missionFailed,
    clues,
    revealedClues,
    shopsEnteredThisMission,
    maxShopVisits,
    environmentMode,
    targetShopBranding,
    revealClue,
    setEnvironmentMode,
    resetMission,
  } = useMissionStore();

  const visitsLeft = maxShopVisits - shopsEnteredThisMission.length;

  // Mission complete state (success or failure)
  if (missionComplete) {
    return (
      <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-xl p-4 md:p-6 shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg border',
                missionSuccess
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              )}
            >
              {missionSuccess ? (
                <Gift className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
              {missionSuccess ? 'Success!' : 'Mission Failed'}
            </h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="text-center py-4">
          {missionSuccess ? (
            <>
              <p className="text-foreground mb-2">
                You found the Mystery Box at{' '}
                <span className="text-primary font-bold">
                  {targetShopBranding?.shopName}
                </span>
                !
              </p>
              <p className="text-sm text-muted-foreground">
                +50 Coins • +100 XP
              </p>
            </>
          ) : (
            <>
              <p className="text-foreground mb-2">
                The Mystery Box was at{' '}
                <span className="text-primary font-bold">
                  {targetShopBranding?.shopName}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                You visited {shopsEnteredThisMission.length} wrong shops.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Better luck next time!
              </p>
            </>
          )}
        </div>

        <Button onClick={resetMission} className="w-full mt-2">
          New Mission
        </Button>
      </div>
    );
  }

  // No active mission (loading)
  if (!missionActive) {
    return (
      <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-xl p-4 md:p-6 shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
              Mystery Box
            </h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="text-center py-6 text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Loading mission...</p>
          <p className="text-xs mt-2">Finding eligible shops</p>
        </div>
      </div>
    );
  }

  // Active mission
  return (
    <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-xl p-4 md:p-6 shadow-xl w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold uppercase tracking-wider text-foreground">
              Mystery Box Hunt
            </h3>
            <p className="text-xs text-muted-foreground">
              Find the hidden shop!
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Shop Visit Counter */}
      <div className="mb-4 p-3 rounded-lg bg-card border border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Shop Visits</span>
          </div>
          <span className="text-sm font-bold text-foreground">
            {shopsEnteredThisMission.length} / {maxShopVisits}
          </span>
        </div>
        {/* Visual dots */}
        <div className="flex gap-2 justify-center">
          {Array.from({ length: maxShopVisits }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-4 h-4 rounded-full transition-all',
                i < shopsEnteredThisMission.length
                  ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
              )}
            />
          ))}
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          {visitsLeft === 0
            ? 'No visits left!'
            : `${visitsLeft} ${visitsLeft === 1 ? 'visit' : 'visits'} remaining`}
        </p>
      </div>

      {/* Clues */}
      <div className="space-y-2 mb-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Evidence Clues
        </h4>
        {clues.map((clue, i) => (
          <div
            key={clue.id}
            className={cn(
              'p-3 rounded-lg border transition-all',
              revealedClues.includes(i)
                ? 'bg-card border-border'
                : 'bg-muted/30 border-border/50 cursor-pointer hover:bg-muted/50'
            )}
            onClick={() => !revealedClues.includes(i) && revealClue(i)}
          >
            {revealedClues.includes(i) ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="h-3 w-3 text-primary" />
                  <span className="text-xs text-primary uppercase font-medium">
                    Clue {i + 1}: {clue.type}
                  </span>
                </div>
                <p className="text-sm text-foreground">{clue.text}</p>
              </>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <EyeOff className="h-3 w-3" />
                <span className="text-sm">Tap to reveal Clue {i + 1}...</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Night mode toggle - puzzle mechanic */}
      <div className="pt-3 border-t border-border/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-foreground">Environment Mode</span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={environmentMode === 'day' ? 'default' : 'ghost'}
              onClick={() => setEnvironmentMode('day')}
              className="h-8 w-8 p-0"
            >
              <Sun className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={environmentMode === 'night' ? 'default' : 'ghost'}
              onClick={() => setEnvironmentMode('night')}
              className="h-8 w-8 p-0"
            >
              <Moon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Some indicators only appear at night!
        </p>
      </div>
    </div>
  );
}
