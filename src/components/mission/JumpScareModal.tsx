import { useEffect, useState } from 'react';
import { Skull, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JumpScareModalProps {
  isOpen: boolean;
  onRetry: () => void;
  onExit: () => void;
}

export default function JumpScareModal({
  isOpen,
  onRetry,
  onExit,
}: JumpScareModalProps) {
  const [showZombie, setShowZombie] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      // Immediately show scary zombie
      setShowZombie(true);
      
      // After 1.5 seconds, show the message
      const timer = setTimeout(() => {
        setShowMessage(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      setShowZombie(false);
      setShowMessage(false);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Scary Zombie Face Jump Scare */}
      {showZombie && !showMessage && (
        <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in-150 duration-200">
          <div className="relative">
            {/* Glowing zombie face */}
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-b from-green-900 to-green-950 border-4 border-green-500 shadow-[0_0_100px_rgba(34,197,94,0.8)] flex items-center justify-center animate-pulse">
              <Skull className="h-32 w-32 md:h-40 md:w-40 text-green-400 drop-shadow-[0_0_30px_rgba(34,197,94,1)]" />
            </div>
            
            {/* Scary eyes */}
            <div className="absolute top-16 left-12 w-8 h-8 rounded-full bg-red-500 animate-ping" />
            <div className="absolute top-16 right-12 w-8 h-8 rounded-full bg-red-500 animate-ping" />
          </div>
          
          {/* Scary text */}
          <div className="absolute bottom-20 text-center">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-red-500 animate-pulse drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
              GOTCHA!
            </h1>
          </div>
        </div>
      )}
      
      {/* Message after jump scare */}
      {showMessage && (
        <div className="bg-gradient-to-b from-red-950 to-black border-2 border-red-500/50 rounded-2xl p-8 shadow-2xl max-w-md w-[90vw] text-center animate-in fade-in-0 duration-500">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-red-900/50 border-2 border-red-500/50 flex items-center justify-center mb-6">
            <Skull className="h-10 w-10 text-red-400" />
          </div>
          
          {/* Title */}
          <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-red-400 mb-3">
            TRAP SPRUNG!
          </h2>
          
          {/* Message */}
          <p className="text-gray-200/80 text-lg mb-4">
            A zombie was waiting inside the shop!
          </p>
          
          {/* Lesson */}
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-8">
            <p className="text-yellow-300 text-sm font-medium">
              💡 Lesson: Pay attention the first time! You only get one safe visit to check the shop.
            </p>
          </div>
          
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
      )}
    </div>
  );
}
