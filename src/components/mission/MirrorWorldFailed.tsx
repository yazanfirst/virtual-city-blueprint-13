import { AlertTriangle } from 'lucide-react';
import { useMirrorWorldStore } from '@/stores/mirrorWorldStore';

interface MirrorWorldFailedProps {
  isOpen: boolean;
  onRetry: () => void;
  onExit: () => void;
}

export default function MirrorWorldFailed({ isOpen, onRetry, onExit }: MirrorWorldFailedProps) {
  const { failReason } = useMirrorWorldStore();

  if (!isOpen) return null;

  const message =
    failReason === 'time'
      ? 'Time collapsed before you could escape.'
      : 'The shadow consumed your reflection.';

  return (
    <div
      className="mission-modal-overlay fixed inset-0 z-[220] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      data-control-ignore="true"
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="mission-modal-panel bg-slate-950/95 border border-red-500/40 rounded-xl p-6 max-w-sm mx-4 shadow-2xl text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <AlertTriangle className="h-6 w-6 text-red-400" />
          <h2 className="font-display text-lg font-bold text-red-300 uppercase tracking-wider">
            Mirror World Failed
          </h2>
        </div>
        <p className="text-sm text-red-100/80 mb-5">{message}</p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider transition-colors touch-manipulation active:scale-[0.98]"
          >
            Try Again
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onExit();
            }}
            className="w-full py-3 rounded-lg border border-red-500/50 text-red-200 hover:bg-red-950/40 font-bold uppercase tracking-wider transition-colors touch-manipulation active:scale-[0.98]"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
