import { useRef, useState, useEffect } from 'react';

type MobileControlsProps = {
  onJoystickMove: (x: number, y: number) => void;
  onCameraMove: (deltaX: number, deltaY: number) => void;
  onJump?: () => void;
};

const MobileControls = ({ onJoystickMove, onCameraMove, onJump }: MobileControlsProps) => {
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [jumpPressed, setJumpPressed] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const jumpFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track active touches by ID
  const joystickTouchIdRef = useRef<number | null>(null);
  const cameraTouchIdRef = useRef<number | null>(null);
  const lastCameraPosRef = useRef<{ x: number; y: number } | null>(null);
  const joystickStartRef = useRef<{ x: number; y: number } | null>(null);

  const JOYSTICK_RADIUS = 56; // half of 112px (w-28)

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      const screenWidth = window.innerWidth;
      
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const { clientX, clientY, identifier } = touch;
        
        // Left half = joystick area
        if (clientX < screenWidth / 2 && joystickTouchIdRef.current === null) {
          joystickTouchIdRef.current = identifier;
          joystickStartRef.current = { x: clientX, y: clientY };
          setJoystickPos({ x: 0, y: 0 });
          onJoystickMove(0, 0);
        }
        // Right half = camera area
        else if (clientX >= screenWidth / 2 && cameraTouchIdRef.current === null) {
          cameraTouchIdRef.current = identifier;
          lastCameraPosRef.current = { x: clientX, y: clientY };
        }
      }
      
      // Prevent scrolling when touch starts on game area
      e.preventDefault();
    };

    const handleTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const { clientX, clientY, identifier } = touch;
        
        // Handle joystick
        if (identifier === joystickTouchIdRef.current && joystickStartRef.current) {
          const deltaX = clientX - joystickStartRef.current.x;
          const deltaY = clientY - joystickStartRef.current.y;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const maxDistance = JOYSTICK_RADIUS;
          const clampedDistance = Math.min(distance, maxDistance);
          const angle = Math.atan2(deltaY, deltaX);
          
          const normalizedX = (clampedDistance / maxDistance) * Math.cos(angle);
          const normalizedY = (clampedDistance / maxDistance) * Math.sin(angle);
          
          setJoystickPos({ 
            x: normalizedX * 30, 
            y: normalizedY * 30 
          });
          
          onJoystickMove(normalizedX, -normalizedY);
        }
        
        // Handle camera - PUBG style: drag right = rotate camera right (azimuth increases)
        if (identifier === cameraTouchIdRef.current && lastCameraPosRef.current) {
          const deltaX = clientX - lastCameraPosRef.current.x;
          const deltaY = clientY - lastCameraPosRef.current.y;
          
          // Negative deltaX for natural camera rotation (drag left = look left)
          onCameraMove(-deltaX * 0.012, deltaY * 0.008);
          lastCameraPosRef.current = { x: clientX, y: clientY };
        }
      }
      
      // Prevent scrolling during game touch
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const { identifier } = e.changedTouches[i];
        
        if (identifier === joystickTouchIdRef.current) {
          joystickTouchIdRef.current = null;
          joystickStartRef.current = null;
          setJoystickPos({ x: 0, y: 0 });
          onJoystickMove(0, 0);
        }
        
        if (identifier === cameraTouchIdRef.current) {
          cameraTouchIdRef.current = null;
          lastCameraPosRef.current = null;
        }
      }
    };

    // Attach to container element with passive: false to prevent scrolling
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onJoystickMove, onCameraMove]);

  useEffect(() => {
    return () => {
      if (jumpFeedbackTimeoutRef.current) {
        clearTimeout(jumpFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const triggerJump = () => {
    if (jumpFeedbackTimeoutRef.current) {
      clearTimeout(jumpFeedbackTimeoutRef.current);
    }

    setJumpPressed(true);
    onJump?.();

    jumpFeedbackTimeoutRef.current = setTimeout(() => {
      setJumpPressed(false);
    }, 140);
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-x-0 bottom-0 h-2/3"
      style={{ zIndex: 50, touchAction: 'none' }}
    >
      <div className="pointer-events-none absolute bottom-5 left-4 flex items-end gap-6">
        {/* Left side - Joystick visual */}
        <div
          ref={joystickRef}
          className="pointer-events-auto h-24 w-24 rounded-full border-2 border-white/40 bg-black/50"
        >
          <div
            ref={knobRef}
            className="absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 bg-white/60 shadow-lg"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`,
            }}
          />
        </div>

        {/* Jump button close to movement controls */}
        <button
          type="button"
          aria-label="Jump"
          onClick={triggerJump}
          onTouchStart={(e) => {
            e.preventDefault();
            triggerJump();
          }}
          onTouchEnd={() => setJumpPressed(false)}
          className={`pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full border text-sm font-bold shadow-[0_10px_25px_rgba(0,0,0,0.35)] transition-transform duration-150 ${
            jumpPressed
              ? 'scale-95 border-white/80 bg-amber-300 ring-4 ring-white/70 ring-offset-2 ring-offset-amber-200'
              : 'border-white/70 bg-amber-200/90 ring-2 ring-white/40'
          }`}
        >
          Jump
        </button>
      </div>

      {/* Right side - Actions */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
        <div className="rounded-lg bg-black/40 px-2 py-1 text-[10px] text-white/60 shadow-inner">
          Drag to look
        </div>
      </div>
    </div>
  );
};

export default MobileControls;
