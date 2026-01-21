import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useHeistStore } from '@/stores/heistStore';

export function useStealthDetection() {
  const playerPosition = usePlayerStore((state) => state.position);
  const {
    drones,
    updateDetection,
    equipment,
    isHidden,
    phase,
    detectionLevel,
  } = useHeistStore();

  const lastPositionRef = useRef<[number, number, number] | null>(null);

  useEffect(() => {
    if (phase !== 'infiltrating' && phase !== 'escaping') return;

    const interval = setInterval(() => {
      const lastPosition = lastPositionRef.current ?? playerPosition;
      const velocityMagnitude = Math.hypot(
        playerPosition[0] - lastPosition[0],
        playerPosition[2] - lastPosition[2]
      );
      lastPositionRef.current = [...playerPosition] as [number, number, number];

      // Calculate detection based on all drones
      let maxDetectionIncrease = 0;
      let anyDroneDetecting = false;

      drones.forEach((drone) => {
        if (drone.isAlerted) return; // Already chasing

        const dx = playerPosition[0] - drone.position[0];
        const dz = playerPosition[2] - drone.position[2];
        const distance = Math.hypot(dx, dz);

        if (distance > drone.detectionRange) return;

        // Calculate angle to player from drone's position
        const angleToPlayer = Math.atan2(dx, dz);
        const droneFacing = drone.rotation;

        // Normalize angle difference
        let angleDiff = Math.abs(angleToPlayer - droneFacing);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

        // Check if within detection cone
        const halfConeRad = (drone.detectionConeAngle / 2) * (Math.PI / 180);

        if (angleDiff < halfConeRad) {
          anyDroneDetecting = true;
          
          // Calculate detection increase based on movement and distance
          const proximityFactor = 1 - distance / drone.detectionRange;
          const movementMultiplier = equipment.silentFootsteps ? 0.3 : velocityMagnitude > 0.05 ? 1.5 : 0.8;
          const hiddenModifier = isHidden ? 0.3 : 1;

          const detectionIncrease = proximityFactor * movementMultiplier * hiddenModifier * 5;
          maxDetectionIncrease = Math.max(maxDetectionIncrease, detectionIncrease);
        }
      });

      // Update global detection level
      if (anyDroneDetecting) {
        const newLevel = Math.min(100, detectionLevel + maxDetectionIncrease);
        updateDetection(newLevel);
      } else {
        // Decay detection when not being detected
        const decayRate = 3;
        const newLevel = Math.max(0, detectionLevel - decayRate * 0.15);
        updateDetection(newLevel);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [phase, drones, playerPosition, isHidden, equipment.silentFootsteps, updateDetection, detectionLevel]);
}
