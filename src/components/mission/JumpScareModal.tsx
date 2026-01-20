import { useEffect, useState, useRef } from 'react';
import { Skull, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jumpscareVideo from '@/assets/jumpscare-video.mp4';

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
  const [showVideo, setShowVideo] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Immediately show scary video
      setShowVideo(true);
      setShowMessage(false);
      
      // Play video from start
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
      
      // After 7 seconds, show the message
      const timer = setTimeout(() => {
        setShowMessage(true);
        setShowVideo(false);
      }, 7000);
      
      return () => clearTimeout(timer);
    } else {
      setShowVideo(false);
      setShowMessage(false);
    }
  }, [isOpen]);

  // Also handle video timeupdate to stop at 7 seconds
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= 7) {
        video.pause();
        setShowMessage(true);
        setShowVideo(false);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black"
      style={{ touchAction: 'manipulation' }}
      data-control-ignore="true"
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Scary Video Jump Scare - First 7 seconds */}
      {showVideo && !showMessage && (
        <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in-150 duration-200">
          <video
            ref={videoRef}
            src={jumpscareVideo}
            className="w-full h-full object-cover"
            autoPlay
            muted={false}
            playsInline
            webkit-playsinline="true"
          />
          
          {/* Scary text overlay */}
          <div className="absolute bottom-16 sm:bottom-20 left-0 right-0 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-red-500 animate-pulse drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
              GOTCHA!
            </h1>
          </div>
        </div>
      )}
      
      {/* Message after jump scare video */}
      {showMessage && (
        <div className="bg-gradient-to-b from-red-950 to-black border-2 border-red-500/50 rounded-2xl p-5 sm:p-8 shadow-2xl max-w-md w-[92vw] sm:w-[90vw] text-center animate-in fade-in-0 duration-500 mx-4">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-900/50 border-2 border-red-500/50 flex items-center justify-center mb-4 sm:mb-6">
            <Skull className="h-8 w-8 sm:h-10 sm:w-10 text-red-400" />
          </div>
          
          {/* Title */}
          <h2 className="font-display text-xl sm:text-3xl font-bold uppercase tracking-wider text-red-400 mb-2 sm:mb-3">
            TRAP SPRUNG!
          </h2>
          
          {/* Message */}
          <p className="text-gray-200/80 text-sm sm:text-lg mb-3 sm:mb-4">
            A zombie was waiting inside the shop!
          </p>
          
          {/* Lesson */}
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 sm:p-4 mb-5 sm:mb-8">
            <p className="text-yellow-300 text-xs sm:text-sm font-medium">
              💡 Lesson: Pay attention the first time! You only get one safe visit to check the shop.
            </p>
          </div>
          
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
      )}
    </div>
  );
}
