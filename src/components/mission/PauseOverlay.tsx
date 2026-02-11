import { Pause, Play, DoorOpen, Volume2, VolumeX, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PauseOverlayProps {
  onResume: () => void;
  onExit: () => void;
  missionName: string;
  missionLevel?: number;
  timeRemaining?: number;
}

export default function PauseOverlay({
  onResume,
  onExit,
  missionName,
  missionLevel = 1,
  timeRemaining,
}: PauseOverlayProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="bg-card/95 border border-primary/30 rounded-2xl p-6 md:p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Pause className="h-6 w-6 text-primary" />
          </div>
        </div>

        <h2 className="font-display text-2xl font-bold text-center text-foreground uppercase tracking-wider mb-2">
          Game Paused
        </h2>

        {/* Mission Info */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Mission</span>
            <span className="text-sm font-bold text-foreground">{missionName}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Level</span>
            <span className="text-sm font-bold text-primary">{missionLevel}</span>
          </div>
          {timeRemaining !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Time Left</span>
              <span className="text-sm font-bold text-amber-400">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="cyber"
            size="lg"
            className="w-full h-14 text-lg"
            onPointerDown={(e) => {
              e.stopPropagation();
              onResume();
            }}
          >
            <Play className="h-5 w-5 mr-3" />
            Resume Game
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full h-12 border-destructive/50 text-destructive hover:bg-destructive/10"
            onPointerDown={(e) => {
              e.stopPropagation();
              onExit();
            }}
          >
            <DoorOpen className="h-5 w-5 mr-2" />
            Exit Mission
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Tap Resume to continue playing
        </p>
      </div>
    </div>
  );
}
