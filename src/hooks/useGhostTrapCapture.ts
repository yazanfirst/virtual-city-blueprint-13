import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useGhostHuntStore } from '@/stores/ghostHuntStore';

/**
 * Ghost Trap Capture Hook
 * 
 * Detects when the ghost trap is fired and captures any revealed ghosts
 * within range and in front of the player.
 */

const TRAP_RANGE = 18; // Distance the trap beam can reach
const TRAP_CONE_ANGLE = Math.PI / 2; // 90 degree cone
const TRAP_CLOSE_RANGE = 4; // Always capture when very close

export function useGhostTrapCapture() {
  const lastTrapStateRef = useRef(false);
  
  const playerPosition = usePlayerStore((s) => s.position);
  const cameraRotation = usePlayerStore((s) => s.cameraRotation);
  
  const { 
    ghosts, 
    equipment, 
    captureGhost,
    phase,
  } = useGhostHuntStore();
  
  useEffect(() => {
    // Only process on trap activation (rising edge)
    if (!equipment.trapActive || lastTrapStateRef.current) {
      lastTrapStateRef.current = equipment.trapActive;
      return;
    }
    
    lastTrapStateRef.current = true;
    
    if (phase !== 'hunting') return;
    
    const [px, , pz] = playerPosition;
    
    // Calculate player's facing angle from camera azimuth rotation
    const playerFacingAngle = cameraRotation.azimuth;
    
    // Find revealed ghosts in trap cone
    ghosts.forEach((ghost) => {
      if (ghost.isCaptured || !ghost.isRevealed) return;
      
      const [gx, , gz] = ghost.position;
      
      // Direction to ghost
      const dx = gx - px;
      const dz = gz - pz;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      // Check range
      if (distance > TRAP_RANGE) return;
      
      if (distance <= TRAP_CLOSE_RANGE) {
        captureGhost(ghost.id);
        return;
      }

      // Angle check - is ghost within trap cone?
      const angleToGhost = Math.atan2(dx, dz);
      let angleDiff = Math.abs(angleToGhost - playerFacingAngle);

      // Normalize to [0, PI]
      if (angleDiff > Math.PI) {
        angleDiff = 2 * Math.PI - angleDiff;
      }

      if (angleDiff <= TRAP_CONE_ANGLE / 2) {
        captureGhost(ghost.id);
      }
    });
  }, [equipment.trapActive, phase, playerPosition, cameraRotation, ghosts, captureGhost]);
  
  return null;
}
