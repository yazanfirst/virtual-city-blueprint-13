import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useGhostHuntStore } from '@/stores/ghostHuntStore';

/**
 * Ghost Trap Capture Hook
 * 
 * Detects when the ghost trap is fired and captures any revealed ghosts
 * within range and in front of the player.
 */

const TRAP_RANGE = 15; // Distance the trap beam can reach
const TRAP_CONE_ANGLE = Math.PI / 3; // 60 degree cone

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
    
    // Calculate player's forward direction from camera azimuth rotation
    // Azimuth is the horizontal rotation angle
    const playerForwardX = Math.sin(cameraRotation.azimuth);
    const playerForwardZ = Math.cos(cameraRotation.azimuth);
    
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
      
      // Normalize direction to ghost
      const dirX = dx / distance;
      const dirZ = dz / distance;
      
      // Calculate angle between player forward and ghost direction
      const dot = playerForwardX * dirX + playerForwardZ * dirZ;
      const angle = Math.acos(Math.min(1, Math.max(-1, dot)));
      
      // Check if ghost is within cone
      if (angle <= TRAP_CONE_ANGLE / 2) {
        // Capture this ghost!
        captureGhost(ghost.id);
      }
    });
  }, [equipment.trapActive, phase, playerPosition, cameraRotation, ghosts, captureGhost]);
  
  return null;
}
