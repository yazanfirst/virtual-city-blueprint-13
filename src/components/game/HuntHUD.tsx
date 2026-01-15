import { useState, useEffect } from 'react';
import { Heart, Clock, Package, Zap, Gift } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';

export default function HuntHUD() {
  const {
    isHuntActive,
    huntEndTime,
    huntCooldownEndTime,
    boxSpawns,
    totalBoxesThisHunt,
    lives,
    maxLives,
    huntStreak,
    vouchers,
    startHunt,
  } = useGameStore();

  const [timeLeft, setTimeLeft] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  // Update timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      if (huntEndTime) {
        const remaining = Math.max(0, huntEndTime - now);
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          useGameStore.getState().endHunt();
        }
      }
      
      if (huntCooldownEndTime) {
        const cooldown = Math.max(0, huntCooldownEndTime - now);
        setCooldownLeft(cooldown);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [huntEndTime, huntCooldownEndTime]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const boxesCollected = boxSpawns.filter(b => b.collected && b.rarity !== 'decoy').length;
  const isFeverMode = timeLeft > 0 && timeLeft <= 30000;
  const isPanicMode = timeLeft > 0 && timeLeft <= 60000;
  const unusedVouchers = vouchers.filter(v => !v.isUsed && v.expiresAt > Date.now()).length;

  return (
    <div className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ zIndex: 160 }}>
      {/* Main HUD Bar */}
      <div className={`pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-md border transition-all duration-300 ${
        isFeverMode 
          ? 'bg-primary/30 border-primary animate-pulse' 
          : isPanicMode 
            ? 'bg-destructive/20 border-destructive/50' 
            : 'bg-background/80 border-border/50'
      }`}>
        {/* Lives */}
        <div className="flex items-center gap-1">
          {Array.from({ length: maxLives }).map((_, i) => (
            <Heart
              key={i}
              className={`h-5 w-5 transition-all ${
                i < lives 
                  ? 'text-destructive fill-destructive' 
                  : 'text-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-border/50" />

        {/* Timer / Start Hunt */}
        {isHuntActive ? (
          <div className={`flex items-center gap-2 ${isPanicMode ? 'animate-pulse' : ''}`}>
            <Clock className={`h-4 w-4 ${isFeverMode ? 'text-primary' : isPanicMode ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className={`font-mono font-bold text-lg ${
              isFeverMode ? 'text-primary' : isPanicMode ? 'text-destructive' : 'text-foreground'
            }`}>
              {formatTime(timeLeft)}
            </span>
            {isFeverMode && (
              <span className="text-xs font-bold text-primary uppercase animate-bounce">FEVER!</span>
            )}
          </div>
        ) : cooldownLeft > 0 ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-sm">Next hunt in {formatTime(cooldownLeft)}</span>
          </div>
        ) : (
          <button
            onClick={startHunt}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            <Zap className="h-4 w-4" />
            START HUNT
          </button>
        )}

        <div className="w-px h-6 bg-border/50" />

        {/* Boxes Found */}
        {isHuntActive && (
          <>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="font-bold text-foreground">
                {boxesCollected}/{totalBoxesThisHunt}
              </span>
            </div>
            <div className="w-px h-6 bg-border/50" />
          </>
        )}

        {/* Streak */}
        {huntStreak > 0 && (
          <>
            <div className="flex items-center gap-1 text-secondary">
              <Zap className="h-4 w-4" />
              <span className="font-bold text-sm">{huntStreak}x</span>
            </div>
            <div className="w-px h-6 bg-border/50" />
          </>
        )}

        {/* Vouchers */}
        <div className="flex items-center gap-1">
          <Gift className={`h-4 w-4 ${unusedVouchers > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className={`font-bold text-sm ${unusedVouchers > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
            {unusedVouchers}
          </span>
        </div>
      </div>

      {/* Fever Mode Indicator */}
      {isFeverMode && (
        <div className="px-4 py-1 rounded-full bg-primary/20 border border-primary text-primary text-xs font-bold uppercase animate-pulse">
          🔥 Boxes glowing brighter! Find them fast! 🔥
        </div>
      )}
    </div>
  );
}
