import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useHeistStore } from '@/stores/heistStore';

const SYMBOLS = ['▲', '●', '■', '◆'];

export default function HackingMiniGame() {
  const {
    phase,
    hackSequence,
    playerSequence,
    inputHackKey,
    cancelHacking,
    updateDetection,
    detectionLevel,
  } = useHeistStore();
  const [timeLeft, setTimeLeft] = useState(12);

  useEffect(() => {
    if (phase !== 'hacking') return;
    setTimeLeft(12);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'hacking') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          updateDetection(detectionLevel + 30);
          cancelHacking();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, cancelHacking, updateDetection, detectionLevel]);

  if (phase !== 'hacking') return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-background/95 border border-amber-500/40 rounded-xl w-[90vw] max-w-md p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold uppercase tracking-wider text-amber-300">
            Security Bypass
          </h3>
          <button
            type="button"
            className="p-2 text-muted-foreground hover:text-foreground touch-manipulation"
            onPointerDown={(event) => {
              event.stopPropagation();
              cancelHacking();
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Target: <span className="text-foreground font-semibold">{hackSequence.join(' ')}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Input: <span className="text-foreground font-semibold">{playerSequence.join(' ') || '_'}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Time: <span className="text-foreground font-semibold">{timeLeft}s</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {SYMBOLS.map((symbol) => (
            <button
              key={symbol}
              type="button"
              className="py-2 rounded-lg border border-amber-500/40 text-amber-200 font-bold hover:bg-amber-500/20 touch-manipulation active:scale-95"
              onPointerDown={(event) => {
                event.stopPropagation();
                inputHackKey(symbol);
              }}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
