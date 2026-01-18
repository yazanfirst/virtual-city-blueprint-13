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
  isSlowed?: boolean;
  isFrozen?: boolean; // Complete freeze from laser trap
  behaviorType?: 'direct' | 'flanker' | 'ambusher' | 'patrol';
  onTouchPlayer: (zombieId: string) => void;
}

const PLAYER_COLLISION_DISTANCE = 1.2;
const PLAYER_JUMP_HEIGHT_THRESHOLD = 0.8;

/**
 * Zombie NPC with varied AI behaviors:
 * - direct: Chases player directly
 * - flanker: Tries to approach from the side
 * - ambusher: Waits nearby then rushes when close
 * - patrol: Moves in patterns, chases when player is near
 */
export default function ZombieCharacter({
  id,
  position: initialPosition,
  speed = 0.04,
  isNight = true,
  isPaused = false,
  isSlowed = false,
  isFrozen = false,
  behaviorType = 'direct',
  onTouchPlayer,
}: ZombieProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  
  const positionRef = useRef(new THREE.Vector3(...initialPosition));
  const walkPhaseRef = useRef(Math.random() * Math.PI * 2);
  const behaviorTimerRef = useRef(Math.random() * 5); // Random offset for varied behavior
  const patrolTargetRef = useRef(new THREE.Vector3(...initialPosition));
  const flankAngleRef = useRef((Math.random() - 0.5) * Math.PI); // Random flank direction
  
  const playerPosition = usePlayerStore((state) => state.position);
  
  // Zombie appearance
  const skinColor = useMemo(() => new THREE.Color('#7A9A6A'), []);
  const clothingColor = useMemo(() => new THREE.Color('#3A3A2A'), []);
  const eyeColor = useMemo(() => new THREE.Color('#CC2222'), []);
  
  const getFacingAngle = (zombiePos: THREE.Vector3, targetPos: THREE.Vector3) => {
    return Math.atan2(targetPos.x - zombiePos.x, targetPos.z - zombiePos.z);
  };
  
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    const playerPos = new THREE.Vector3(...playerPosition);
    const zombiePos = positionRef.current;
    
    // Distance to player
    const dx = playerPos.x - zombiePos.x;
    const dz = playerPos.z - zombiePos.z;
    const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);
    
    // Check collision - ALWAYS check, even when paused
    if (distanceToPlayer < PLAYER_COLLISION_DISTANCE) {
      if (playerPosition[1] < PLAYER_JUMP_HEIGHT_THRESHOLD) {
        onTouchPlayer(id);
      }
    }
    
    // Don't move if paused or frozen
    if (isPaused || isFrozen) return;
    
    // Apply slow effect (reduced speed when slowed)
    const effectiveSpeed = isSlowed ? speed * 0.3 : speed;
    behaviorTimerRef.current += delta;
    
    let targetX = playerPos.x;
    let targetZ = playerPos.z;
    let moveSpeed = effectiveSpeed;
    
    // Different behavior based on type
    switch (behaviorType) {
      case 'flanker': {
        // Approach from the side
        const flankDistance = 8;
        const flankX = playerPos.x + Math.cos(flankAngleRef.current) * flankDistance;
        const flankZ = playerPos.z + Math.sin(flankAngleRef.current) * flankDistance;
        
        // If close to flank position, move toward player
        const distToFlank = Math.sqrt(
          Math.pow(zombiePos.x - flankX, 2) + Math.pow(zombiePos.z - flankZ, 2)
        );
        
        if (distToFlank < 3 || distanceToPlayer < 10) {
          // Close enough, rush player
          targetX = playerPos.x;
          targetZ = playerPos.z;
          moveSpeed = effectiveSpeed * 1.2; // Faster when rushing
        } else {
          // Move to flank position
          targetX = flankX;
          targetZ = flankZ;
        }
        
        // Occasionally change flank angle
        if (behaviorTimerRef.current > 8) {
          behaviorTimerRef.current = 0;
          flankAngleRef.current = (Math.random() - 0.5) * Math.PI;
        }
        break;
      }
      
      case 'ambusher': {
        // Stay at spawn area, rush when player gets close
        const ambushRadius = 20;
        const triggerDistance = 15;
        
        if (distanceToPlayer < triggerDistance) {
          // Player is close! Rush them
          targetX = playerPos.x;
          targetZ = playerPos.z;
          moveSpeed = effectiveSpeed * 1.4; // Fast ambush
        } else {
          // Wander near spawn
          const homePos = new THREE.Vector3(...initialPosition);
          const distFromHome = zombiePos.distanceTo(homePos);
          
          if (distFromHome > ambushRadius) {
            // Too far from home, go back
            targetX = homePos.x;
            targetZ = homePos.z;
          } else {
            // Random wander near home
            if (behaviorTimerRef.current > 4) {
              behaviorTimerRef.current = 0;
              patrolTargetRef.current.set(
                homePos.x + (Math.random() - 0.5) * ambushRadius,
                0,
                homePos.z + (Math.random() - 0.5) * ambushRadius
              );
            }
            targetX = patrolTargetRef.current.x;
            targetZ = patrolTargetRef.current.z;
          }
          moveSpeed = effectiveSpeed * 0.5; // Slow wander
        }
        break;
      }
      
      case 'patrol': {
        // Patrol a route, chase if player is visible
        const patrolRadius = 15;
        const chaseDistance = 12;
        
        if (distanceToPlayer < chaseDistance) {
          // Chase player
          targetX = playerPos.x;
          targetZ = playerPos.z;
          moveSpeed = effectiveSpeed * 1.1;
        } else {
          // Patrol pattern (circular)
          const angle = behaviorTimerRef.current * 0.3;
          targetX = initialPosition[0] + Math.cos(angle) * patrolRadius;
          targetZ = initialPosition[2] + Math.sin(angle) * patrolRadius;
          moveSpeed = effectiveSpeed * 0.6;
        }
        break;
      }
      
      case 'direct':
      default: {
        // Simple chase - but with slight offset to prevent perfect clustering
        const offsetAngle = parseFloat(id.split('-')[1] || '0') * 0.5;
        const spreadOffset = 2;
        targetX = playerPos.x + Math.cos(offsetAngle) * spreadOffset;
        targetZ = playerPos.z + Math.sin(offsetAngle) * spreadOffset;
        break;
      }
    }
    
    // Calculate movement direction
    const moveDx = targetX - zombiePos.x;
    const moveDz = targetZ - zombiePos.z;
    const moveDist = Math.sqrt(moveDx * moveDx + moveDz * moveDz);
    
    // Move toward target
    if (moveDist > 0.5) {
      const moveX = (moveDx / moveDist) * moveSpeed * delta * 60;
      const moveZ = (moveDz / moveDist) * moveSpeed * delta * 60;
      
      positionRef.current.x += moveX;
      positionRef.current.z += moveZ;
    }
    
    // Update group position
    groupRef.current.position.copy(positionRef.current);
    
    // Face movement direction
    const targetPos = new THREE.Vector3(targetX, 0, targetZ);
    groupRef.current.rotation.y = getFacingAngle(positionRef.current, targetPos);
    
    // Walk animation
    walkPhaseRef.current += delta * 4;
    const swing = Math.sin(walkPhaseRef.current) * 0.25;
    const armRaise = 0.4;
    
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
  
  useEffect(() => {
    positionRef.current.set(...initialPosition);
    patrolTargetRef.current.set(...initialPosition);
  }, [initialPosition]);

  return (
    <group ref={groupRef} position={initialPosition}>
      {/* Body */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[0.4, 0.55, 0.25]} />
        <meshLambertMaterial color={clothingColor} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.18, 0]}>
        <boxGeometry args={[0.28, 0.32, 0.28]} />
        <meshLambertMaterial color={skinColor} />
      </mesh>
      
      {/* Hair */}
      <mesh position={[0, 1.38, 0]}>
        <boxGeometry args={[0.3, 0.1, 0.3]} />
        <meshLambertMaterial color="#2A2A1A" />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.07, 1.2, 0.14]}>
        <boxGeometry args={[0.05, 0.05, 0.02]} />
        <meshBasicMaterial color={eyeColor} />
      </mesh>
      <mesh position={[0.07, 1.2, 0.14]}>
        <boxGeometry args={[0.05, 0.05, 0.02]} />
        <meshBasicMaterial color={eyeColor} />
      </mesh>
      
      {/* Arms */}
      <mesh ref={leftArmRef} position={[-0.28, 0.68, 0]}>
        <boxGeometry args={[0.14, 0.45, 0.14]} />
        <meshLambertMaterial color={skinColor} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.28, 0.68, 0]}>
        <boxGeometry args={[0.14, 0.45, 0.14]} />
        <meshLambertMaterial color={skinColor} />
      </mesh>
      
      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.12, 0.25, 0]}>
        <boxGeometry args={[0.14, 0.4, 0.14]} />
        <meshLambertMaterial color={clothingColor} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.12, 0.25, 0]}>
        <boxGeometry args={[0.14, 0.4, 0.14]} />
        <meshLambertMaterial color={clothingColor} />
      </mesh>
      {/* Removed individual point lights for better performance */}
    </group>
  );
}
