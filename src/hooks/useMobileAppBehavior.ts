import { useEffect, useCallback } from 'react';
import { useDeviceType } from './useDeviceType';

/**
 * Hook that makes the app behave like a native mobile app:
 * - Prevents pinch-to-zoom
 * - Handles safe areas (notch)
 * - Sets proper viewport height for mobile browsers (100vh fix)
 * - Prevents pull-to-refresh
 * - Prevents double-tap zoom
 */
export function useMobileAppBehavior(isGameActive: boolean = false) {
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';

  // Fix 100vh issue on mobile browsers (address bar)
  const updateViewportHeight = useCallback(() => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
  }, []);

  useEffect(() => {
    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', () => {
      // Delay to let the browser settle after orientation change
      setTimeout(updateViewportHeight, 100);
    });

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
    };
  }, [updateViewportHeight]);

  // Prevent zoom gestures and pull-to-refresh when game is active
  // IMPORTANT: Only block gestures that aren't part of game controls (pinch zoom, double-tap)
  // Single-finger drags are used for camera rotation and must NOT be blocked
  useEffect(() => {
    if (!isMobile || !isGameActive) return;

    // Only prevent pinch zoom (2+ fingers) - single finger drags are for camera rotation
    const handleTouchMove = (e: TouchEvent) => {
      // Only block multi-touch (pinch zoom) - NOT single touch (camera rotation)
      if (e.touches.length > 1) {
        e.preventDefault();
      }
      // Do NOT prevent default for single-touch moves - needed for camera rotation
    };

    // Prevent double-tap zoom - but only on non-interactive elements
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      // Allow double-tap on buttons and interactive elements
      if (target?.closest('button, [role="button"], a, input, [data-control-ignore]')) {
        return;
      }
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    // Prevent pull-to-refresh only at very top of screen
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        // Only prevent if touching very close to top AND scrolled to top
        if (touch.clientY < 30 && window.scrollY === 0) {
          e.preventDefault();
        }
      }
    };

    // Prevent Safari gesture events (pinch/rotate)
    const handleGestureStart = (e: Event) => {
      e.preventDefault();
    };

    // Use capture phase with lower priority so game controls can handle first
    document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false, capture: false });
    document.addEventListener('touchstart', handleTouchStart, { passive: false, capture: false });
    document.addEventListener('gesturestart', handleGestureStart);
    document.addEventListener('gesturechange', handleGestureStart);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('gesturestart', handleGestureStart);
      document.removeEventListener('gesturechange', handleGestureStart);
    };
  }, [isMobile, isGameActive]);

  // Add body class for mobile styling
  useEffect(() => {
    if (isMobile) {
      document.body.classList.add('is-mobile-device');
      if (isGameActive) {
        document.body.classList.add('game-active');
      } else {
        document.body.classList.remove('game-active');
      }
    } else {
      document.body.classList.remove('is-mobile-device', 'game-active');
    }

    return () => {
      document.body.classList.remove('is-mobile-device', 'game-active');
    };
  }, [isMobile, isGameActive]);

  return { isMobile };
}
