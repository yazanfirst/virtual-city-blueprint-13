import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '@/stores/playerStore';

interface ZombieProps {
  id: string;
  position: [number, number, number];
  speed?: number;
  isNight?: boolean;
  isPaused?: boolean;
  isSlowed?: boolean; // When zombie passes through laser
  onTouchPlayer: (zombieId: string) => void;
}

const PLAYER_COLLISION_DISTANCE = 1.2; // Distance at which zombie "touches" player
const PLAYER_JUMP_HEIGHT_THRESHOLD = 0.8; // Player must be at least this high to avoid zombie touch

/**
 * Zombie NPC that slowly chases the player.
 * Rule-based behavior - NO AI.
 * - Walks toward player position
 * - Slow, predictable movement
 * - Detects collision with player (checks Y position for jump avoidance)
 */
export default function ZombieCharacter({
  id,
  position: initialPosition,
  speed = 0.04, // Increased base speed for harder difficulty
  isNight = true,
  isPaused = false,
  isSlowed = false,
  onTouchPlayer,
}: ZombieProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  
  const positionRef = useRef(new THREE.Vector3(...initialPosition));
  const walkPhaseRef = useRef(Math.random() * Math.PI * 2);
  
  // Get player position from store
  const playerPosition = usePlayerStore((state) => state.position);
  
  // Zombie appearance - greenish/grayish skin
  const skinColor = useMemo(() => new THREE.Color('#7A9A6A'), []);
  const clothingColor = useMemo(() => new THREE.Color('#3A3A2A'), []);
  const eyeColor = useMemo(() => new THREE.Color('#CC2222'), []);
  
  // Calculate rotation to face player
  const getFacingAngle = (zombiePos: THREE.Vector3, playerPos: [number, number, number]) => {
    return Math.atan2(
      playerPos[0] - zombiePos.x,
      playerPos[2] - zombiePos.z
    );
  };
  
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    const targetX = playerPosition[0];
    const targetY = playerPosition[1]; // Player Y position (height)
    const targetZ = playerPosition[2];
    
    // Calculate direction to player (horizontal only)
    const dx = targetX - positionRef.current.x;
    const dz = targetZ - positionRef.current.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    // Check for collision with player - ALWAYS check, even when paused
    // BUT only if player is NOT jumping high enough (Y position check)
    if (distance < PLAYER_COLLISION_DISTANCE) {
      // Player Y is relative to ground (0), zombie height is about 1.5
      // If player Y > threshold, they're jumping over the zombie
      if (targetY < PLAYER_JUMP_HEIGHT_THRESHOLD) {
        onTouchPlayer(id);
        // Don't return - zombie should keep moving!
      }
    }
    
    // Don't move if paused, but still check collision above
    if (isPaused) return;
    
    // Apply slow effect if zombie passed through laser
    const effectiveSpeed = isSlowed ? speed * 0.3 : speed;
    
    // Move toward player (normalized direction * speed)
    if (distance > 0.1) {
      const moveX = (dx / distance) * effectiveSpeed * delta * 60;
      const moveZ = (dz / distance) * effectiveSpeed * delta * 60;
      
      positionRef.current.x += moveX;
      positionRef.current.z += moveZ;
    }
    
    // Update group position
    groupRef.current.position.copy(positionRef.current);
    
    // Face the player
    groupRef.current.rotation.y = getFacingAngle(positionRef.current, playerPosition);
    
    // Shambling walk animation (slower and more erratic than NPC)
    walkPhaseRef.current += delta * 4;
    const swing = Math.sin(walkPhaseRef.current) * 0.25;
    const armRaise = 0.4; // Arms raised forward like a zombie
    
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = -armRaise + swing * 0.5;
      leftArmRef.current.rotation.z = -0.2;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = -armRaise - swing * 0.5;
      rightArmRef.current.rotation.z = 0.2;
    }
    if (leftLegRef.current) leftLegRef.current.rotation.x = -swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = swing;
  });
  
  // Reset position if initial position changes
  useEffect(() => {
    positionRef.current.set(...initialPosition);
  }, [initialPosition]);

  return (
    <group ref={groupRef} position={initialPosition}>
      {/* Body - tattered clothing */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[0.4, 0.55, 0.25]} />
        <meshLambertMaterial color={clothingColor} />
      </mesh>
      
      {/* Head - greenish skin */}
      <mesh position={[0, 1.18, 0]}>
        <boxGeometry args={[0.28, 0.32, 0.28]} />
        <meshLambertMaterial color={skinColor} />
      </mesh>
      
      {/* Messy hair */}
      <mesh position={[0, 1.38, 0]}>
        <boxGeometry args={[0.3, 0.1, 0.3]} />
        <meshLambertMaterial color="#2A2A1A" />
      </mesh>
      
      {/* Glowing red eyes */}
      <mesh position={[-0.07, 1.2, 0.14]}>
        <boxGeometry args={[0.05, 0.05, 0.02]} />
        <meshBasicMaterial color={eyeColor} />
      </mesh>
      <mesh position={[0.07, 1.2, 0.14]}>
        <boxGeometry args={[0.05, 0.05, 0.02]} />
        <meshBasicMaterial color={eyeColor} />
      </mesh>
      
      {/* Left Arm - raised forward */}
      <mesh ref={leftArmRef} position={[-0.28, 0.68, 0]}>
        <boxGeometry args={[0.14, 0.45, 0.14]} />
        <meshLambertMaterial color={skinColor} />
      </mesh>
      
      {/* Right Arm - raised forward */}
      <mesh ref={rightArmRef} position={[0.28, 0.68, 0]}>
        <boxGeometry args={[0.14, 0.45, 0.14]} />
        <meshLambertMaterial color={skinColor} />
      </mesh>
      
      {/* Left Leg */}
      <mesh ref={leftLegRef} position={[-0.12, 0.25, 0]}>
        <boxGeometry args={[0.14, 0.4, 0.14]} />
        <meshLambertMaterial color={clothingColor} />
      </mesh>
      
      {/* Right Leg */}
      <mesh ref={rightLegRef} position={[0.12, 0.25, 0]}>
        <boxGeometry args={[0.14, 0.4, 0.14]} />
        <meshLambertMaterial color={clothingColor} />
      </mesh>

      {/* Eerie glow effect */}
      <pointLight 
        position={[0, 1, 0]} 
        intensity={0.4} 
        distance={4} 
        color="#88FF88" 
        decay={2}
      />
      
      {/* Eye glow */}
      <pointLight 
        position={[0, 1.2, 0.2]} 
        intensity={0.2} 
        distance={2} 
        color="#FF4444" 
        decay={2}
      />
    </group>
  );
}
