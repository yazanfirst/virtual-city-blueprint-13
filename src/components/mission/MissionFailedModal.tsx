import { X, RotateCcw, Home, Zap, Skull, Clock } from 'lucide-react';
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
    case 'firepit':
      return {
        icon: Zap,
        title: 'Burned by Fire!',
        message: 'The fire pit burned you! Try jumping over them!',
        iconColor: 'text-red-400',
        bgColor: 'from-red-950',
        borderColor: 'border-red-500/50',
      };
    case 'axe':
      return {
        icon: X,
        title: 'Hit by Swinging Axe!',
        message: 'The swinging axe got you! Time your movement to pass through safely!',
        iconColor: 'text-gray-400',
        bgColor: 'from-gray-950',
        borderColor: 'border-gray-500/50',
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
    case 'time':
      return {
        icon: Clock,
        title: 'Time Ran Out!',
        message: 'You ran out of time. The zombies caught up to you.',
        iconColor: 'text-red-400',
        bgColor: 'from-red-950',
        borderColor: 'border-red-500/50',
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
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      style={{ touchAction: 'manipulation' }}
      data-control-ignore="true"
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`bg-gradient-to-b ${bgColor} to-black border-2 ${borderColor} rounded-2xl p-5 sm:p-8 shadow-2xl max-w-md w-full text-center animate-in zoom-in-95 duration-300`}>
        {/* Icon */}
        <div className={`mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/50 border-2 ${borderColor} flex items-center justify-center mb-4 sm:mb-6`}>
          <Icon className={`h-8 w-8 sm:h-10 sm:w-10 ${iconColor}`} />
        </div>
        
        {/* Title */}
        <h2 className={`font-display text-xl sm:text-3xl font-bold uppercase tracking-wider ${iconColor} mb-2 sm:mb-3`}>
          {title}
        </h2>
        
        {/* Message */}
        <p className="text-gray-200/80 text-sm sm:text-lg mb-5 sm:mb-8">
          {message}
        </p>
        
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
          <Button
            onPointerDown={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-lg touch-manipulation select-none active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Try Again
          </Button>
          <Button
            variant="outline"
            onPointerDown={(e) => {
              e.stopPropagation();
              onExit();
            }}
            className="border-gray-500/50 text-gray-300 hover:bg-gray-900/50 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-lg touch-manipulation select-none active:scale-[0.98]"
          >
            <Home className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
