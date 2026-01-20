import { useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useMissionStore } from '@/stores/missionStore';
import { cn } from '@/lib/utils';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function MissionTimer() {
  const { isActive, phase, timeRemaining, updateTimer } = useMissionStore();

  useEffect(() => {
    if (!isActive || phase === 'inactive' || phase === 'completed' || phase === 'failed') {
      return;
    }

    const interval = setInterval(() => {
      updateTimer(1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, phase, updateTimer]);

  if (!isActive || phase === 'inactive' || phase === 'completed' || phase === 'failed') {
    return null;
  }

  const isUrgent = timeRemaining <= 15;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md border",
        isUrgent ? "bg-red-950/90 border-red-500/50 animate-pulse" : "bg-background/80 border-border/50"
      )}
    >
      <Clock className={cn("h-4 w-4", isUrgent ? "text-red-400" : "text-muted-foreground")} />
      <span className={cn("font-mono text-lg font-bold", isUrgent ? "text-red-400" : "text-foreground")}>
        {formatTime(timeRemaining)}
      </span>
    </div>
  );
}
