import { X, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gradient-to-b from-red-950 to-black border-2 border-red-500/50 rounded-2xl p-8 shadow-2xl max-w-md w-[90vw] text-center animate-in zoom-in-95 duration-300">
        {/* Skull Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-red-900/50 border-2 border-red-500/50 flex items-center justify-center mb-6">
          <X className="h-10 w-10 text-red-400" />
        </div>
        
        {/* Title */}
        <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-red-400 mb-3">
          Mission Failed
        </h2>
        
        {/* Message */}
        <p className="text-red-200/80 text-lg mb-8">
          The zombies caught you. Better luck next time!
        </p>
        
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={onRetry}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 text-lg"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={onExit}
            className="border-red-500/50 text-red-300 hover:bg-red-900/50 px-6 py-3 text-lg"
          >
            <Home className="h-5 w-5 mr-2" />
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
