import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useGhostHuntStore } from '@/stores/ghostHuntStore';

/**
 * Ghost Trap Capture Hook
 * 
 * Detects when the ghost trap is fired and captures any revealed ghosts
 * within range and in front of the player.
 * 
 * WIDER cone (90 degrees) and LONGER range (20 units) for better gameplay
 */

const TRAP_RANGE = 20; // Distance the trap beam can reach
const TRAP_CONE_ANGLE = Math.PI / 2; // 90 degree cone (wider for easier capture)

export function useGhostTrapCapture() {
  const lastTrapStateRef = useRef(false);
  
  const playerPosition = usePlayerStore((s) => s.position);
  const cameraRotation = usePlayerStore((s) => s.cameraRotation);
  
  const { 
    ghosts, 
    equipment, 
    captureGhost,
    phase,
    isActive,
  } = useGhostHuntStore();
  
  useEffect(() => {
    // Only process during active ghost hunt
    if (!isActive || phase !== 'hunting') {
      lastTrapStateRef.current = false;
      return;
    }
    
    // Only process on trap activation (rising edge)
    if (!equipment.trapActive) {
      lastTrapStateRef.current = false;
      return;
    }
    
    // Already processed this activation
    if (lastTrapStateRef.current) return;
    
    lastTrapStateRef.current = true;
    
    const [px, , pz] = playerPosition;
    
    // Calculate player's forward direction from camera azimuth rotation
    const playerForwardX = Math.sin(cameraRotation.azimuth);
    const playerForwardZ = Math.cos(cameraRotation.azimuth);
    
    console.log('Ghost Trap Fired!', { 
      playerPos: [px, pz], 
      forward: [playerForwardX.toFixed(2), playerForwardZ.toFixed(2)],
      revealedGhosts: ghosts.filter(g => g.isRevealed && !g.isCaptured).length
    });
    
    // Find revealed ghosts in trap cone
    let captured = false;
    ghosts.forEach((ghost) => {
      if (ghost.isCaptured || !ghost.isRevealed) return;
      
      const [gx, , gz] = ghost.position;
      
      // Direction to ghost
      const dx = gx - px;
      const dz = gz - pz;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      // Check range
      if (distance > TRAP_RANGE) {
        console.log(`Ghost ${ghost.id} too far: ${distance.toFixed(1)} > ${TRAP_RANGE}`);
        return;
      }
      
      // Avoid division by zero
      if (distance < 0.1) {
        // Ghost is basically on player - capture it!
        console.log(`Ghost ${ghost.id} captured (on player)`);
        captureGhost(ghost.id);
        captured = true;
        return;
      }
      
      // Normalize direction to ghost
      const dirX = dx / distance;
      const dirZ = dz / distance;
      
      // Calculate angle between player forward and ghost direction
      const dot = playerForwardX * dirX + playerForwardZ * dirZ;
      const angle = Math.acos(Math.min(1, Math.max(-1, dot)));
      
      console.log(`Ghost ${ghost.id}: dist=${distance.toFixed(1)}, angle=${(angle * 180 / Math.PI).toFixed(0)}°, maxAngle=${(TRAP_CONE_ANGLE / 2 * 180 / Math.PI).toFixed(0)}°`);
      
      // Check if ghost is within cone
      if (angle <= TRAP_CONE_ANGLE / 2) {
        // Capture this ghost!
        console.log(`Ghost ${ghost.id} CAPTURED!`);
        captureGhost(ghost.id);
        captured = true;
      }
    });
    
    if (!captured) {
      console.log('No ghost captured - none in range/cone');
    }
  }, [equipment.trapActive, phase, isActive, playerPosition, cameraRotation, ghosts, captureGhost]);
  
  return null;
}
