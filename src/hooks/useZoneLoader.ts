import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ZONES_CONFIG, ZoneConfig } from '@/config/zones.config';

type LoadingState = {
  isLoading: boolean;
  zoneId: string | null;
  message: string;
};

/**
 * Shared zone loader hook
 * 
 * Used by:
 * 1. Gate trigger (inside city) - automatic loading when player walks through gate
 * 2. Outside access (2D map/menu) - manual navigation to zone
 * 
 * Both paths use the same loading logic and navigate to the same route.
 */
export function useZoneLoader() {
  const navigate = useNavigate();
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    zoneId: null,
    message: '',
  });

  /**
   * Load a zone by its ID
   * @param zoneId - The zone identifier from zones.config.ts
   * @param source - Where the load was triggered from (for analytics later)
   */
  const loadZone = useCallback((zoneId: string, source: 'gate' | 'menu' | 'map') => {
    const zone = ZONES_CONFIG[zoneId];
    
    if (!zone) {
      console.warn(`Zone not found: ${zoneId}`);
      return;
    }

    if (!zone.isActive) {
      console.warn(`Zone not active: ${zoneId}`);
      return;
    }

    // Set loading state
    setLoadingState({
      isLoading: true,
      zoneId,
      message: `Loading ${zone.name}…`,
    });

    // Small delay for loading UI to show, then navigate
    // The state passed tells StreetView this came from outside (menu/map) vs gate
    setTimeout(() => {
      navigate(zone.route, {
        state: {
          outsideEntry: source !== 'gate',
          fromSource: source,
        },
      });
      
      // Reset loading after navigation
      setLoadingState({
        isLoading: false,
        zoneId: null,
        message: '',
      });
    }, source === 'gate' ? 100 : 300);
  }, [navigate]);

  /**
   * Check if player is in any gate trigger zone
   * Returns the zone config if player is in a gate, null otherwise
   */
  const checkGateTrigger = useCallback((playerX: number, playerZ: number): ZoneConfig | null => {
    for (const zone of Object.values(ZONES_CONFIG)) {
      if (!zone.isActive) continue;
      
      const { minX, maxX, minZ, maxZ } = zone.gateTriggerBounds;
      if (playerX >= minX && playerX <= maxX && playerZ >= minZ && playerZ <= maxZ) {
        return zone;
      }
    }
    return null;
  }, []);

  /**
   * Get zone config by ID
   */
  const getZone = useCallback((zoneId: string): ZoneConfig | undefined => {
    return ZONES_CONFIG[zoneId];
  }, []);

  return {
    loadZone,
    checkGateTrigger,
    getZone,
    isLoading: loadingState.isLoading,
    loadingMessage: loadingState.message,
    loadingZoneId: loadingState.zoneId,
  };
}

export default useZoneLoader;
