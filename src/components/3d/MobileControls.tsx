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

  const JOYSTICK_RADIUS = 56;
  const JOYSTICK_HANDLE_RADIUS = 24;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement)?.closest('[data-control-ignore="true"]')) {
        return;
      }

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
          const clampedDistance = Math.min(distance, maxDistance - JOYSTICK_HANDLE_RADIUS);
          const angle = Math.atan2(deltaY, deltaX);

          const normalizedX = (clampedDistance / maxDistance) * Math.cos(angle);
          const normalizedY = (clampedDistance / maxDistance) * Math.sin(angle);

          setJoystickPos({
            x: normalizedX * (maxDistance - JOYSTICK_HANDLE_RADIUS),
            y: normalizedY * (maxDistance - JOYSTICK_HANDLE_RADIUS)
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
      className="absolute inset-0"
      style={{ zIndex: 50, touchAction: 'none' }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-none absolute bottom-6 left-5 flex items-center gap-5">
          {/* Left side - Joystick visual */}
          <div
            ref={joystickRef}
            className="pointer-events-auto h-28 w-28 rounded-full border-2 border-white/35 bg-black/45 backdrop-blur-sm"
          >
            <div
              ref={knobRef}
              className="absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 bg-white/70 shadow-lg"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`,
              }}
            />
          </div>
        </div>

        {/* Right side - Jump button and look hint */}
        <div className="pointer-events-none absolute bottom-6 right-5 flex flex-col items-end gap-2">
          <button
            type="button"
            aria-label="Jump"
            data-control-ignore="true"
            onClick={triggerJump}
            onTouchStart={(e) => {
              e.preventDefault();
              triggerJump();
            }}
            onTouchEnd={() => setJumpPressed(false)}
            className={`pointer-events-auto flex h-20 w-20 items-center justify-center rounded-full border text-base font-bold shadow-[0_12px_30px_rgba(0,0,0,0.4)] transition duration-150 ${
              jumpPressed
                ? 'scale-95 border-white/80 bg-amber-300 ring-4 ring-white/70 ring-offset-2 ring-offset-amber-200'
                : 'border-white/70 bg-amber-200/95 ring-2 ring-white/40'
            }`}
          >
            Jump
          </button>
          <div className="pointer-events-none rounded-lg bg-black/45 px-2 py-1 text-[10px] text-white/60 shadow-inner backdrop-blur-sm">
            Drag to look
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileControls;
