import { useEffect } from 'react';
import { Clock, CloudFog, Eye, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHeistStore } from '@/stores/heistStore';

export default function HeistUI() {
  const {
    phase,
    timeRemaining,
    detectionLevel,
    equipment,
    playerLives,
    updateTimer,
    useEMP,
    useSmoke,
    activateSilentFootsteps,
  } = useHeistStore();

  useEffect(() => {
    if (phase !== 'infiltrating' && phase !== 'escaping') return;
    const interval = setInterval(() => {
      updateTimer(1);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, updateTimer]);

  if (phase !== 'infiltrating' && phase !== 'escaping') return null;

  return (
    <>
      <div className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 150 }}>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md border bg-background/80 border-border/50">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-lg font-bold text-foreground">
            {Math.floor(timeRemaining / 60)}:{`${timeRemaining % 60}`.padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="absolute top-28 left-2 md:left-4 flex flex-col gap-2 pointer-events-none" style={{ zIndex: 150 }}>
        <div className="flex items-center gap-1 bg-background/80 backdrop-blur-md rounded-lg px-3 py-2 border border-border/50">
          {Array.from({ length: 3 }).map((_, i) => (
            <Shield
              key={i}
              className={cn(
                "h-4 w-4",
                i < playerLives ? "text-emerald-400" : "text-muted-foreground"
              )}
            />
          ))}
        </div>
        <div className="bg-background/80 backdrop-blur-md rounded-lg px-3 py-2 border border-border/50">
          <div className="flex items-center gap-2 text-xs">
            <Eye className="h-4 w-4 text-amber-400" />
            <span className="text-muted-foreground">Detection</span>
            <span className="font-bold text-foreground">{Math.round(detectionLevel)}%</span>
          </div>
        </div>
      </div>

      <div className="absolute top-28 right-2 md:right-4 flex flex-col gap-2 pointer-events-auto" style={{ zIndex: 150 }}>
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            useEMP();
          }}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all touch-manipulation active:scale-95 bg-background/80 border-border/50 hover:bg-background/90"
          disabled={equipment.empCharges <= 0}
        >
          <Zap className="h-5 w-5 text-blue-400" />
          <span className="text-[10px] uppercase font-bold text-muted-foreground">EMP</span>
          <span className="text-xs text-foreground">{equipment.empCharges}</span>
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            useSmoke();
          }}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all touch-manipulation active:scale-95 bg-background/80 border-border/50 hover:bg-background/90"
          disabled={equipment.smokeGrenades <= 0}
        >
          <CloudFog className="h-5 w-5 text-purple-400" />
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Smoke</span>
          <span className="text-xs text-foreground">{equipment.smokeGrenades}</span>
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            activateSilentFootsteps();
          }}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all touch-manipulation active:scale-95 bg-background/80 border-border/50 hover:bg-background/90"
          disabled={equipment.silentCooldown > 0}
        >
          <Shield className="h-5 w-5 text-emerald-400" />
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Silent</span>
          <span className="text-xs text-foreground">
            {equipment.silentCooldown > 0 ? `${equipment.silentCooldown}s` : 'Ready'}
          </span>
        </button>
      </div>
    </>
  );
}
