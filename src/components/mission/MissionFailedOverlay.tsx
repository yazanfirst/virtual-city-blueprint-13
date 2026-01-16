import { Skull, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export type MissionFailReason = "zombie" | "laser" | "unknown";

interface MissionFailedOverlayProps {
  open: boolean;
  reason?: MissionFailReason;
  onRetry: () => void;
  onExit: () => void;
}

const copyByReason: Record<MissionFailReason, { title: string; body: string; Icon: typeof Skull }> = {
  zombie: {
    title: "ZOMBIES GOT YOU",
    body: "No escape. They caught your scent.",
    Icon: Skull,
  },
  laser: {
    title: "LASER HIT",
    body: "You lost all 3 hearts.",
    Icon: Zap,
  },
  unknown: {
    title: "MISSION FAILED",
    body: "Try again.",
    Icon: Skull,
  },
};

export default function MissionFailedOverlay({
  open,
  reason = "unknown",
  onRetry,
  onExit,
}: MissionFailedOverlayProps) {
  if (!open) return null;

  const { title, body, Icon } = copyByReason[reason] ?? copyByReason.unknown;

  return (
    <div
      className="absolute inset-0 pointer-events-auto flex items-center justify-center bg-background/70 backdrop-blur-sm"
      style={{ zIndex: 260 }}
      role="dialog"
      aria-modal="true"
      aria-label="Mission failed"
    >
      <div className="w-[92vw] max-w-md rounded-xl border border-border bg-card/95 p-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 border border-destructive/30">
            <Icon className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-wider text-destructive">
              {title}
            </p>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="destructive" onClick={onRetry}>
            Play Again
          </Button>
          <Button variant="outline" onClick={onExit}>
            Exit
          </Button>
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">
          Tip: avoid lasers (they remove 1 heart each hit). Zombies end the mission instantly.
        </p>
      </div>
    </div>
  );
}
