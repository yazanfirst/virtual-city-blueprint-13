import { useEffect, useState } from 'react';
import { Crosshair } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { useDeviceType } from '@/hooks/useDeviceType';

export default function PunchIndicator() {
  const { nearbyDestructible, destructibles, isPunching, isChargingPunch, punchChargeStart, damageDestructible, startPunch, endPunch, startChargePunch, endChargePunch } = useGameStore();
  const deviceType = useDeviceType();
  const [chargeProgress, setChargeProgress] = useState(0);

  const targetDestructible = destructibles.find(d => d.id === nearbyDestructible && !d.destroyed);

  // Handle keyboard input for punching
  useEffect(() => {
    if (deviceType === 'mobile') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && !e.repeat && targetDestructible) {
        startChargePunch();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && targetDestructible) {
        const chargeTime = punchChargeStart ? Date.now() - punchChargeStart : 0;
        const damage = chargeTime > 800 ? 2 : 1; // Charged punch = 2x damage
        
        damageDestructible(targetDestructible.id, damage);
        startPunch();
        endChargePunch();
        
        setTimeout(endPunch, 200);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [deviceType, targetDestructible, punchChargeStart, damageDestructible, startPunch, endPunch, startChargePunch, endChargePunch]);

  // Update charge progress
  useEffect(() => {
    if (!isChargingPunch || !punchChargeStart) {
      setChargeProgress(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - punchChargeStart;
      setChargeProgress(Math.min(1, elapsed / 800));
    }, 16);

    return () => clearInterval(interval);
  }, [isChargingPunch, punchChargeStart]);

  const handleMobilePunch = () => {
    if (!targetDestructible) return;
    damageDestructible(targetDestructible.id, 1);
    startPunch();
    setTimeout(endPunch, 200);
  };

  if (!targetDestructible) return null;

  return (
    <div 
      className="pointer-events-auto absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      style={{ zIndex: 160 }}
    >
      {/* Charge bar */}
      {isChargingPunch && (
        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${chargeProgress >= 1 ? 'bg-primary' : 'bg-secondary'}`}
            style={{ width: `${chargeProgress * 100}%` }}
          />
        </div>
      )}

      {/* Punch button/indicator */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background/90 backdrop-blur-md border border-primary/50">
        <Crosshair className={`h-5 w-5 ${isPunching ? 'text-primary animate-ping' : 'text-muted-foreground'}`} />
        
        {deviceType === 'mobile' ? (
          <button
            onClick={handleMobilePunch}
            className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-bold text-sm"
          >
            PUNCH
          </button>
        ) : (
          <span className="text-sm text-foreground">
            Hold <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">E</kbd> to punch
          </span>
        )}
        
        {/* Target HP */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>HP:</span>
          <span className={targetDestructible.currentHp <= 1 ? 'text-destructive' : 'text-foreground'}>
            {targetDestructible.currentHp}/{targetDestructible.maxHp}
          </span>
        </div>
      </div>

      {/* Charge hint */}
      {deviceType !== 'mobile' && chargeProgress > 0 && chargeProgress < 1 && (
        <span className="text-xs text-muted-foreground animate-pulse">
          Hold for charged punch (2x damage)
        </span>
      )}
    </div>
  );
}
