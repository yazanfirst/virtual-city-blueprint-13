import { CheckCircle2 } from 'lucide-react';

interface HeistCompleteModalProps {
  isOpen: boolean;
  onReplay: () => void;
  onExit: () => void;
}

export default function HeistCompleteModal({ isOpen, onReplay, onExit }: HeistCompleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-emerald-950/90 border border-emerald-500/40 rounded-xl w-[90vw] max-w-md p-5 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-300" />
          <h3 className="font-display text-lg font-bold uppercase tracking-wider text-emerald-200">
            Heist Complete
          </h3>
        </div>
        <p className="text-sm text-emerald-100 mb-5">
          Target secured. Security is scrambling—collect your reward and plan the next run.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 py-2 rounded-lg bg-emerald-500/80 text-white font-bold touch-manipulation active:scale-95"
            onPointerDown={(event) => {
              event.stopPropagation();
              onReplay();
            }}
          >
            Replay
          </button>
          <button
            type="button"
            className="flex-1 py-2 rounded-lg border border-emerald-400/60 text-emerald-100 font-bold touch-manipulation active:scale-95"
            onPointerDown={(event) => {
              event.stopPropagation();
              onExit();
            }}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
