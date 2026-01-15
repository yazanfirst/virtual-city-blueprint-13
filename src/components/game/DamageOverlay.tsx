import { useGameStore } from '@/stores/gameStore';

export default function DamageOverlay() {
  const { showDamageOverlay, lives } = useGameStore();

  if (!showDamageOverlay) return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 200 }}
    >
      {/* Red flash overlay */}
      <div className="absolute inset-0 bg-red-500/40 animate-pulse" />
      
      {/* Vignette effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(255, 0, 0, 0.6) 100%)',
        }}
      />

      {/* OUCH text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-6xl font-display font-black text-white drop-shadow-[0_0_20px_rgba(255,0,0,1)] animate-bounce">
          OUCH!
        </span>
      </div>

      {/* Remaining lives warning */}
      {lives <= 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
          <span className="text-xl font-bold text-red-400 animate-pulse">
            {lives === 0 ? 'NO LIVES LEFT!' : 'LAST LIFE!'}
          </span>
        </div>
      )}
    </div>
  );
}
