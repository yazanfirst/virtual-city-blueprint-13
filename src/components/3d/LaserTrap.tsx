import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '@/stores/playerStore';
import { useMissionStore } from '@/stores/missionStore';

interface LaserTrapProps {
  id: string;
  position: [number, number, number];
  rotation?: number; // Y-axis rotation in radians
  length?: number;
  isActive?: boolean;
  onPlayerHit: (trapId: string) => void;
}

const PLAYER_HIT_DISTANCE = 1.2; // How close player needs to be to laser line
const ZOMBIE_HIT_DISTANCE = 1.5; // Distance for zombie detection

/**
 * Laser beam trap that damages player and slows zombies
 * Visual: Red pulsing laser beam between two posts
 */
export default function LaserTrap({
  id,
  position,
  rotation = 0,
  length = 8,
  isActive = true,
  onPlayerHit,
}: LaserTrapProps) {
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef(0);
  const hitCooldownRef = useRef(0);
  const zombieCheckRef = useRef(0);
  
  const playerPosition = usePlayerStore((state) => state.position);
  const { zombies, slowZombie } = useMissionStore();
  
  // Laser colors
  const laserColor = useMemo(() => new THREE.Color('#FF0000'), []);
  const postColor = useMemo(() => new THREE.Color('#333333'), []);
  
  useFrame((_, delta) => {
    if (!groupRef.current || !beamRef.current || !isActive) return;
    
    // Pulsing effect
    pulseRef.current += delta * 8;
    const intensity = 0.5 + Math.sin(pulseRef.current) * 0.3;
    
    if (beamRef.current.material instanceof THREE.MeshBasicMaterial) {
      beamRef.current.material.opacity = intensity;
    }
    
    // Calculate laser line endpoints (rotated)
    const trapPos = new THREE.Vector3(...position);
    const halfLength = length / 2;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    
    const start = new THREE.Vector3(
      trapPos.x - halfLength * sin,
      trapPos.y + 0.8,
      trapPos.z - halfLength * cos
    );
    const end = new THREE.Vector3(
      trapPos.x + halfLength * sin,
      trapPos.y + 0.8,
      trapPos.z + halfLength * cos
    );
    
    const lineVec = end.clone().sub(start);
    
    // Check player collision (with cooldown)
    if (hitCooldownRef.current > 0) {
      hitCooldownRef.current -= delta;
    } else {
      const playerPos = new THREE.Vector3(...playerPosition);
      const playerToStart = playerPos.clone().sub(start);
      
      const t = Math.max(0, Math.min(1, playerToStart.dot(lineVec) / lineVec.lengthSq()));
      const closestPoint = start.clone().add(lineVec.clone().multiplyScalar(t));
      
      // Only check X and Z distance (ignore Y)
      const dx = playerPos.x - closestPoint.x;
      const dz = playerPos.z - closestPoint.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < PLAYER_HIT_DISTANCE) {
        onPlayerHit(id);
        hitCooldownRef.current = 1.5; // 1.5 second cooldown between hits
      }
    }
    
    // Check zombie collision (less frequent for performance)
    zombieCheckRef.current += delta;
    if (zombieCheckRef.current > 0.2) { // Check every 200ms
      zombieCheckRef.current = 0;
      
      for (const zombie of zombies) {
        const zombiePos = new THREE.Vector3(...zombie.position);
        const zombieToStart = zombiePos.clone().sub(start);
        
        const t = Math.max(0, Math.min(1, zombieToStart.dot(lineVec) / lineVec.lengthSq()));
        const closestPoint = start.clone().add(lineVec.clone().multiplyScalar(t));
        
        const dx = zombiePos.x - closestPoint.x;
        const dz = zombiePos.z - closestPoint.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < ZOMBIE_HIT_DISTANCE) {
          slowZombie(zombie.id);
        }
      }
    }
  });
  
  if (!isActive) return null;
  
  const halfLength = length / 2;
  
  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Left post */}
      <mesh position={[-halfLength, 0.6, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 1.2, 6]} />
        <meshLambertMaterial color={postColor} />
      </mesh>
      {/* Left post emitter */}
      <mesh position={[-halfLength, 0.9, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="#FF4444" />
      </mesh>
      
      {/* Right post */}
      <mesh position={[halfLength, 0.6, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 1.2, 6]} />
        <meshLambertMaterial color={postColor} />
      </mesh>
      {/* Right post emitter */}
      <mesh position={[halfLength, 0.9, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="#FF4444" />
      </mesh>
      
      {/* Laser beam */}
      <mesh ref={beamRef} position={[0, 0.9, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, length - 0.5, 8]} />
        <meshBasicMaterial 
          color={laserColor} 
          transparent 
          opacity={0.7}
        />
      </mesh>
      
      {/* Glow effect */}
      <pointLight
        position={[0, 0.9, 0]}
        intensity={1.5}
        distance={6}
        color="#FF0000"
        decay={2}
      />
    </group>
  );
}
