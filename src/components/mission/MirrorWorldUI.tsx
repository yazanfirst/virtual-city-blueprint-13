import { useEffect, useMemo, useState } from 'react';
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
    anchors,
    promptMessage,
    promptKey,
    updateTimer,
  } = useMirrorWorldStore();
  const playerPosition = usePlayerStore((state) => state.position);
  const MAP_BOUNDS = 60;
  const MAP_SIZE = 144;
  const STAIR_POSITIONS: [number, number, number][] = [
    [12, 0, 24],
    [-12, 0, 20],
    [32, 0, 6],
    [-32, 0, -6],
    [0, 0, -36],
  ];
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (phase !== 'hunting') return;
    const interval = setInterval(() => {
      updateTimer(1);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, updateTimer]);

  useEffect(() => {
    if (phase !== 'hunting') {
      setShowHint(false);
      return;
    }
    setShowHint(true);
    const timeout = setTimeout(() => setShowHint(false), 7000);
    return () => clearTimeout(timeout);
  }, [phase]);

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

  const mapPlayer = useMemo(() => {
    const [x, , z] = playerPosition;
    const clampedX = Math.max(-MAP_BOUNDS, Math.min(MAP_BOUNDS, x));
    const clampedZ = Math.max(-MAP_BOUNDS, Math.min(MAP_BOUNDS, z));
    const left = ((clampedX + MAP_BOUNDS) / (MAP_BOUNDS * 2)) * 100;
    const top = (1 - (clampedZ + MAP_BOUNDS) / (MAP_BOUNDS * 2)) * 100;
    return { left, top };
  }, [playerPosition]);

  const mapAnchors = useMemo(
    () =>
      anchors.map((anchor) => {
        const [x, , z] = anchor.position;
        const clampedX = Math.max(-MAP_BOUNDS, Math.min(MAP_BOUNDS, x));
        const clampedZ = Math.max(-MAP_BOUNDS, Math.min(MAP_BOUNDS, z));
        const left = ((clampedX + MAP_BOUNDS) / (MAP_BOUNDS * 2)) * 100;
        const top = (1 - (clampedZ + MAP_BOUNDS) / (MAP_BOUNDS * 2)) * 100;
        return { id: anchor.id, left, top, isCollected: anchor.isCollected, type: anchor.type };
      }),
    [anchors]
  );

  const mapStairs = useMemo(
    () =>
      STAIR_POSITIONS.map((position, index) => {
        const [x, , z] = position;
        const clampedX = Math.max(-MAP_BOUNDS, Math.min(MAP_BOUNDS, x));
        const clampedZ = Math.max(-MAP_BOUNDS, Math.min(MAP_BOUNDS, z));
        const left = ((clampedX + MAP_BOUNDS) / (MAP_BOUNDS * 2)) * 100;
        const top = (1 - (clampedZ + MAP_BOUNDS) / (MAP_BOUNDS * 2)) * 100;
        return { id: `stair-${index}`, left, top };
      }),
    [MAP_BOUNDS]
  );

  if (phase !== 'hunting') return null;

  return (
    <>
      <div className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center gap-2" style={{ zIndex: 150 }}>
        <div className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md border',
          timeRemaining <= 10 ? 'bg-red-950/90 border-red-500/50 animate-pulse' : 'bg-background/80 border-border/50'
        )}>
          <Clock className={cn('h-4 w-4', timeRemaining <= 10 ? 'text-red-400' : 'text-muted-foreground')} />
          <span className={cn('font-mono text-lg font-bold', timeRemaining <= 10 ? 'text-red-400' : 'text-foreground')}>
            {formatTime(timeRemaining)}
          </span>
        </div>
        {showHint && (
          <div className="max-w-xs text-center bg-purple-950/80 border border-purple-500/40 text-purple-100 text-xs px-3 py-2 rounded-lg backdrop-blur-md">
            Follow the purple dots on the map to rooftop anchors. Walk up the glowing stairs with purple beacons, then touch anchors to collect them.
          </div>
        )}
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

      <div className="absolute top-28 right-2 md:right-4 pointer-events-none flex flex-col gap-3" style={{ zIndex: 150 }}>
        <div className="bg-background/80 backdrop-blur-md rounded-lg px-3 py-2 border border-border/50 flex items-center gap-2 text-xs">
          <Navigation className="h-4 w-4 text-purple-300" style={{ transform: `rotate(${shadowAngle}deg)` }} />
          <span className="text-muted-foreground">Shadow</span>
        </div>
        {promptMessage && (
          <div className="mt-2 bg-purple-950/90 rounded-lg px-3 py-2 border border-purple-500/50 text-xs text-purple-100 flex flex-col gap-1">
            <span>{promptMessage}</span>
            {promptKey && (
              <span className="font-bold text-purple-200">Press {promptKey}</span>
            )}
          </div>
        )}
        <div className="bg-background/80 backdrop-blur-md rounded-lg px-3 py-2 border border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center justify-between text-[0.7rem] uppercase tracking-wide text-purple-300">
            <span>Map</span>
            <span>{requiredAnchors - collectedCount} left</span>
          </div>
          <div
            className="relative mt-2 rounded-md border border-purple-500/40 bg-gradient-to-br from-purple-950/70 to-black/60"
            style={{ width: MAP_SIZE, height: MAP_SIZE }}
          >
            <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
            {mapAnchors.map((anchor) => (
              <div
                key={anchor.id}
                className={cn(
                  'absolute h-2 w-2 rounded-full border',
                  anchor.isCollected
                    ? 'bg-muted-foreground/50 border-muted-foreground/60'
                    : 'bg-purple-200 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.7)]'
                )}
                style={{ left: `${anchor.left}%`, top: `${anchor.top}%`, transform: 'translate(-50%, -50%)' }}
              />
            ))}
            {mapStairs.map((stair) => (
              <div
                key={stair.id}
                className="absolute h-0 w-0"
                style={{
                  left: `${stair.left}%`,
                  top: `${stair.top}%`,
                  transform: 'translate(-50%, -50%)',
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderBottom: '7px solid rgba(196, 181, 253, 0.95)',
                  filter: 'drop-shadow(0 0 4px rgba(196, 181, 253, 0.9))',
                }}
              />
            ))}
            <div
              className="absolute h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.9)]"
              style={{ left: `${mapPlayer.left}%`, top: `${mapPlayer.top}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
          <div className="mt-2 flex items-center gap-3 text-[0.7rem] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-300" />
              You
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-purple-200" />
              Anchor
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-purple-200" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
              Stairs
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
