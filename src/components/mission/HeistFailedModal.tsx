import { XOctagon } from 'lucide-react';
import { HeistFailReason } from '@/stores/heistStore';

interface HeistFailedModalProps {
  isOpen: boolean;
  reason: HeistFailReason | null;
  onRetry: () => void;
  onExit: () => void;
}

export default function HeistFailedModal({ isOpen, reason, onRetry, onExit }: HeistFailedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-red-950/90 border border-red-500/40 rounded-xl w-[90vw] max-w-md p-5 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <XOctagon className="h-6 w-6 text-red-400" />
          <h3 className="font-display text-lg font-bold uppercase tracking-wider text-red-300">
            Heist Failed
          </h3>
        </div>
        <p className="text-sm text-red-200 mb-5">
          Security caught you ({reason ?? 'unknown'}). Try again with a cleaner route.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 py-2 rounded-lg bg-red-500/80 text-white font-bold touch-manipulation active:scale-95"
            onPointerDown={(event) => {
              event.stopPropagation();
              onRetry();
            }}
          >
            Retry
          </button>
          <button
            type="button"
            className="flex-1 py-2 rounded-lg border border-red-400/60 text-red-100 font-bold touch-manipulation active:scale-95"
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
