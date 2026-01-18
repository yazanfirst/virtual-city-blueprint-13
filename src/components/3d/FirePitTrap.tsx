import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '@/stores/playerStore';
import { useMissionStore } from '@/stores/missionStore';

interface FirePitTrapProps {
  id: string;
  position: [number, number, number];
  isActive?: boolean;
  onPlayerHit: (trapId: string) => void;
}

// Simple radius-based collision - very reliable
const PLAYER_HIT_RADIUS = 1.2;
const PLAYER_JUMP_THRESHOLD = 0.8; // Must jump this high to avoid
const ZOMBIE_HIT_RADIUS = 1.5;

/**
 * Fire pit trap - simple circular ground trap
 * Player must jump over to avoid damage
 * Uses simple distance check - extremely reliable
 */
export default function FirePitTrap({
  id,
  position,
  isActive = true,
  onPlayerHit,
}: FirePitTrapProps) {
  const groupRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Group>(null);
  const hitCooldownRef = useRef(0);
  const zombieCheckRef = useRef(0);
  const timeRef = useRef(0);
  
  const playerPosition = usePlayerStore((state) => state.position);
  const { zombies, freezeZombie, frozenZombieIds } = useMissionStore();
  
  // Colors
  const pitColor = useMemo(() => new THREE.Color('#2A1A0A'), []);
  const emberColor = useMemo(() => new THREE.Color('#FF4400'), []);
  
  useFrame((_, delta) => {
    if (!groupRef.current || !isActive) return;
    
    timeRef.current += delta;
    
    // Animate flames
    if (flameRef.current) {
      flameRef.current.children.forEach((flame, i) => {
        const offset = i * 0.5;
        flame.scale.y = 0.8 + Math.sin(timeRef.current * 8 + offset) * 0.3;
        flame.position.y = 0.3 + Math.sin(timeRef.current * 6 + offset) * 0.1;
      });
    }
    
    const trapPos = new THREE.Vector3(...position);
    
    // Check player collision (with cooldown)
    if (hitCooldownRef.current > 0) {
      hitCooldownRef.current -= delta;
    } else {
      const playerPos = new THREE.Vector3(...playerPosition);
      
      // Simple 2D distance check (ignore Y for horizontal distance)
      const dx = playerPos.x - trapPos.x;
      const dz = playerPos.z - trapPos.z;
      const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
      
      // Player is hit if: close enough horizontally AND not jumping high enough
      if (horizontalDistance < PLAYER_HIT_RADIUS && playerPos.y < PLAYER_JUMP_THRESHOLD) {
        onPlayerHit(id);
        hitCooldownRef.current = 1.5; // 1.5 second cooldown
      }
    }
    
    // Check zombie collision (freeze them for 2 seconds)
    zombieCheckRef.current += delta;
    if (zombieCheckRef.current > 0.25) {
      zombieCheckRef.current = 0;
      
      for (const zombie of zombies) {
        // Skip already frozen zombies
        if (frozenZombieIds.has(zombie.id)) continue;
        
        const zombiePos = new THREE.Vector3(...zombie.position);
        const dx = zombiePos.x - trapPos.x;
        const dz = zombiePos.z - trapPos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < ZOMBIE_HIT_RADIUS) {
          freezeZombie(zombie.id, 2000); // Freeze for 2 seconds
        }
      }
    }
  });
  
  if (!isActive) return null;
  
  return (
    <group ref={groupRef} position={position}>
      {/* Pit base */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 16]} />
        <meshLambertMaterial color={pitColor} />
      </mesh>
      
      {/* Stone ring */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.3, 1.6, 16]} />
        <meshLambertMaterial color="#555555" />
      </mesh>
      
      {/* Ember glow */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 16]} />
        <meshBasicMaterial color={emberColor} transparent opacity={0.8} />
      </mesh>
      
      {/* Flames group */}
      <group ref={flameRef}>
        {[0, 72, 144, 216, 288].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * 0.6;
          const z = Math.sin(rad) * 0.6;
          return (
            <mesh key={i} position={[x, 0.3, z]}>
              <coneGeometry args={[0.15, 0.6, 6]} />
              <meshBasicMaterial color="#FF6600" transparent opacity={0.9} />
            </mesh>
          );
        })}
        {/* Center flame */}
        <mesh position={[0, 0.4, 0]}>
          <coneGeometry args={[0.2, 0.8, 6]} />
          <meshBasicMaterial color="#FFAA00" transparent opacity={0.85} />
        </mesh>
      </group>
      
      {/* Warning glow ring */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.8, 16]} />
        <meshBasicMaterial color="#FF2200" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
