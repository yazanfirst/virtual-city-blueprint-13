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
  isFrozen?: boolean;
  behaviorType?: 'direct' | 'flanker' | 'ambusher' | 'patrol';
  onTouchPlayer: (zombieId: string) => void;
}

const PLAYER_COLLISION_DISTANCE = 1.2;
const PLAYER_JUMP_HEIGHT_THRESHOLD = 0.8;

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
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  
  const positionRef = useRef(new THREE.Vector3(...initialPosition));
  const walkPhaseRef = useRef(Math.random() * Math.PI * 2);
  const behaviorTimerRef = useRef(Math.random() * 5);
  const patrolTargetRef = useRef(new THREE.Vector3(...initialPosition));
  const flankAngleRef = useRef((Math.random() - 0.5) * Math.PI);
  
  const playerPosition = usePlayerStore((state) => state.position);

  const materials = useMemo(() => ({
    skin: new THREE.MeshStandardMaterial({ color: '#7a9a6a', roughness: 0.8, metalness: 0 }),
    skinDark: new THREE.MeshStandardMaterial({ color: '#5a7a4a', roughness: 0.9, metalness: 0 }),
    clothing: new THREE.MeshStandardMaterial({ color: '#3a3a2a', roughness: 0.8, metalness: 0.05 }),
    clothingTorn: new THREE.MeshStandardMaterial({ color: '#4a4a3a', roughness: 0.9, metalness: 0 }),
    hair: new THREE.MeshStandardMaterial({ color: '#2a2a1a', roughness: 0.9 }),
    eye: new THREE.MeshStandardMaterial({ 
      color: '#ff2222', emissive: '#ff0000', emissiveIntensity: 0.8, roughness: 0.2 
    }),
    wound: new THREE.MeshStandardMaterial({ color: '#8b2020', roughness: 0.9 }),
  }), []);
  
  const getFacingAngle = (zombiePos: THREE.Vector3, targetPos: THREE.Vector3) => {
    return Math.atan2(targetPos.x - zombiePos.x, targetPos.z - zombiePos.z);
  };
  
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    const playerPos = new THREE.Vector3(...playerPosition);
    const zombiePos = positionRef.current;
    
    const dx = playerPos.x - zombiePos.x;
    const dz = playerPos.z - zombiePos.z;
    const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);
    
    if (distanceToPlayer < PLAYER_COLLISION_DISTANCE) {
      if (playerPosition[1] < PLAYER_JUMP_HEIGHT_THRESHOLD) {
        onTouchPlayer(id);
      }
    }
    
    if (isPaused || isFrozen) return;
    
    const effectiveSpeed = isSlowed ? speed * 0.3 : speed;
    behaviorTimerRef.current += delta;
    
    let targetX = playerPos.x;
    let targetZ = playerPos.z;
    let moveSpeed = effectiveSpeed;
    
    // Behavior AI (same logic as before)
    switch (behaviorType) {
      case 'flanker': {
        const flankDistance = 8;
        const flankX = playerPos.x + Math.cos(flankAngleRef.current) * flankDistance;
        const flankZ = playerPos.z + Math.sin(flankAngleRef.current) * flankDistance;
        const distToFlank = Math.sqrt(
          Math.pow(zombiePos.x - flankX, 2) + Math.pow(zombiePos.z - flankZ, 2)
        );
        if (distToFlank < 3 || distanceToPlayer < 10) {
          targetX = playerPos.x; targetZ = playerPos.z;
          moveSpeed = effectiveSpeed * 1.2;
        } else {
          targetX = flankX; targetZ = flankZ;
        }
        if (behaviorTimerRef.current > 8) {
          behaviorTimerRef.current = 0;
          flankAngleRef.current = (Math.random() - 0.5) * Math.PI;
        }
        break;
      }
      case 'ambusher': {
        const ambushRadius = 20;
        const triggerDistance = 15;
        if (distanceToPlayer < triggerDistance) {
          targetX = playerPos.x; targetZ = playerPos.z;
          moveSpeed = effectiveSpeed * 1.4;
        } else {
          const homePos = new THREE.Vector3(...initialPosition);
          const distFromHome = zombiePos.distanceTo(homePos);
          if (distFromHome > ambushRadius) {
            targetX = homePos.x; targetZ = homePos.z;
          } else {
            if (behaviorTimerRef.current > 4) {
              behaviorTimerRef.current = 0;
              patrolTargetRef.current.set(
                homePos.x + (Math.random() - 0.5) * ambushRadius, 0,
                homePos.z + (Math.random() - 0.5) * ambushRadius
              );
            }
            targetX = patrolTargetRef.current.x; targetZ = patrolTargetRef.current.z;
          }
          moveSpeed = effectiveSpeed * 0.5;
        }
        break;
      }
      case 'patrol': {
        const patrolRadius = 15;
        const chaseDistance = 12;
        if (distanceToPlayer < chaseDistance) {
          targetX = playerPos.x; targetZ = playerPos.z;
          moveSpeed = effectiveSpeed * 1.1;
        } else {
          const angle = behaviorTimerRef.current * 0.3;
          targetX = initialPosition[0] + Math.cos(angle) * patrolRadius;
          targetZ = initialPosition[2] + Math.sin(angle) * patrolRadius;
          moveSpeed = effectiveSpeed * 0.6;
        }
        break;
      }
      case 'direct':
      default: {
        const offsetAngle = parseFloat(id.split('-')[1] || '0') * 0.5;
        const spreadOffset = 2;
        targetX = playerPos.x + Math.cos(offsetAngle) * spreadOffset;
        targetZ = playerPos.z + Math.sin(offsetAngle) * spreadOffset;
        break;
      }
    }
    
    const moveDx = targetX - zombiePos.x;
    const moveDz = targetZ - zombiePos.z;
    const moveDist = Math.sqrt(moveDx * moveDx + moveDz * moveDz);
    
    if (moveDist > 0.5) {
      positionRef.current.x += (moveDx / moveDist) * moveSpeed * delta * 60;
      positionRef.current.z += (moveDz / moveDist) * moveSpeed * delta * 60;
    }
    
    groupRef.current.position.copy(positionRef.current);
    const targetPos = new THREE.Vector3(targetX, 0, targetZ);
    groupRef.current.rotation.y = getFacingAngle(positionRef.current, targetPos);
    
    // Walk animation - zombie shamble
    walkPhaseRef.current += delta * 4;
    const swing = Math.sin(walkPhaseRef.current) * 0.25;
    const armRaise = 0.5; // Arms forward zombie style
    
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = -armRaise + swing * 0.4;
      leftArmRef.current.rotation.z = -0.15;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = -armRaise - swing * 0.4;
      rightArmRef.current.rotation.z = 0.15;
    }
    if (leftLegRef.current) leftLegRef.current.rotation.x = -swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = swing;
    
    // Zombie body tilt/sway
    groupRef.current.rotation.z = Math.sin(walkPhaseRef.current * 0.5) * 0.05;
  });
  
  useEffect(() => {
    positionRef.current.set(...initialPosition);
    patrolTargetRef.current.set(...initialPosition);
  }, [initialPosition]);

  return (
    <group ref={groupRef} position={initialPosition}>
      {/* Head - slightly deformed sphere */}
      <mesh position={[0, 1.18, 0]} material={materials.skin}>
        <sphereGeometry args={[0.18, 10, 8]} />
      </mesh>
      {/* Messy hair */}
      <mesh position={[0, 1.32, -0.02]} material={materials.hair}>
        <sphereGeometry args={[0.17, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
      </mesh>
      
      {/* Eyes - glowing red */}
      <mesh position={[-0.07, 1.2, 0.14]} material={materials.eye}>
        <sphereGeometry args={[0.035, 6, 6]} />
      </mesh>
      <mesh position={[0.07, 1.2, 0.14]} material={materials.eye}>
        <sphereGeometry args={[0.035, 6, 6]} />
      </mesh>
      
      {/* Wound on face */}
      <mesh position={[0.1, 1.14, 0.15]} material={materials.wound}>
        <boxGeometry args={[0.06, 0.03, 0.02]} />
      </mesh>
      
      {/* Neck */}
      <mesh position={[0, 1.0, 0]} material={materials.skinDark}>
        <cylinderGeometry args={[0.07, 0.08, 0.08, 6]} />
      </mesh>
      
      {/* Torso - capsule shape */}
      <mesh position={[0, 0.72, 0]} material={materials.clothing}>
        <capsuleGeometry args={[0.17, 0.3, 4, 8]} />
      </mesh>
      {/* Torn clothing detail */}
      <mesh position={[0.1, 0.6, 0.12]} material={materials.clothingTorn}>
        <boxGeometry args={[0.08, 0.12, 0.04]} />
      </mesh>
      
      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.25, 0.92, 0]}>
        <mesh position={[0, -0.12, 0]} material={materials.clothing}>
          <capsuleGeometry args={[0.06, 0.18, 4, 6]} />
        </mesh>
        <mesh position={[0, -0.32, 0]} material={materials.skin}>
          <capsuleGeometry args={[0.05, 0.12, 4, 6]} />
        </mesh>
        <mesh position={[0, -0.42, 0]} material={materials.skinDark}>
          <sphereGeometry args={[0.05, 6, 6]} />
        </mesh>
      </group>
      
      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.25, 0.92, 0]}>
        <mesh position={[0, -0.12, 0]} material={materials.clothing}>
          <capsuleGeometry args={[0.06, 0.18, 4, 6]} />
        </mesh>
        <mesh position={[0, -0.32, 0]} material={materials.skin}>
          <capsuleGeometry args={[0.05, 0.12, 4, 6]} />
        </mesh>
        <mesh position={[0, -0.42, 0]} material={materials.skinDark}>
          <sphereGeometry args={[0.05, 6, 6]} />
        </mesh>
      </group>
      
      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.1, 0.4, 0]}>
        <mesh position={[0, -0.05, 0]} material={materials.clothing}>
          <capsuleGeometry args={[0.07, 0.18, 4, 6]} />
        </mesh>
        <mesh position={[0, -0.28, 0]} material={materials.skinDark}>
          <capsuleGeometry args={[0.06, 0.12, 4, 6]} />
        </mesh>
        <mesh position={[0, -0.4, 0.03]} material={materials.clothing}>
          <boxGeometry args={[0.12, 0.06, 0.16]} />
        </mesh>
      </group>
      
      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.1, 0.4, 0]}>
        <mesh position={[0, -0.05, 0]} material={materials.clothing}>
          <capsuleGeometry args={[0.07, 0.18, 4, 6]} />
        </mesh>
        <mesh position={[0, -0.28, 0]} material={materials.skinDark}>
          <capsuleGeometry args={[0.06, 0.12, 4, 6]} />
        </mesh>
        <mesh position={[0, -0.4, 0.03]} material={materials.clothing}>
          <boxGeometry args={[0.12, 0.06, 0.16]} />
        </mesh>
      </group>
    </group>
  );
}
