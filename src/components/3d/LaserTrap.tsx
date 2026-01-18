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

const PLAYER_RADIUS = 0.45;
const BEAM_RADIUS = 0.08;
const PLAYER_HIT_DISTANCE = PLAYER_RADIUS + BEAM_RADIUS; // Match player body width for reliable hits
const BEAM_AVOID_CLEARANCE = 0.1; // Extra height needed above the beam to avoid it
const ZOMBIE_HIT_DISTANCE = 0.8; // Distance for zombie detection

const getSegmentDistance2D = (
  aStart: THREE.Vector2,
  aEnd: THREE.Vector2,
  bStart: THREE.Vector2,
  bEnd: THREE.Vector2
): number => {
  const getPointToSegmentDistance = (point: THREE.Vector2, segStart: THREE.Vector2, segEnd: THREE.Vector2) => {
    const seg = segEnd.clone().sub(segStart);
    const segLengthSq = seg.lengthSq();
    if (segLengthSq === 0) {
      return point.distanceTo(segStart);
    }
    const t = Math.max(0, Math.min(1, point.clone().sub(segStart).dot(seg) / segLengthSq));
    const projection = segStart.clone().add(seg.multiplyScalar(t));
    return point.distanceTo(projection);
  };

  const cross = (a: THREE.Vector2, b: THREE.Vector2) => a.x * b.y - a.y * b.x;
  const direction = (a: THREE.Vector2, b: THREE.Vector2, c: THREE.Vector2) =>
    cross(c.clone().sub(a), b.clone().sub(a));
  const onSegment = (a: THREE.Vector2, b: THREE.Vector2, c: THREE.Vector2) =>
    Math.min(a.x, b.x) <= c.x + 1e-6 &&
    Math.max(a.x, b.x) >= c.x - 1e-6 &&
    Math.min(a.y, b.y) <= c.y + 1e-6 &&
    Math.max(a.y, b.y) >= c.y - 1e-6;

  const d1 = direction(aStart, aEnd, bStart);
  const d2 = direction(aStart, aEnd, bEnd);
  const d3 = direction(bStart, bEnd, aStart);
  const d4 = direction(bStart, bEnd, aEnd);

  const intersects =
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));

  const colinearIntersection =
    Math.abs(d1) < 1e-6 && onSegment(aStart, aEnd, bStart) ||
    Math.abs(d2) < 1e-6 && onSegment(aStart, aEnd, bEnd) ||
    Math.abs(d3) < 1e-6 && onSegment(bStart, bEnd, aStart) ||
    Math.abs(d4) < 1e-6 && onSegment(bStart, bEnd, aEnd);

  if (intersects || colinearIntersection) {
    return 0;
  }

  const distanceA = getPointToSegmentDistance(aStart, bStart, bEnd);
  const distanceB = getPointToSegmentDistance(aEnd, bStart, bEnd);
  const distanceC = getPointToSegmentDistance(bStart, aStart, aEnd);
  const distanceD = getPointToSegmentDistance(bEnd, aStart, aEnd);

  return Math.min(distanceA, distanceB, distanceC, distanceD);
};

/**
 * Laser beam trap that damages player and slows zombies
 * Visual: Red pulsing laser beam between two posts
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
  const zombieSlowCooldownRef = useRef<Record<string, number>>({});
  const lastPlayerPosRef = useRef<THREE.Vector3 | null>(null);
  
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
    const playerPos = new THREE.Vector3(...playerPosition);
    const lastPlayerPos = lastPlayerPosRef.current ?? playerPos.clone();
    if (hitCooldownRef.current > 0) {
      hitCooldownRef.current -= delta;
    } else {
      const playerToStart = playerPos.clone().sub(start);
      
      const t = Math.max(0, Math.min(1, playerToStart.dot(lineVec) / lineVec.lengthSq()));
      const closestPoint = start.clone().add(lineVec.clone().multiplyScalar(t));
      
      const playerSegmentStart = new THREE.Vector2(lastPlayerPos.x, lastPlayerPos.z);
      const playerSegmentEnd = new THREE.Vector2(playerPos.x, playerPos.z);
      const beamSegmentStart = new THREE.Vector2(start.x, start.z);
      const beamSegmentEnd = new THREE.Vector2(end.x, end.z);

      const segmentDistance = getSegmentDistance2D(
        playerSegmentStart,
        playerSegmentEnd,
        beamSegmentStart,
        beamSegmentEnd
      );
      const minPlayerHeight = Math.min(lastPlayerPos.y, playerPos.y);
      const beamHeight = start.y;
      
      // Player can avoid laser by jumping high enough above the beam height.
      if (segmentDistance < PLAYER_HIT_DISTANCE && minPlayerHeight < beamHeight + BEAM_AVOID_CLEARANCE) {
        onPlayerHit(id);
        hitCooldownRef.current = 1.5; // 1.5 second cooldown between hits
      }
    }

    lastPlayerPosRef.current = playerPos;
    
    // Update zombie slow cooldowns
    for (const zombieId of Object.keys(zombieSlowCooldownRef.current)) {
      zombieSlowCooldownRef.current[zombieId] -= delta;
      if (zombieSlowCooldownRef.current[zombieId] <= 0) {
        delete zombieSlowCooldownRef.current[zombieId];
      }
    }
    
    // Check zombie collision (less frequent for performance)
    zombieCheckRef.current += delta;
    if (zombieCheckRef.current > 0.15) { // Check every 150ms
      zombieCheckRef.current = 0;
      
      for (const zombie of zombies) {
        // Skip if this zombie was recently slowed by this trap
        if (zombieSlowCooldownRef.current[zombie.id] && zombieSlowCooldownRef.current[zombie.id] > 0) {
          continue;
        }
        
        const zombiePos = new THREE.Vector3(...zombie.position);
        const zombieToStart = zombiePos.clone().sub(start);
        
        const t = Math.max(0, Math.min(1, zombieToStart.dot(lineVec) / lineVec.lengthSq()));
        const closestPoint = start.clone().add(lineVec.clone().multiplyScalar(t));
        
        const dx = zombiePos.x - closestPoint.x;
        const dz = zombiePos.z - closestPoint.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < ZOMBIE_HIT_DISTANCE) {
          slowZombie(zombie.id);
          // Set cooldown so we don't spam slow the same zombie
          zombieSlowCooldownRef.current[zombie.id] = 3.5; // Slightly longer than slow duration
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
