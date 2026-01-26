import { useEffect, useMemo } from 'react';
import { Clock, Heart, Sparkles, AlertTriangle, Navigation } from 'lucide-react';
import { useMirrorWorldStore } from '@/stores/mirrorWorldStore';
import { usePlayerStore } from '@/stores/playerStore';
import { cn } from '@/lib/utils';

export default function MirrorWorldUI() {
  const {
    phase,
    timeRemaining,
    playerLives,
    collectedCount,
    requiredAnchors,
    shadowPosition,
    updateTimer,
  } = useMirrorWorldStore();
  const playerPosition = usePlayerStore((state) => state.position);

  useEffect(() => {
    if (phase !== 'hunting') return;
    const interval = setInterval(() => {
      updateTimer(1);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, updateTimer]);

  const distanceToShadow = useMemo(() => {
    const dx = shadowPosition[0] - playerPosition[0];
    const dz = shadowPosition[2] - playerPosition[2];
    return Math.sqrt(dx * dx + dz * dz);
  }, [shadowPosition, playerPosition]);

  const shadowAngle = useMemo(() => {
    const dx = shadowPosition[0] - playerPosition[0];
    const dz = shadowPosition[2] - playerPosition[2];
    return Math.atan2(dz, dx) * (180 / Math.PI) + 90;
  }, [shadowPosition, playerPosition]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (phase !== 'hunting') return null;

  return (
    <>
      <div className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 150 }}>
        <div className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md border',
          timeRemaining <= 10 ? 'bg-red-950/90 border-red-500/50 animate-pulse' : 'bg-background/80 border-border/50'
        )}>
          <Clock className={cn('h-4 w-4', timeRemaining <= 10 ? 'text-red-400' : 'text-muted-foreground')} />
          <span className={cn('font-mono text-lg font-bold', timeRemaining <= 10 ? 'text-red-400' : 'text-foreground')}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      <div className="absolute top-28 left-2 md:left-4 flex flex-col gap-2 pointer-events-none" style={{ zIndex: 150 }}>
        <div className="flex items-center gap-1 bg-background/80 backdrop-blur-md rounded-lg px-3 py-2 border border-border/50">
          {Array.from({ length: 2 }).map((_, i) => (
            <Heart
              key={i}
              className={cn('h-4 w-4', i < playerLives ? 'text-red-500 fill-red-500' : 'text-muted-foreground')}
            />
          ))}
        </div>
        <div className="bg-background/80 backdrop-blur-md rounded-lg px-3 py-2 border border-border/50">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="h-4 w-4 text-purple-300" />
            <span className="text-muted-foreground">Anchors:</span>
            <span className="font-bold text-foreground">
              {collectedCount}/{requiredAnchors}
            </span>
          </div>
        </div>
        {distanceToShadow < 6 && (
          <div className="bg-red-950/90 rounded-lg px-3 py-2 border border-red-500/60 text-xs text-red-200 flex items-center gap-2 animate-pulse">
            <AlertTriangle className="h-3 w-3" />
            Shadow closing in!
          </div>
        )}
      </div>

      <div className="absolute top-28 right-2 md:right-4 pointer-events-none" style={{ zIndex: 150 }}>
        <div className="bg-background/80 backdrop-blur-md rounded-lg px-3 py-2 border border-border/50 flex items-center gap-2 text-xs">
          <Navigation className="h-4 w-4 text-purple-300" style={{ transform: `rotate(${shadowAngle}deg)` }} />
          <span className="text-muted-foreground">Shadow</span>
        </div>
      </div>
    </>
  );
}
