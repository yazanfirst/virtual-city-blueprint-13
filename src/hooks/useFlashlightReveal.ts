import { useEffect } from 'react';
import { useGhostHuntStore } from '@/stores/ghostHuntStore';
import { usePlayerStore } from '@/stores/playerStore';

// Constants for flashlight detection
const FLASHLIGHT_RANGE = 12;  // How far the flashlight reaches
const FLASHLIGHT_ANGLE = Math.PI / 3;  // 60 degree cone

/**
 * Hook to handle flashlight revealing ghosts
 * Call this in your main game component
 */
export function useFlashlightReveal() {
  const { 
    ghosts, 
    equipment, 
    phase, 
    isActive,
    revealGhost 
  } = useGhostHuntStore();
  
  const playerPosition = usePlayerStore((s) => s.position);
  const cameraRotation = usePlayerStore((s) => s.cameraRotation);
  
  useEffect(() => {
    if (!isActive || phase !== 'hunting') return;
    if (!equipment.flashlightActive) return;
    
    // Get player facing direction from camera azimuth
    const playerFacingAngle = cameraRotation.azimuth;
    const [px, , pz] = playerPosition;
    
    // Check each ghost
    for (const ghost of ghosts) {
      if (ghost.isCaptured || ghost.isRevealed) continue;
      
      const [gx, , gz] = ghost.position;
      
      // Distance check
      const dx = gx - px;
      const dz = gz - pz;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance > FLASHLIGHT_RANGE) continue;
      
      // Angle check - is ghost within flashlight cone?
      const angleToGhost = Math.atan2(dx, dz);
      let angleDiff = Math.abs(angleToGhost - playerFacingAngle);
      
      // Normalize to [0, PI]
      if (angleDiff > Math.PI) {
        angleDiff = 2 * Math.PI - angleDiff;
      }
      
      if (angleDiff <= FLASHLIGHT_ANGLE / 2) {
        // Ghost is within flashlight cone - reveal it!
        revealGhost(ghost.id);
      }
    }
  }, [equipment.flashlightActive, ghosts, playerPosition, cameraRotation, phase, isActive, revealGhost]);
}

export default useFlashlightReveal;
