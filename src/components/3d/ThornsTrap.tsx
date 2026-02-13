import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '@/stores/playerStore';
import { useMissionStore } from '@/stores/missionStore';

interface ThornsTrapProps {
  id: string;
  position: [number, number, number];
  isActive?: boolean;
  onPlayerHit: (trapId: string) => void;
}

const PLAYER_HIT_DISTANCE = 1.0; // Horizontal distance for collision
const PLAYER_JUMP_HEIGHT_THRESHOLD = 1.2; // Player must jump this high to avoid
const ZOMBIE_HIT_DISTANCE = 1.3;
const OPEN_DURATION = 2.0; // Seconds thorns stay open
const CLOSED_DURATION = 1.5; // Seconds thorns stay closed

/**
 * Thorns trap that opens and closes periodically
 * Damages player and slows zombies when open
 */
export default function ThornsTrap({
  id,
  position,
  isActive = true,
  onPlayerHit,
}: ThornsTrapProps) {
  const groupRef = useRef<THREE.Group>(null);
  const thornsRef = useRef<THREE.Group>(null);
  const timerRef = useRef(0);
  const hitCooldownRef = useRef(0);
  const zombieCheckRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  
  const playerPosition = usePlayerStore((state) => state.position);
  const { zombies, freezeZombie, frozenZombieIds } = useMissionStore();
  
  // Colors
  const baseColor = useMemo(() => new THREE.Color('#4A4A4A'), []);
  const thornColor = useMemo(() => new THREE.Color('#8B4513'), []);
  const thornTipColor = useMemo(() => new THREE.Color('#FF4444'), []);
  
  useFrame((_, delta) => {
    if (!groupRef.current || !thornsRef.current || !isActive) return;
    
    // Timer for open/close cycle
    timerRef.current += delta;
    const cycleDuration = OPEN_DURATION + CLOSED_DURATION;
    const cyclePosition = timerRef.current % cycleDuration;
    const shouldBeOpen = cyclePosition < OPEN_DURATION;
    
    if (shouldBeOpen !== isOpen) {
      setIsOpen(shouldBeOpen);
    }
    
    // Animate thorns
    const targetScale = shouldBeOpen ? 1 : 0.1;
    const currentScale = thornsRef.current.scale.y;
    thornsRef.current.scale.y = THREE.MathUtils.lerp(currentScale, targetScale, delta * 8);
    
    // Only check collisions when thorns are open
    if (!shouldBeOpen || thornsRef.current.scale.y < 0.5) return;
    
    const trapPos = new THREE.Vector3(...position);
    
    // Check player collision (with cooldown)
    if (hitCooldownRef.current > 0) {
      hitCooldownRef.current -= delta;
    } else {
      const playerPos = new THREE.Vector3(...playerPosition);
      
      // Horizontal distance check
      const dx = playerPos.x - trapPos.x;
      const dz = playerPos.z - trapPos.z;
      const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
      
      // Check if player is close enough horizontally AND not jumping high enough
      if (horizontalDistance < PLAYER_HIT_DISTANCE && playerPos.y < PLAYER_JUMP_HEIGHT_THRESHOLD) {
        onPlayerHit(id);
        hitCooldownRef.current = 1.5; // 1.5 second cooldown
      }
    }
    
    // Check zombie collision - freeze them for 2 seconds
    zombieCheckRef.current += delta;
    if (zombieCheckRef.current > 0.2) {
      zombieCheckRef.current = 0;
      
      for (const zombie of zombies) {
        // Skip already frozen zombies
        if (frozenZombieIds.has(zombie.id)) continue;
        
        const zombiePos = new THREE.Vector3(...zombie.position);
        const dx = zombiePos.x - trapPos.x;
        const dz = zombiePos.z - trapPos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < ZOMBIE_HIT_DISTANCE) {
          freezeZombie(zombie.id, 2000); // Freeze for 2 seconds
        }
      }
    }
  });
  
  if (!isActive) return null;
  
  return (
    <group ref={groupRef} position={position}>
      {/* Base platform */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[1.2, 1.3, 0.1, 8]} />
        <meshLambertMaterial color={baseColor} />
      </mesh>
      
      {/* Warning ring */}
      <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.1, 16]} />
        <meshBasicMaterial color={isOpen ? "#FF0000" : "#555555"} transparent opacity={0.7} />
      </mesh>
      
      {/* Thorns group - animated */}
      <group ref={thornsRef} position={[0, 0.1, 0]}>
        {/* Center thorns */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * 0.5;
          const z = Math.sin(rad) * 0.5;
          return (
            <group key={`inner-${i}`} position={[x, 0, z]}>
              <mesh>
                <coneGeometry args={[0.08, 0.8, 4]} />
                <meshLambertMaterial color={thornColor} />
              </mesh>
              <mesh position={[0, 0.35, 0]}>
                <coneGeometry args={[0.04, 0.2, 4]} />
                <meshBasicMaterial color={thornTipColor} />
              </mesh>
            </group>
          );
        })}
        
        {/* Outer thorns */}
        {[30, 90, 150, 210, 270, 330].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * 0.9;
          const z = Math.sin(rad) * 0.9;
          return (
            <group key={`outer-${i}`} position={[x, 0, z]}>
              <mesh>
                <coneGeometry args={[0.06, 0.6, 4]} />
                <meshLambertMaterial color={thornColor} />
              </mesh>
              <mesh position={[0, 0.25, 0]}>
                <coneGeometry args={[0.03, 0.15, 4]} />
                <meshBasicMaterial color={thornTipColor} />
              </mesh>
            </group>
          );
        })}
      </group>
      
      {/* Glow removed for performance */}
    </group>
  );
}
