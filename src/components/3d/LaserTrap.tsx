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

// Collision thresholds
const PLAYER_HIT_RADIUS = 0.15; // Player collision radius - VERY tight to avoid false hits
const LASER_BEAM_HEIGHT = 0.9; // Laser Y position
const PLAYER_JUMP_CLEARANCE = 0.6; // Player must be this high above laser to clear it
const ZOMBIE_HIT_DISTANCE = 0.4; // Distance for zombie detection

/**
 * Laser beam trap that damages player and freezes zombies
 * Uses swept collision detection to catch fast-moving players
 * Player can jump over the laser to avoid damage
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
  const zombieFrozenUntilRef = useRef<Record<string, number>>({});
  const lastPlayerPosRef = useRef<THREE.Vector3 | null>(null);
  
  const playerPosition = usePlayerStore((state) => state.position);
  const { zombies, freezeZombie } = useMissionStore();
  
  // Laser colors
  const laserColor = useMemo(() => new THREE.Color('#FF0000'), []);
  const postColor = useMemo(() => new THREE.Color('#333333'), []);
  
  // Helper: Get closest point on line segment to a point
  const closestPointOnSegment = (point: THREE.Vector3, lineStart: THREE.Vector3, lineEnd: THREE.Vector3): THREE.Vector3 => {
    const lineVec = lineEnd.clone().sub(lineStart);
    const pointVec = point.clone().sub(lineStart);
    const lineLenSq = lineVec.lengthSq();
    if (lineLenSq === 0) return lineStart.clone();
    
    const t = Math.max(0, Math.min(1, pointVec.dot(lineVec) / lineLenSq));
    return lineStart.clone().add(lineVec.multiplyScalar(t));
  };
  
  // Helper: Check if line segment intersects with another line segment (2D, XZ plane)
  const segmentsIntersect2D = (
    a1: THREE.Vector3, a2: THREE.Vector3, 
    b1: THREE.Vector3, b2: THREE.Vector3,
    threshold: number
  ): boolean => {
    // Check if the swept path (a1->a2) passes within threshold of laser line (b1->b2)
    // Sample multiple points along the movement path
    const steps = Math.max(3, Math.ceil(a1.distanceTo(a2) / 0.2)); // Sample every 0.2 units
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const samplePoint = a1.clone().lerp(a2, t);
      const closest = closestPointOnSegment(samplePoint, b1, b2);
      
      const dx = samplePoint.x - closest.x;
      const dz = samplePoint.z - closest.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < threshold) {
        return true;
      }
    }
    return false;
  };
  
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
    
    const laserStart = new THREE.Vector3(
      trapPos.x - halfLength * sin,
      trapPos.y + LASER_BEAM_HEIGHT,
      trapPos.z - halfLength * cos
    );
    const laserEnd = new THREE.Vector3(
      trapPos.x + halfLength * sin,
      trapPos.y + LASER_BEAM_HEIGHT,
      trapPos.z + halfLength * cos
    );
    
    // Current player position
    const currentPlayerPos = new THREE.Vector3(...playerPosition);
    
    // Check player collision (with cooldown)
    if (hitCooldownRef.current > 0) {
      hitCooldownRef.current -= delta;
    } else {
      // Player height check - can jump over laser
      const playerAboveLaser = currentPlayerPos.y > (LASER_BEAM_HEIGHT + PLAYER_JUMP_CLEARANCE);
      
      if (!playerAboveLaser) {
        let hit = false;
        
        // Swept collision: check path from last frame to current frame
        if (lastPlayerPosRef.current) {
          // Use swept collision detection for fast movement
          hit = segmentsIntersect2D(
            lastPlayerPosRef.current,
            currentPlayerPos,
            laserStart,
            laserEnd,
            PLAYER_HIT_RADIUS
          );
        } else {
          // First frame - just check current position
          const closest = closestPointOnSegment(currentPlayerPos, laserStart, laserEnd);
          const dx = currentPlayerPos.x - closest.x;
          const dz = currentPlayerPos.z - closest.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          hit = dist < PLAYER_HIT_RADIUS;
        }
        
        if (hit) {
          onPlayerHit(id);
          hitCooldownRef.current = 1.5; // 1.5 second cooldown between hits
        }
      }
    }
    
    // Store current position for next frame's swept collision
    lastPlayerPosRef.current = currentPlayerPos.clone();
    
    // Update zombie freeze cooldowns
    const now = Date.now();
    for (const zombieId of Object.keys(zombieFrozenUntilRef.current)) {
      if (zombieFrozenUntilRef.current[zombieId] <= now) {
        delete zombieFrozenUntilRef.current[zombieId];
      }
    }
    
    // Check zombie collision (less frequent for performance)
    zombieCheckRef.current += delta;
    if (zombieCheckRef.current > 0.1) { // Check every 100ms
      zombieCheckRef.current = 0;
      
      for (const zombie of zombies) {
        // Skip if this zombie was recently frozen by this trap
        if (zombieFrozenUntilRef.current[zombie.id] && zombieFrozenUntilRef.current[zombie.id] > now) {
          continue;
        }
        
        const zombiePos = new THREE.Vector3(...zombie.position);
        const closest = closestPointOnSegment(zombiePos, laserStart, laserEnd);
        
        const dx = zombiePos.x - closest.x;
        const dz = zombiePos.z - closest.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < ZOMBIE_HIT_DISTANCE) {
          // Freeze zombie for 2 seconds (2000ms)
          freezeZombie(zombie.id, 2000);
          // Set cooldown so we don't spam freeze the same zombie (2.5s)
          zombieFrozenUntilRef.current[zombie.id] = now + 2500;
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
      
      {/* Glow effect - reduced for performance */}
    </group>
  );
}
