import { useEffect } from 'react';
import { AlertTriangle, Clock, CloudFog, Eye, MapPin, Shield, Target, Zap } from 'lucide-react';
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
    targetShopName,
    targetItemName,
    hasItem,
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
      {/* Timer */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 150 }}>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md border bg-background/80 border-border/50">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className={cn(
            "font-mono text-lg font-bold",
            timeRemaining <= 30 ? "text-destructive animate-pulse" : "text-foreground"
          )}>
            {Math.floor(timeRemaining / 60)}:{`${timeRemaining % 60}`.padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Left side - Health & Detection */}
      <div className="absolute top-28 left-2 md:left-4 flex flex-col gap-2 pointer-events-none" style={{ zIndex: 150 }}>
        {/* Lives */}
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
        
        {/* Detection Meter */}
        <div className="bg-background/80 backdrop-blur-md rounded-lg px-3 py-2 border border-border/50">
          <div className="flex items-center gap-2 text-xs mb-1">
            <Eye className={cn(
              "h-4 w-4",
              detectionLevel > 70 ? "text-destructive animate-pulse" : 
              detectionLevel > 40 ? "text-amber-400" : "text-emerald-400"
            )} />
            <span className="text-muted-foreground">Detection</span>
            <span className="font-bold text-foreground">{Math.round(detectionLevel)}%</span>
          </div>
          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-200",
                detectionLevel > 70 ? "bg-destructive" : 
                detectionLevel > 40 ? "bg-amber-400" : "bg-emerald-400"
              )}
              style={{ width: `${detectionLevel}%` }}
            />
          </div>
        </div>

        {/* Target Info */}
        <div className="bg-background/80 backdrop-blur-md rounded-lg px-3 py-2 border border-border/50">
          <div className="flex items-center gap-2 text-xs mb-1">
            <Target className="h-4 w-4 text-amber-400" />
            <span className="text-muted-foreground">Target</span>
          </div>
          <div className="text-xs font-medium text-foreground truncate max-w-28">
            {targetShopName || 'Unknown'}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            {hasItem ? '✓ Item acquired!' : targetItemName}
          </div>
        </div>
      </div>

      {/* Right side - Equipment */}
      <div className="absolute top-28 right-2 md:right-4 flex flex-col gap-2 pointer-events-auto" style={{ zIndex: 150 }}>
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            useEMP();
          }}
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all touch-manipulation active:scale-95",
            "bg-background/80 border-border/50",
            equipment.empCharges <= 0 ? "opacity-50" : "hover:bg-background/90"
          )}
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
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all touch-manipulation active:scale-95",
            "bg-background/80 border-border/50",
            equipment.smokeGrenades <= 0 ? "opacity-50" : "hover:bg-background/90"
          )}
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
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all touch-manipulation active:scale-95",
            "bg-background/80 border-border/50",
            equipment.silentCooldown > 0 ? "opacity-50" : "hover:bg-background/90"
          )}
          disabled={equipment.silentCooldown > 0}
        >
          <Shield className={cn(
            "h-5 w-5",
            equipment.silentFootsteps ? "text-emerald-400 animate-pulse" : "text-emerald-400"
          )} />
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Silent</span>
          <span className="text-xs text-foreground">
            {equipment.silentCooldown > 0 ? `${Math.ceil(equipment.silentCooldown)}s` : 'Ready'}
          </span>
        </button>
      </div>

      {/* Escape Phase Alert */}
      {phase === 'escaping' && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 150 }}>
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg backdrop-blur-md border bg-destructive/90 border-destructive animate-pulse">
            <AlertTriangle className="h-5 w-5 text-destructive-foreground" />
            <span className="font-display text-sm font-bold uppercase tracking-wider text-destructive-foreground">
              ESCAPE! Get to the exit zone!
            </span>
            <MapPin className="h-5 w-5 text-destructive-foreground" />
          </div>
        </div>
      )}

      {/* Item Collected Notification */}
      {hasItem && phase === 'escaping' && (
        <div className="absolute top-48 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 150 }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md border bg-emerald-500/90 border-emerald-400">
            <span className="text-xs font-bold text-white">
              ✓ {targetItemName} acquired!
            </span>
          </div>
        </div>
      )}
    </>
  );
}
