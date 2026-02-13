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
  const jumpButtonRef = useRef<HTMLButtonElement>(null);
  const jumpFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track active touches by ID
  const joystickTouchIdRef = useRef<number | null>(null);
  const cameraTouchIdRef = useRef<number | null>(null);
  const lastCameraPosRef = useRef<{ x: number; y: number } | null>(null);
  const cameraDragActiveRef = useRef(false);
  const joystickStartRef = useRef<{ x: number; y: number } | null>(null);

  const JOYSTICK_RADIUS = 56;
  const JOYSTICK_HANDLE_RADIUS = 24;

  useEffect(() => {
    const isWithinJoystick = (clientX: number, clientY: number) => {
      const joystickEl = joystickRef.current;
      if (!joystickEl) return false;
      const rect = joystickEl.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      return Math.sqrt(dx * dx + dy * dy) <= JOYSTICK_RADIUS;
    };

    const isInteractiveTarget = (target: HTMLElement | null) => {
      if (!target) return false;
      return Boolean(
        target.closest(
          'button, [role="button"], a, input, textarea, select, [data-control-ignore="true"]'
        )
      );
    };

    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const { clientX, clientY, identifier } = touch;
        const touchTarget = touch.target as HTMLElement | null;

        // Ignore touches that start on other UI so they propagate normally
        const isJumpButtonTouch = !!(touchTarget && jumpButtonRef.current && jumpButtonRef.current.contains(touchTarget));
        const isControlIgnored = !!touchTarget?.closest('[data-control-ignore="true"]');

        if (!isJumpButtonTouch && !isControlIgnored && isWithinJoystick(clientX, clientY) && joystickTouchIdRef.current === null) {
          joystickTouchIdRef.current = identifier;
          joystickStartRef.current = { x: clientX, y: clientY };
          setJoystickPos({ x: 0, y: 0 });
          onJoystickMove(0, 0);
          e.preventDefault();
          continue;
        }

        // Start camera tracking when touching NON-interactive areas.
        // (Some HUD overlays may sit above the canvas; relying on `closest('canvas')`
        // can fail on mobile. We instead exclude interactive UI.)
        const isInteractive = isJumpButtonTouch || isControlIgnored || isInteractiveTarget(touchTarget);
        if (!isInteractive && cameraTouchIdRef.current === null) {
          cameraTouchIdRef.current = identifier;
          lastCameraPosRef.current = { x: clientX, y: clientY };
          cameraDragActiveRef.current = false;
        }
      }
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
          const distanceMoved = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          // Lower threshold for better tap detection on mobile (6px instead of 12)
          if (!cameraDragActiveRef.current && distanceMoved > 6) {
            cameraDragActiveRef.current = true;
            lastCameraPosRef.current = { x: clientX, y: clientY };
          }

          if (cameraDragActiveRef.current) {
            // Negative deltaX for natural camera rotation (drag left = look left)
            onCameraMove(-deltaX * 0.012, deltaY * 0.008);
            lastCameraPosRef.current = { x: clientX, y: clientY };
          }
        }
      }

      if (
        (joystickTouchIdRef.current !== null && joystickStartRef.current !== null) ||
        (cameraTouchIdRef.current !== null && cameraDragActiveRef.current)
      ) {
        e.preventDefault();
      }
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
          cameraDragActiveRef.current = false;
        }
      }
    };

    // Attach to window so the overlay doesn't block UI interactions
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
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
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 250 }}
    >
      <div className="pointer-events-none absolute inset-0">
        {/* Left side - Joystick visual - BIGGER for mobile */}
        <div className="mobile-controls__joystick pointer-events-none absolute bottom-6 left-6 landscape:bottom-4 landscape:left-4 flex items-center gap-5">
          <div
            ref={joystickRef}
            className="pointer-events-auto h-28 w-28 landscape:h-24 landscape:w-24 rounded-full border-2 border-white/40 bg-black/50 backdrop-blur-sm"
          >
            <div
              ref={knobRef}
              className="absolute h-12 w-12 landscape:h-10 landscape:w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 bg-white/75 shadow-lg"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`,
              }}
            />
          </div>
        </div>

        {/* Right side - Jump button - BIGGER for mobile */}
        <div className="mobile-controls__jump pointer-events-none absolute bottom-6 right-6 landscape:bottom-4 landscape:right-4 flex flex-col items-end gap-2">
          <button
            type="button"
            aria-label="Jump"
            data-control-ignore="true"
            ref={jumpButtonRef}
            onClick={triggerJump}
            onTouchStart={(e) => {
              e.preventDefault();
              triggerJump();
            }}
            onTouchEnd={() => setJumpPressed(false)}
            className={`mobile-controls__jump-button pointer-events-auto flex items-center justify-center rounded-full border-2 text-sm font-bold shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition duration-150 ${
              jumpPressed
                ? 'scale-95 border-white/90 bg-amber-300 ring-4 ring-white/70 ring-offset-2 ring-offset-amber-200'
                : 'border-white/70 bg-amber-200/95 ring-2 ring-white/50'
            }`}
          >
            Jump
          </button>
          <div className="pointer-events-none rounded-lg bg-black/50 px-2 py-1 text-[10px] text-white/70 shadow-inner backdrop-blur-sm landscape:hidden">
            Drag to look around
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileControls;
