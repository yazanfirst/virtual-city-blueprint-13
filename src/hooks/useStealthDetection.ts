import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useHeistStore } from '@/stores/heistStore';

export function useStealthDetection() {
  const playerPosition = usePlayerStore((state) => state.position);
  const {
    drones,
    updateDetection,
    alertDrone,
    equipment,
    isHidden,
    phase,
  } = useHeistStore();

  const lastPositionRef = useRef<[number, number, number] | null>(null);

  useEffect(() => {
    if (phase !== 'infiltrating' && phase !== 'escaping') return;

    const interval = setInterval(() => {
      const lastPosition = lastPositionRef.current ?? playerPosition;
      const velocity = Math.hypot(
        playerPosition[0] - lastPosition[0],
        playerPosition[2] - lastPosition[2]
      );
      lastPositionRef.current = playerPosition;

      let maxDetection = 0;
      drones.forEach((drone) => {
        const dx = playerPosition[0] - drone.position[0];
        const dz = playerPosition[2] - drone.position[2];
        const distance = Math.hypot(dx, dz);
        if (distance > drone.detectionRange) return;

        const movementFactor = equipment.silentFootsteps ? 0.2 : velocity > 0.1 ? 2 : 0.5;
        const hiddenModifier = isHidden ? -1 : 1;
        const detectionDelta = movementFactor * hiddenModifier * (1 - distance / drone.detectionRange) * 8;
        maxDetection = Math.max(maxDetection, Math.min(100, detectionDelta + maxDetection));

        if (maxDetection >= 100) {
          alertDrone(drone.id);
        }
      });

      updateDetection(maxDetection);
    }, 150);

    return () => clearInterval(interval);
  }, [phase, drones, playerPosition, isHidden, equipment.silentFootsteps, updateDetection, alertDrone]);
}
