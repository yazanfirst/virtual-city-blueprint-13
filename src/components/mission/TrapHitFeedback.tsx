import { useState, useEffect } from 'react';
import { useMissionStore } from '@/stores/missionStore';

/**
 * Shows a red "Ouch!" message when player is hit by a trap
 */
export default function TrapHitFeedback() {
  const [showMessage, setShowMessage] = useState(false);
  const [prevLives, setPrevLives] = useState(3);
  const { lives, isActive } = useMissionStore();
  
  useEffect(() => {
    if (!isActive) {
      setPrevLives(3);
      return;
    }
    
    // Detect when lives decrease (player was hit)
    if (lives < prevLives && lives > 0) {
      setShowMessage(true);
      
      // Hide message after animation
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 800);
      
      return () => clearTimeout(timer);
    }
    
    setPrevLives(lives);
  }, [lives, prevLives, isActive]);
  
  if (!showMessage) return null;
  
  return (
    <div className="fixed inset-0 z-[250] pointer-events-none flex items-center justify-center">
      {/* Red flash overlay */}
      <div className="absolute inset-0 bg-red-500/30 animate-pulse" />
      
      {/* Ouch text */}
      <div className="animate-bounce">
        <span 
          className="text-6xl md:text-8xl font-bold text-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]"
          style={{
            textShadow: '0 0 20px #ff0000, 0 0 40px #ff0000, 0 0 60px #ff0000',
            animation: 'shake 0.3s ease-in-out, fade-out 0.8s ease-out forwards',
          }}
        >
          OUCH!
        </span>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px) rotate(-2deg); }
          75% { transform: translateX(10px) rotate(2deg); }
        }
        @keyframes fade-out {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
