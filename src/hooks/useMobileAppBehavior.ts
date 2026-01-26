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
  useEffect(() => {
    if (!isMobile || !isGameActive) return;

    // Prevent pinch zoom
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    // Prevent pull-to-refresh
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        // If touching near top of screen, prevent pull-to-refresh
        if (touch.clientY < 50 && window.scrollY === 0) {
          e.preventDefault();
        }
      }
    };

    // Prevent gesture events (Safari)
    const handleGestureStart = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
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
