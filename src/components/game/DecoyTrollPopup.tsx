import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';

export default function DecoyTrollPopup() {
  const { showDecoyTroll, hideDecoyTroll } = useGameStore();

  useEffect(() => {
    if (showDecoyTroll) {
      const timer = setTimeout(hideDecoyTroll, 2000);
      return () => clearTimeout(timer);
    }
  }, [showDecoyTroll, hideDecoyTroll]);

  if (!showDecoyTroll) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 220 }}
    >
      <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-8 animate-scale-in text-center">
        {/* Troll emoji */}
        <div className="text-8xl mb-4 animate-bounce">
          😈
        </div>
        
        {/* Message */}
        <h3 className="font-display text-2xl font-bold text-white mb-2">
          GOTCHA!
        </h3>
        <p className="text-muted-foreground">
          That was a decoy box! 🎭
        </p>
        
        {/* Troll sound effect visual */}
        <div className="mt-4 flex items-center justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full animate-pulse"
              style={{
                height: `${10 + Math.random() * 20}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
