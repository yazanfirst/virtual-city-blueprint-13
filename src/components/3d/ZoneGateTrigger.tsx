/**
 * ZoneGateTrigger - Invisible collision detection for zone loading
 * 
 * This component monitors player position and triggers zone loading
 * when the player walks through a gate area (no click required).
 * 
 * Used in the main CityScene to detect when player approaches zone gates.
 */

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { ZONES_CONFIG, ZoneConfig } from '@/config/zones.config';

type ZoneGateTriggerProps = {
  onEnterZone: (zone: ZoneConfig) => void;
  /** Zones to exclude from detection (e.g., if already in that zone) */
  excludeZones?: string[];
  /** Debounce time in ms to prevent rapid re-triggers */
  debounceMs?: number;
};

export function ZoneGateTrigger({
  onEnterZone,
  excludeZones = [],
  debounceMs = 500,
}: ZoneGateTriggerProps) {
  const playerPosition = usePlayerStore((state) => state.position);
  const lastTriggerRef = useRef<number>(0);
  const triggeredZoneRef = useRef<string | null>(null);

  useEffect(() => {
    const [x, , z] = playerPosition;
    const now = Date.now();

    // Check all active zones
    for (const zone of Object.values(ZONES_CONFIG)) {
      // Skip inactive zones or excluded zones
      if (!zone.isActive || excludeZones.includes(zone.zoneId)) continue;

      const { minX, maxX, minZ, maxZ } = zone.gateTriggerBounds;
      const isInBounds = x >= minX && x <= maxX && z >= minZ && z <= maxZ;

      if (isInBounds) {
        // Debounce: don't re-trigger the same zone within debounce period
        if (
          triggeredZoneRef.current === zone.zoneId &&
          now - lastTriggerRef.current < debounceMs
        ) {
          return;
        }

        // Trigger zone load
        triggeredZoneRef.current = zone.zoneId;
        lastTriggerRef.current = now;
        onEnterZone(zone);
        return;
      }
    }

    // Reset triggered zone if player left all gate areas
    const isInAnyGate = Object.values(ZONES_CONFIG).some((zone) => {
      if (!zone.isActive || excludeZones.includes(zone.zoneId)) return false;
      const { minX, maxX, minZ, maxZ } = zone.gateTriggerBounds;
      return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
    });

    if (!isInAnyGate) {
      triggeredZoneRef.current = null;
    }
  }, [playerPosition, onEnterZone, excludeZones, debounceMs]);

  // This component doesn't render anything - it's pure logic
  return null;
}

export default ZoneGateTrigger;
