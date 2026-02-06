import { useEffect, useMemo, useState } from 'react';
import { Clock, Heart, Sparkles, AlertTriangle, Navigation } from 'lucide-react';
import { useMirrorWorldStore } from '@/stores/mirrorWorldStore';
import { usePlayerStore } from '@/stores/playerStore';
import { cn } from '@/lib/utils';

export default function MirrorWorldUI() {
  const {
    phase,
    isPaused,
    timeRemaining,
    playerLives,
    collectedCount,
    requiredAnchors,
    shadowPositions,
    anchors,
    promptMessage,
    promptKey,
    toastMessage,
    updateTimer,
  } = useMirrorWorldStore();
  const playerPosition = usePlayerStore((state) => state.position);
  const MAP_BOUNDS = 60;
  const MAP_SIZE = 144;
  type LadderPosition = { id: string; base: [number, number, number]; top: [number, number, number] };
  const LADDER_POSITIONS: LadderPosition[] = [
    { id: 'ladder-1', base: [13.6, 0, 40], top: [18, 8.2, 40] },
    { id: 'ladder-2', base: [-13.6, 0, 28], top: [-18, 8.2, 28] },
    { id: 'ladder-3', base: [47, 0, 13.6], top: [47, 8.2, 18] },
    { id: 'ladder-4', base: [-35, 0, -13.6], top: [-35, 8.2, -18] },
    { id: 'ladder-5', base: [13.6, 0, -40], top: [18, 8.2, -40] },
  ];
  const [showHint, setShowHint] = useState(false);
  const [canClimb, setCanClimb] = useState<null | LadderPosition>(null);
  const isOnRoof = playerPosition[1] >= 7.5;
  const setPlayerPosition = usePlayerStore((state) => state.setPosition);
  const resetToSafeSpawn = usePlayerStore((state) => state.resetToSafeSpawn);

  // Timer logic - respects pause state
  useEffect(() => {
    if (phase !== 'hunting' || isPaused) return;
    const interval = setInterval(() => {
      updateTimer(1);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, isPaused, updateTimer]);

  useEffect(() => {
    if (phase !== 'hunting') {
      setShowHint(false);
      return;
    }
    setShowHint(true);
    const timeout = setTimeout(() => setShowHint(false), 7000);
    return () => clearTimeout(timeout);
  }, [phase]);

  // Find closest shadow for warning/compass
  const closestShadow = useMemo(() => {
    let minDist = Infinity;
    let closest: [number, number, number] = shadowPositions[0] || [0, 0, 0];
    shadowPositions.forEach((pos) => {
      const dx = pos[0] - playerPosition[0];
      const dz = pos[2] - playerPosition[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < minDist) {
        minDist = dist;
        closest = pos;
      }
    });
    return { position: closest, distance: minDist };
  }, [shadowPositions, playerPosition]);

  const shadowAngle = useMemo(() => {
    const dx = closestShadow.position[0] - playerPosition[0];
    const dz = closestShadow.position[2] - playerPosition[2];
    return Math.atan2(dz, dx) * (180 / Math.PI) + 90;
  }, [closestShadow.position, playerPosition]);

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

  const mapLadders = useMemo(
    () =>
      LADDER_POSITIONS.map((ladder) => {
        const [x, , z] = ladder.base;
        const clampedX = Math.max(-MAP_BOUNDS, Math.min(MAP_BOUNDS, x));
        const clampedZ = Math.max(-MAP_BOUNDS, Math.min(MAP_BOUNDS, z));
        const left = ((clampedX + MAP_BOUNDS) / (MAP_BOUNDS * 2)) * 100;
        const top = (1 - (clampedZ + MAP_BOUNDS) / (MAP_BOUNDS * 2)) * 100;
        return { id: ladder.id, left, top };
      }),
    [MAP_BOUNDS]
  );

  useEffect(() => {
    if (phase !== 'hunting') {
      setCanClimb(null);
      return;
    }
    const [px, py, pz] = playerPosition;
    if (py > 1.5) {
      setCanClimb(null);
      return;
    }
    const nearest = LADDER_POSITIONS.find((ladder) => {
      const dx = ladder.base[0] - px;
      const dz = ladder.base[2] - pz;
      return Math.sqrt(dx * dx + dz * dz) < 2.4;
    });
    setCanClimb(nearest ?? null);
  }, [phase, playerPosition]);

  if (phase !== 'hunting') return null;

  return (
    <>
      {/* Top HUD - Timer and Messages */}
      <div className="absolute top-12 sm:top-14 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center gap-1.5 sm:gap-2" style={{ zIndex: 150 }}>
        <div className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg backdrop-blur-md border',
          timeRemaining <= 10 ? 'bg-red-950/90 border-red-500/50 animate-pulse' : 'bg-background/80 border-border/50'
        )}>
          <Clock className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', timeRemaining <= 10 ? 'text-red-400' : 'text-muted-foreground')} />
          <span className={cn('font-mono text-base sm:text-lg font-bold', timeRemaining <= 10 ? 'text-red-400' : 'text-foreground')}>
            {formatTime(timeRemaining)}
          </span>
        </div>
        {toastMessage && (
          <div className="max-w-[280px] sm:max-w-md text-center bg-emerald-500/95 border border-emerald-200/80 text-white text-sm sm:text-base font-bold px-4 py-2 sm:px-5 sm:py-3 rounded-lg shadow-lg shadow-emerald-500/40">
            {toastMessage}
          </div>
        )}
        {!toastMessage && promptMessage && (
          <div className="max-w-[280px] sm:max-w-md text-center bg-purple-900/90 border border-purple-300/70 text-white text-sm sm:text-base font-bold px-4 py-2 sm:px-5 sm:py-3 rounded-lg shadow-lg shadow-purple-500/40">
            {promptMessage}
          </div>
        )}
        {showHint && (
          <div className="max-w-[240px] sm:max-w-xs text-center bg-purple-950/80 border border-purple-500/40 text-purple-100 text-[10px] sm:text-xs px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg backdrop-blur-md">
            Follow the purple dots on the map to rooftop anchors. Look for glowing ladder panels and use Climb, then touch anchors to collect them.
          </div>
        )}
        {canClimb && (
          <button
            type="button"
            className="pointer-events-auto rounded-full bg-purple-500/90 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/40 transition hover:bg-purple-400 active:scale-95 touch-manipulation"
            onClick={() => setPlayerPosition(canClimb.top)}
          >
            Climb
          </button>
        )}
        {isOnRoof && (
          <button
            type="button"
            className="pointer-events-auto rounded-full bg-slate-900/80 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-slate-800 active:scale-95 touch-manipulation"
            onClick={() => {
              const [px, , pz] = playerPosition;
              let nearest = LADDER_POSITIONS[0];
              let nearestDist = Number.POSITIVE_INFINITY;
              LADDER_POSITIONS.forEach((ladder) => {
                const dx = ladder.base[0] - px;
                const dz = ladder.base[2] - pz;
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < nearestDist) {
                  nearestDist = dist;
                  nearest = ladder;
                }
              });
              if (nearest) {
                setPlayerPosition([nearest.base[0], 0.25, nearest.base[2]]);
              } else {
                resetToSafeSpawn();
              }
            }}
          >
            Drop Down
          </button>
        )}
      </div>
      {toastMessage && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center" style={{ zIndex: 160 }}>
          <div className="mx-4 max-w-lg rounded-2xl border-2 border-emerald-200/90 bg-emerald-500/95 px-6 py-4 text-center text-lg font-bold text-white shadow-2xl shadow-emerald-500/50">
            {toastMessage}
          </div>
        </div>
      )}
      {!toastMessage && promptMessage && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center" style={{ zIndex: 160 }}>
          <div className="mx-4 max-w-lg rounded-2xl border-2 border-purple-300/90 bg-purple-800/95 px-6 py-4 text-center text-lg font-bold text-white shadow-2xl shadow-purple-500/50">
            {promptMessage}
          </div>
        </div>
      )}

      {/* Left side stats - compact on mobile */}
      <div className="absolute top-24 sm:top-28 left-1 sm:left-2 flex flex-col gap-1.5 sm:gap-2 pointer-events-none" style={{ zIndex: 150 }}>
        <div className="flex items-center gap-0.5 bg-background/80 backdrop-blur-md rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 border border-border/50">
          {Array.from({ length: 2 }).map((_, i) => (
            <Heart
              key={i}
              className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', i < playerLives ? 'text-red-500 fill-red-500' : 'text-muted-foreground')}
            />
          ))}
        </div>
        <div className="bg-background/80 backdrop-blur-md rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 border border-border/50">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-300" />
            <span className="font-bold text-foreground">
              {collectedCount}/{requiredAnchors}
            </span>
          </div>
        </div>
        {closestShadow.distance < 6 && (
          <div className="bg-red-950/90 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 border border-red-500/60 text-[10px] sm:text-xs text-red-200 flex items-center gap-1 sm:gap-2 animate-pulse">
            <AlertTriangle className="h-3 w-3" />
            Shadow!
          </div>
        )}
      </div>

      {/* Right side - Map (hidden on very small mobile, smaller on mobile) */}
      <div className="absolute top-24 sm:top-28 right-1 sm:right-2 pointer-events-none flex flex-col gap-2 sm:gap-3" style={{ zIndex: 150 }}>
        <div className="bg-background/80 backdrop-blur-md rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 border border-border/50 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
          <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-300" style={{ transform: `rotate(${shadowAngle}deg)` }} />
          <span className="text-muted-foreground">Shadow</span>
        </div>
        {promptMessage && (
          <div className="mt-1 bg-purple-950/90 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 border border-purple-500/50 text-[10px] sm:text-xs text-purple-100 flex flex-col gap-0.5">
            <span className="line-clamp-2">{promptMessage}</span>
            {promptKey && (
              <span className="font-bold text-purple-200">Press {promptKey}</span>
            )}
          </div>
        )}
        {/* Mini-map - smaller on mobile */}
        <div className="bg-background/80 backdrop-blur-md rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 border border-border/50 text-[10px] sm:text-xs text-muted-foreground">
          <div className="flex items-center justify-between text-[0.6rem] sm:text-[0.7rem] uppercase tracking-wide text-purple-300">
            <span>Map</span>
            <span>{requiredAnchors - collectedCount} left</span>
          </div>
          <div
            className="relative mt-1.5 sm:mt-2 rounded-md border border-purple-500/40 bg-gradient-to-br from-purple-950/70 to-black/60"
            style={{ width: 100, height: 100 }}
          >
            <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
            {mapAnchors.map((anchor) => (
              <div
                key={anchor.id}
                className={cn(
                  'absolute h-1.5 w-1.5 rounded-full border',
                  anchor.isCollected
                    ? 'bg-muted-foreground/50 border-muted-foreground/60'
                    : 'bg-purple-200 border-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.7)]'
                )}
                style={{ left: `${anchor.left}%`, top: `${anchor.top}%`, transform: 'translate(-50%, -50%)' }}
              />
            ))}
            {mapLadders.map((ladder) => (
              <div
                key={ladder.id}
                className="absolute h-0 w-0"
                style={{
                  left: `${ladder.left}%`,
                  top: `${ladder.top}%`,
                  transform: 'translate(-50%, -50%)',
                  borderLeft: '3px solid transparent',
                  borderRight: '3px solid transparent',
                  borderBottom: '5px solid rgba(196, 181, 253, 0.95)',
                  filter: 'drop-shadow(0 0 3px rgba(196, 181, 253, 0.9))',
                }}
              />
            ))}
            <div
              className="absolute h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
              style={{ left: `${mapPlayer.left}%`, top: `${mapPlayer.top}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[0.6rem] sm:text-[0.7rem] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
              You
            </span>
            <span className="flex items-center gap-0.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-200" />
              Anchor
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
