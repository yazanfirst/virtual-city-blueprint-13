import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '@/stores/playerStore';
import { useMissionStore } from '@/stores/missionStore';

interface SwingingAxeTrapProps {
  id: string;
  position: [number, number, number];
  rotation?: number;
  isActive?: boolean;
  onPlayerHit: (trapId: string) => void;
}

// Simple collision detection
const PLAYER_HIT_RADIUS = 1.0;
const AXE_SWING_RADIUS = 2.5; // How far the axe swings
const ZOMBIE_HIT_RADIUS = 1.2;

/**
 * Swinging axe trap - pendulum that swings back and forth
 * Player must time their movement to pass through safely
 * Simple distance-based collision at the axe head position
 */
export default function SwingingAxeTrap({
  id,
  position,
  rotation = 0,
  isActive = true,
  onPlayerHit,
}: SwingingAxeTrapProps) {
  const groupRef = useRef<THREE.Group>(null);
  const axeArmRef = useRef<THREE.Group>(null);
  const hitCooldownRef = useRef(0);
  const zombieCheckRef = useRef(0);
  const zombieCooldowns = useRef<Record<string, number>>({});
  const timeRef = useRef(Math.random() * Math.PI * 2); // Random start phase
  
  const playerPosition = usePlayerStore((state) => state.position);
  const { zombies, freezeZombie, frozenZombieIds } = useMissionStore();
  
  // Colors
  const woodColor = useMemo(() => new THREE.Color('#5A3A1A'), []);
  const metalColor = useMemo(() => new THREE.Color('#666666'), []);
  const bladeColor = useMemo(() => new THREE.Color('#AAAAAA'), []);
  
  // Get current axe head position based on swing
  const getAxeHeadPosition = (swingAngle: number): THREE.Vector3 => {
    // Axe arm is 3 units long, rotated around the pivot
    const armLength = 3;
    const localX = Math.sin(swingAngle) * armLength;
    const localY = 3 - Math.cos(swingAngle) * armLength; // 3 is pivot height
    
    // Apply trap rotation to get world position
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);
    
    return new THREE.Vector3(
      position[0] + localX * cosR,
      localY,
      position[2] + localX * sinR
    );
  };
  
  useFrame((_, delta) => {
    if (!groupRef.current || !axeArmRef.current || !isActive) return;
    
    timeRef.current += delta;
    
    // Swing motion: -60° to +60° (about 1 radian each way)
    const swingAngle = Math.sin(timeRef.current * 2.5) * 1.0;
    axeArmRef.current.rotation.z = swingAngle;
    
    // Get current axe head world position
    const axeHeadPos = getAxeHeadPosition(swingAngle);
    
    // Check player collision (with cooldown)
    if (hitCooldownRef.current > 0) {
      hitCooldownRef.current -= delta;
    } else {
      const playerPos = new THREE.Vector3(...playerPosition);
      
      // 3D distance to axe head
      const distance = playerPos.distanceTo(axeHeadPos);
      
      if (distance < PLAYER_HIT_RADIUS) {
        onPlayerHit(id);
        hitCooldownRef.current = 1.5; // 1.5 second cooldown
      }
    }
    
    // Check zombie collision
    zombieCheckRef.current += delta;
    if (zombieCheckRef.current > 0.2) {
      zombieCheckRef.current = 0;
      const now = Date.now();
      
      for (const zombie of zombies) {
        // Skip if on cooldown or already frozen
        if (zombieCooldowns.current[zombie.id] && zombieCooldowns.current[zombie.id] > now) continue;
        if (frozenZombieIds.has(zombie.id)) continue;
        
        const zombiePos = new THREE.Vector3(...zombie.position);
        const distance = zombiePos.distanceTo(axeHeadPos);
        
        if (distance < ZOMBIE_HIT_RADIUS) {
          freezeZombie(zombie.id, 2000); // Freeze for 2 seconds
          zombieCooldowns.current[zombie.id] = now + 2500; // 2.5s cooldown
        }
      }
    }
  });
  
  if (!isActive) return null;
  
  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Support frame */}
      <mesh position={[-1.2, 2, 0]}>
        <boxGeometry args={[0.3, 4, 0.3]} />
        <meshLambertMaterial color={woodColor} />
      </mesh>
      <mesh position={[1.2, 2, 0]}>
        <boxGeometry args={[0.3, 4, 0.3]} />
        <meshLambertMaterial color={woodColor} />
      </mesh>
      {/* Top beam */}
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[3, 0.4, 0.4]} />
        <meshLambertMaterial color={woodColor} />
      </mesh>
      
      {/* Swinging axe arm */}
      <group ref={axeArmRef} position={[0, 3.5, 0]}>
        {/* Chain/rope */}
        <mesh position={[0, -0.8, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.6, 6]} />
          <meshLambertMaterial color={metalColor} />
        </mesh>
        
        {/* Axe handle */}
        <mesh position={[0, -2.2, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 1.2, 8]} />
          <meshLambertMaterial color={woodColor} />
        </mesh>
        
        {/* Axe head */}
        <group position={[0, -2.8, 0]}>
          {/* Main blade */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.6, 0.15, 0.8]} />
            <meshLambertMaterial color={bladeColor} />
          </mesh>
          {/* Blade edge (sharp part) */}
          <mesh position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.7, 0.08, 0.9]} />
            <meshBasicMaterial color="#CCCCCC" />
          </mesh>
          {/* Red warning glow */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshBasicMaterial color="#FF0000" transparent opacity={0.15} />
          </mesh>
        </group>
      </group>
      
      {/* Ground warning zone */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2, 16]} />
        <meshBasicMaterial color="#FF4400" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}
