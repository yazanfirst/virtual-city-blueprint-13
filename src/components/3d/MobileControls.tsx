import { useRef, useState, useEffect } from 'react';

type MobileControlsProps = {
  onJoystickMove: (x: number, y: number) => void;
  onCameraMove: (deltaX: number, deltaY: number) => void;
  onJump?: () => void;
};

const MobileControls = ({ onJoystickMove, onCameraMove, onJump }: MobileControlsProps) => {
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
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

  return (
    <div 
      ref={containerRef}
      className="absolute inset-x-0 bottom-0 h-2/3"
      style={{ zIndex: 50, touchAction: 'none' }}
    >
      {/* Left side - Joystick visual */}
      <div
        ref={joystickRef}
        className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-black/50 border-2 border-white/40"
      >
        <div
          ref={knobRef}
          className="absolute w-10 h-10 rounded-full bg-white/60 border-2 border-white/80 shadow-lg"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`,
          }}
        />
      </div>

      {/* Right side - Actions */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => onJump?.()}
          onTouchStart={(e) => {
            e.preventDefault();
            onJump?.();
          }}
          className="px-4 py-2 rounded-full bg-white/80 text-black text-xs font-semibold shadow-lg active:scale-95"
        >
          Jump
        </button>
        <div className="bg-black/40 rounded-lg px-2 py-1 text-white/50 text-[10px]">
          Drag to look
        </div>
      </div>
    </div>
  );
};

export default MobileControls;
