import { Heart } from 'lucide-react';
import { useMissionStore } from '@/stores/missionStore';

interface HealthDisplayProps {
  className?: string;
  lives?: number;  // Optional override for ghost hunt
  maxLives?: number;
}

/**
 * Displays player hearts/lives during mission
 */
export default function HealthDisplay({ className = '', lives: livesOverride, maxLives: maxLivesOverride }: HealthDisplayProps) {
  const missionStore = useMissionStore();
  
  const lives = livesOverride ?? missionStore.lives;
  const maxLives = maxLivesOverride ?? missionStore.maxLives;
  const isActive = livesOverride !== undefined || missionStore.isActive;
  
  if (!isActive) return null;
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: maxLives }).map((_, index) => (
        <Heart
          key={index}
          className={`h-6 w-6 transition-all duration-300 ${
            index < lives
              ? 'text-red-500 fill-red-500 scale-100'
              : 'text-muted-foreground fill-transparent scale-90'
          }`}
        />
      ))}
    </div>
  );
}
