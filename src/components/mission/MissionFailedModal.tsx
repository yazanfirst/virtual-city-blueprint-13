import { X, RotateCcw, Home, Zap, Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MissionFailReason } from '@/stores/missionStore';

interface MissionFailedModalProps {
  isOpen: boolean;
  failReason: MissionFailReason;
  onRetry: () => void;
  onExit: () => void;
}

const getFailMessage = (reason: MissionFailReason) => {
  switch (reason) {
    case 'zombie':
      return {
        icon: Skull,
        title: 'Caught by Zombies!',
        message: 'The zombies got you. Better luck next time!',
        iconColor: 'text-green-400',
        bgColor: 'from-green-950',
        borderColor: 'border-green-500/50',
      };
    case 'laser':
      return {
        icon: Zap,
        title: 'Burned by Laser!',
        message: 'The laser beams drained all your life. Try jumping over them!',
        iconColor: 'text-red-400',
        bgColor: 'from-red-950',
        borderColor: 'border-red-500/50',
      };
    case 'thorns':
      return {
        icon: X,
        title: 'Pierced by Thorns!',
        message: 'The thorns traps got you. Watch for the opening and closing pattern!',
        iconColor: 'text-orange-400',
        bgColor: 'from-orange-950',
        borderColor: 'border-orange-500/50',
      };
    default:
      return {
        icon: X,
        title: 'Mission Failed',
        message: 'Something went wrong. Try again!',
        iconColor: 'text-red-400',
        bgColor: 'from-red-950',
        borderColor: 'border-red-500/50',
      };
  }
};

export default function MissionFailedModal({
  isOpen,
  failReason,
  onRetry,
  onExit,
}: MissionFailedModalProps) {
  if (!isOpen) return null;
  
  const { icon: Icon, title, message, iconColor, bgColor, borderColor } = getFailMessage(failReason);
  
  return (
    <div 
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`bg-gradient-to-b ${bgColor} to-black border-2 ${borderColor} rounded-2xl p-8 shadow-2xl max-w-md w-[90vw] text-center animate-in zoom-in-95 duration-300`}>
        {/* Icon */}
        <div className={`mx-auto w-20 h-20 rounded-full bg-black/50 border-2 ${borderColor} flex items-center justify-center mb-6`}>
          <Icon className={`h-10 w-10 ${iconColor}`} />
        </div>
        
        {/* Title */}
        <h2 className={`font-display text-3xl font-bold uppercase tracking-wider ${iconColor} mb-3`}>
          {title}
        </h2>
        
        {/* Message */}
        <p className="text-gray-200/80 text-lg mb-8">
          {message}
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
            className="border-gray-500/50 text-gray-300 hover:bg-gray-900/50 px-6 py-3 text-lg"
          >
            <Home className="h-5 w-5 mr-2" />
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
