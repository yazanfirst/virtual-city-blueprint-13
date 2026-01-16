import { Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MissionFailedModalProps {
  isOpen: boolean;
  onRetry: () => void;
  onExit: () => void;
}

export default function MissionFailedModal({
  isOpen,
  onRetry,
  onExit,
}: MissionFailedModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden bg-gradient-to-b from-red-950 to-slate-950 border-red-500/50"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="bg-red-900/50 px-6 py-4 border-b border-red-500/30">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 border border-red-500/40">
                <Skull className="h-5 w-5 text-red-400" />
              </div>
              <DialogTitle className="font-display text-lg font-bold text-white uppercase tracking-wider">
                Mission Failed
              </DialogTitle>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <p className="text-white text-base font-medium leading-relaxed">
              The zombies got you. Do you want to try again or exit?
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={onRetry}
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              className="w-full border-red-500/40 text-red-200 hover:bg-red-900/40"
              onClick={onExit}
            >
              Exit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
