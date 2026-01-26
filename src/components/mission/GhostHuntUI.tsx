import { useEffect, useState, useCallback } from 'react';
import { Radio, Flashlight, Ghost, Clock, Heart, Zap, AlertTriangle, Crosshair } from 'lucide-react';
import { useGhostHuntStore } from '@/stores/ghostHuntStore';
import { cn } from '@/lib/utils';

interface GhostHuntUIProps {
  onComplete?: () => void;
  onFailed?: () => void;
}

export default function GhostHuntUI({ onComplete, onFailed }: GhostHuntUIProps) {
  const {
    phase,
    timeRemaining,
    ghosts,
    capturedCount,
    requiredCaptures,
    totalGhosts,
    equipment,
    playerLives,
    difficultyLevel,
    updateTimer,
    toggleEMF,
    useFlashlight,
    fireGhostTrap,
    drainBattery,
    completeBriefing,
  } = useGhostHuntStore();
  
  // Timer logic
  useEffect(() => {
    if (phase !== 'hunting') return;
    
    const interval = setInterval(() => {
      updateTimer(1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [phase, updateTimer]);
  
  // EMF battery drain while active
  useEffect(() => {
    if (phase !== 'hunting' || !equipment.emfActive) return;
    
    const interval = setInterval(() => {
      drainBattery('emf', 2);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [phase, equipment.emfActive, drainBattery]);
  
  // Track phase changes
  useEffect(() => {
    if (phase === 'completed') {
      onComplete?.();
    } else if (phase === 'failed') {
      onFailed?.();
    }
  }, [phase, onComplete, onFailed]);
  
  // Get strongest EMF reading
  const strongestEMF = ghosts
    .filter(g => !g.isCaptured)
    .reduce((max, g) => Math.max(max, g.emfStrength), 0);
  
  // EMF level classification
  const getEMFLevel = (strength: number): { level: number; label: string; color: string } => {
    if (strength < 0.1) return { level: 0, label: 'NONE', color: 'text-muted-foreground' };
    if (strength < 0.3) return { level: 1, label: 'WEAK', color: 'text-blue-400' };
    if (strength < 0.5) return { level: 2, label: 'MODERATE', color: 'text-yellow-400' };
    if (strength < 0.7) return { level: 3, label: 'STRONG', color: 'text-orange-400' };
    if (strength < 0.9) return { level: 4, label: 'VERY STRONG', color: 'text-red-400' };
    return { level: 5, label: 'EXTREME!', color: 'text-red-500 animate-pulse' };
  };
  
  const emfReading = getEMFLevel(strongestEMF);
  
  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Briefing screen
  if (phase === 'briefing') {
    return (
      <div 
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        style={{ touchAction: 'manipulation' }}
      >
        <div className="ghost-hunt-briefing bg-background/95 border border-purple-500/50 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Ghost className="h-8 w-8 text-purple-400" />
            <h2 className="font-display text-xl font-bold text-purple-400 uppercase tracking-wider">
              Ghost Hunt
            </h2>
          </div>
          <div className="ghost-hunt-briefing__content text-sm text-muted-foreground space-y-3 mb-6">
            <p className="text-foreground font-medium">
              Paranormal activity detected! Capture {requiredCaptures} ghosts before time runs out.
            </p>
            
            <div className="bg-purple-950/50 rounded-lg p-3 border border-purple-500/30">
              <h3 className="text-purple-300 font-bold text-xs uppercase mb-2">Equipment:</h3>
              <ul className="space-y-1 text-xs">
                <li className="flex items-center gap-2">
                  <Radio className="h-3 w-3 text-blue-400" />
                  <span><strong>EMF Detector:</strong> Shows ghost proximity</span>
                </li>
                <li className="flex items-center gap-2">
                  <Flashlight className="h-3 w-3 text-yellow-400" />
                  <span><strong>Flashlight:</strong> Reveals hidden ghosts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Crosshair className="h-3 w-3 text-green-400" />
                  <span><strong>Ghost Trap:</strong> Shoot to capture revealed ghosts</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-red-950/50 rounded-lg p-3 border border-red-500/30">
              <h3 className="text-red-300 font-bold text-xs uppercase mb-2">Warning:</h3>
              <ul className="space-y-1 text-xs">
                <li>• Ghosts can attack if you're too close</li>
                <li>• Reveal ghosts before capturing them</li>
                <li>• Equipment has limited battery</li>
                <li>• Difficulty: Level {difficultyLevel}</li>
              </ul>
            </div>
          </div>
          
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              completeBriefing();
            }}
            className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-wider transition-colors touch-manipulation active:scale-[0.98]"
          >
            Start Hunt
          </button>
        </div>
      </div>
    );
  }
  
  // Hunting phase UI
  if (phase !== 'hunting') return null;
  
  return (
    <div className="ghost-hunt-ui">
      {/* Top HUD */}
      <div 
        className="ghost-hunt-ui__timer absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ zIndex: 150 }}
      >
        {/* Timer */}
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md border",
          timeRemaining <= 15 
            ? "bg-red-950/90 border-red-500/50 animate-pulse" 
            : "bg-background/80 border-border/50"
        )}>
          <Clock className={cn("h-4 w-4", timeRemaining <= 15 ? "text-red-400" : "text-muted-foreground")} />
          <span className={cn(
            "font-mono text-lg font-bold",
            timeRemaining <= 15 ? "text-red-400" : "text-foreground"
          )}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>
      
      {/* Left side - Lives & Progress */}
      <div 
        className="ghost-hunt-ui__stats absolute top-28 left-2 md:left-4 flex flex-col gap-2 pointer-events-none"
        style={{ zIndex: 150 }}
      >
        {/* Lives */}
        <div className="flex items-center gap-1 bg-background/80 backdrop-blur-md rounded-lg px-3 py-2 border border-border/50">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={cn(
                "h-4 w-4",
                i < playerLives ? "text-red-500 fill-red-500" : "text-muted-foreground"
              )}
            />
          ))}
        </div>
        
        {/* Capture progress */}
        <div className="bg-background/80 backdrop-blur-md rounded-lg px-3 py-2 border border-border/50">
          <div className="flex items-center gap-2 text-xs">
            <Ghost className="h-4 w-4 text-purple-400" />
            <span className="text-muted-foreground">Captured:</span>
            <span className="font-bold text-foreground">
              {capturedCount}/{requiredCaptures}
            </span>
          </div>
        </div>
      </div>
      
      {/* Right side - Equipment */}
      <div 
        className="ghost-hunt-ui__equipment absolute top-28 right-2 md:right-4 flex flex-col gap-2 pointer-events-auto"
        style={{ zIndex: 150 }}
      >
        {/* EMF Detector */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            toggleEMF();
          }}
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all touch-manipulation active:scale-95",
            equipment.emfActive
              ? "bg-blue-950/90 border-blue-500/50"
              : "bg-background/80 border-border/50 hover:bg-background/90"
          )}
          disabled={equipment.emfBattery <= 0}
        >
          <Radio className={cn("h-5 w-5", equipment.emfActive ? "text-blue-400" : "text-muted-foreground")} />
          <span className="text-[10px] uppercase font-bold text-muted-foreground">EMF</span>
          {/* Battery */}
          <div className="w-8 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all",
                equipment.emfBattery > 30 ? "bg-blue-400" : "bg-red-400"
              )}
              style={{ width: `${equipment.emfBattery}%` }}
            />
          </div>
        </button>
        
        {/* Flashlight */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            useFlashlight();
          }}
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all touch-manipulation active:scale-95",
            equipment.flashlightActive
              ? "bg-yellow-950/90 border-yellow-500/50"
              : "bg-background/80 border-border/50 hover:bg-background/90",
            equipment.flashlightCooldown > 0 && "opacity-50"
          )}
          disabled={equipment.flashlightBattery <= 0 || equipment.flashlightCooldown > 0}
        >
          <Flashlight className={cn("h-5 w-5", equipment.flashlightActive ? "text-yellow-400" : "text-muted-foreground")} />
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Flash</span>
          {/* Battery */}
          <div className="w-8 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all",
                equipment.flashlightBattery > 30 ? "bg-yellow-400" : "bg-red-400"
              )}
              style={{ width: `${equipment.flashlightBattery}%` }}
            />
          </div>
        </button>
        
        {/* Ghost Trap - Shoot to capture */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            fireGhostTrap();
          }}
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all touch-manipulation active:scale-95",
            equipment.trapActive
              ? "bg-green-950/90 border-green-500/50 scale-110"
              : "bg-background/80 border-border/50 hover:bg-background/90",
            equipment.trapCharges <= 0 && "opacity-50"
          )}
          disabled={equipment.trapCharges <= 0 || equipment.trapActive}
        >
          <Crosshair className={cn("h-5 w-5", equipment.trapActive ? "text-green-400 animate-pulse" : "text-muted-foreground")} />
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Trap</span>
          {/* Charges indicator */}
          <div className="flex gap-0.5">
            {[1, 2, 3].map((charge) => (
              <div
                key={charge}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  charge <= equipment.trapCharges ? "bg-green-400" : "bg-gray-700"
                )}
              />
            ))}
          </div>
        </button>
      </div>
      
      {/* EMF Reading Display (when active) */}
      {equipment.emfActive && (
        <div 
          className="ghost-hunt-ui__emf absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ zIndex: 150 }}
        >
          <div className="bg-blue-950/90 backdrop-blur-md rounded-lg px-4 py-3 border border-blue-500/50">
            <div className="flex items-center gap-3">
              <Radio className="h-5 w-5 text-blue-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-blue-300">EMF Reading</span>
                <span className={cn("font-mono font-bold", emfReading.color)}>
                  {emfReading.label}
                </span>
              </div>
              {/* Visual meter */}
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      "w-2 h-4 rounded-sm transition-all",
                      level <= emfReading.level
                        ? level <= 2 ? "bg-blue-400" : level <= 4 ? "bg-orange-400" : "bg-red-500"
                        : "bg-gray-700"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Flashlight active indicator */}
      {equipment.flashlightActive && (
        <div 
          className="fixed inset-0 pointer-events-none"
          style={{ 
            zIndex: 100,
            background: 'radial-gradient(circle at 50% 50%, transparent 20%, rgba(255,255,200,0.15) 40%, transparent 60%)',
          }}
        />
      )}
      
      {/* Ghost Trap beam effect */}
      {equipment.trapActive && (
        <div 
          className="fixed inset-0 pointer-events-none flex items-center justify-center"
          style={{ zIndex: 100 }}
        >
          {/* Targeting crosshair */}
          <div className="relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-4 border-green-400 rounded-full animate-ping opacity-50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-green-300 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-green-400" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 bg-green-400" />
          </div>
          {/* Green beam overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 40% 60% at 50% 50%, rgba(74, 222, 128, 0.3) 0%, transparent 70%)',
            }}
          />
        </div>
      )}
    </div>
  );
}
