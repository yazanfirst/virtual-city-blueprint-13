import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMirrorWorldStore } from '@/stores/mirrorWorldStore';
import { usePlayerStore } from '@/stores/playerStore';
import LowPolyCharacter from './LowPolyCharacter';

const BOUNDS = 70;

// Same ladder positions as MirrorWorldUI
const LADDER_POSITIONS = [
  { base: [13.6, 0, 40] as [number, number, number], top: [18, 8.2, 40] as [number, number, number] },
  { base: [-13.6, 0, 28] as [number, number, number], top: [-18, 8.2, 28] as [number, number, number] },
  { base: [47, 0, 13.6] as [number, number, number], top: [47, 8.2, 18] as [number, number, number] },
  { base: [-35, 0, -13.6] as [number, number, number], top: [-35, 8.2, -18] as [number, number, number] },
  { base: [13.6, 0, -40] as [number, number, number], top: [18, 8.2, -40] as [number, number, number] },
];

const CLIMB_SPEED = 5.5; // units per second for vertical climb
const LADDER_APPROACH_DIST = 4; // how close shadow needs to be to start climbing

interface SingleShadowProps {
  index: number;
  initialPosition: [number, number, number];
}

function SingleShadow({ index, initialPosition }: SingleShadowProps) {
  const meshRef = useRef<THREE.Group>(null);
  const lastPlayerPos = useRef<[number, number, number] | null>(null);
  const playerVelocity = useRef({ x: 0, z: 0 });
  const [isWalking, setIsWalking] = useState(false);
  const [currentPos, setCurrentPos] = useState<[number, number, number]>(initialPosition);
  const isClimbing = useRef(false);
  const targetY = useRef(initialPosition[1]);
  const climbPulse = useRef(0);

  const playerPosition = usePlayerStore((state) => state.position);
  const {
    shadowSpeed,
    collisionDistance,
    isProtected,
    phase,
    isPaused,
    updateShadowPosition,
    hitByShadow,
  } = useMirrorWorldStore();

  // Mirror direction varies per shadow for variety
  const mirrorMultiplier = useMemo(() => {
    const patterns = [
      { x: -1, z: -1 },   // Primary: mirrors both axes
      { x: 1, z: -1 },    // Second: mirrors only Z
      { x: -1, z: 1 },    // Third: mirrors only X
    ];
    return patterns[index % patterns.length];
  }, [index]);

  useFrame((_, delta) => {
    if (phase !== 'hunting' || isPaused) return;
    if (!lastPlayerPos.current) {
      lastPlayerPos.current = [...playerPosition];
      return;
    }

    const dx = playerPosition[0] - lastPlayerPos.current[0];
    const dz = playerPosition[2] - lastPlayerPos.current[2];
    playerVelocity.current = {
      x: dx / Math.max(delta, 0.016),
      z: dz / Math.max(delta, 0.016),
    };
    const moving = Math.abs(playerVelocity.current.x) + Math.abs(playerVelocity.current.z) > 0.2;
    if (moving !== isWalking) {
      setIsWalking(moving);
    }
    lastPlayerPos.current = [...playerPosition];

    const playerOnRoof = playerPosition[1] >= 7.5;
    const shadowOnGround = currentPos[1] < 2;
    const shadowOnRoof = currentPos[1] >= 7.5;

    // Determine if shadow should climb or descend
    if (playerOnRoof && shadowOnGround) {
      // Find nearest ladder base
      let nearestLadder = LADDER_POSITIONS[0];
      let nearestDist = Infinity;
      for (const ladder of LADDER_POSITIONS) {
        const ldx = ladder.base[0] - currentPos[0];
        const ldz = ladder.base[2] - currentPos[2];
        const dist = Math.sqrt(ldx * ldx + ldz * ldz);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestLadder = ladder;
        }
      }

      if (nearestDist < LADDER_APPROACH_DIST) {
        // Close enough to ladder — start climbing
        isClimbing.current = true;
        targetY.current = nearestLadder.top[1];
      } else {
        // Move toward nearest ladder base (override mirror movement)
        const toX = nearestLadder.base[0] - currentPos[0];
        const toZ = nearestLadder.base[2] - currentPos[2];
        const len = Math.sqrt(toX * toX + toZ * toZ);
        if (len > 0.1) {
          const moveSpeed = shadowSpeed * 60 * delta;
          const nextX = THREE.MathUtils.clamp(currentPos[0] + (toX / len) * moveSpeed, -BOUNDS, BOUNDS);
          const nextZ = THREE.MathUtils.clamp(currentPos[2] + (toZ / len) * moveSpeed, -BOUNDS, BOUNDS);
          const newPos: [number, number, number] = [nextX, currentPos[1], nextZ];
          setCurrentPos(newPos);
          updateShadowPosition(index, newPos);
          if (meshRef.current) meshRef.current.position.set(nextX, currentPos[1], nextZ);
        }
        // Check collision even while approaching
        const distToPlayer = Math.sqrt(
          (playerPosition[0] - currentPos[0]) ** 2 +
          (playerPosition[1] - currentPos[1]) ** 2 +
          (playerPosition[2] - currentPos[2]) ** 2
        );
        if (distToPlayer < collisionDistance && !isProtected) hitByShadow();
        return;
      }
    } else if (!playerOnRoof && shadowOnRoof) {
      // Player dropped down — shadow should descend
      isClimbing.current = true;
      // Find nearest ladder top to descend from
      let nearestLadder = LADDER_POSITIONS[0];
      let nearestDist = Infinity;
      for (const ladder of LADDER_POSITIONS) {
        const ldx = ladder.top[0] - currentPos[0];
        const ldz = ladder.top[2] - currentPos[2];
        const dist = Math.sqrt(ldx * ldx + ldz * ldz);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestLadder = ladder;
        }
      }
      targetY.current = 1;
    }

    // Handle climbing animation
    if (isClimbing.current) {
      climbPulse.current += delta * 8;
      const currentY = currentPos[1];
      const diff = targetY.current - currentY;
      if (Math.abs(diff) < 0.2) {
        // Finished climbing
        isClimbing.current = false;
        const newPos: [number, number, number] = [currentPos[0], targetY.current, currentPos[2]];
        setCurrentPos(newPos);
        updateShadowPosition(index, newPos);
        if (meshRef.current) meshRef.current.position.set(newPos[0], newPos[1], newPos[2]);
      } else {
        // Lerp Y position
        const step = Math.sign(diff) * CLIMB_SPEED * delta;
        const nextY = Math.abs(step) > Math.abs(diff) ? targetY.current : currentY + step;
        const newPos: [number, number, number] = [currentPos[0], nextY, currentPos[2]];
        setCurrentPos(newPos);
        updateShadowPosition(index, newPos);
        if (meshRef.current) meshRef.current.position.set(newPos[0], nextY, newPos[2]);
      }
      // Check collision during climb
      const distToPlayer = Math.sqrt(
        (playerPosition[0] - currentPos[0]) ** 2 +
        (playerPosition[1] - currentPos[1]) ** 2 +
        (playerPosition[2] - currentPos[2]) ** 2
      );
      if (distToPlayer < collisionDistance && !isProtected) hitByShadow();
      return;
    }

    // Normal mirrored movement
    const mirroredX = dx * mirrorMultiplier.x;
    const mirroredZ = dz * mirrorMultiplier.z;

    const nextX = THREE.MathUtils.clamp(
      currentPos[0] + mirroredX * shadowSpeed * 60 * delta,
      -BOUNDS,
      BOUNDS
    );
    const nextZ = THREE.MathUtils.clamp(
      currentPos[2] + mirroredZ * shadowSpeed * 60 * delta,
      -BOUNDS,
      BOUNDS
    );

    const newPos: [number, number, number] = [nextX, currentPos[1], nextZ];
    setCurrentPos(newPos);
    updateShadowPosition(index, newPos);

    if (meshRef.current) {
      meshRef.current.position.set(nextX, currentPos[1], nextZ);
    }

    const distX = playerPosition[0] - nextX;
    const distY = playerPosition[1] - currentPos[1];
    const distZ = playerPosition[2] - nextZ;
    const distanceToPlayer = Math.sqrt(distX * distX + distY * distY + distZ * distZ);

    if (distanceToPlayer < collisionDistance && !isProtected) {
      hitByShadow();
    }
  });

  const rotation = useMemo(() => {
    const rdx = playerPosition[0] - currentPos[0];
    const rdz = playerPosition[2] - currentPos[2];
    return Math.atan2(rdx, rdz);
  }, [playerPosition, currentPos]);

  // Slightly different colors per shadow for visual distinction
  const shadowColors = ['#2D0A3E', '#1A0533', '#3D1050'];
  const emissiveColors = ['#FF0066', '#CC0055', '#FF3388'];

  // Climbing pulse effect — aura pulses faster while climbing
  const auraOpacity = isClimbing.current ? 0.3 + Math.sin(climbPulse.current) * 0.15 : 0.3;

  return (
    <group ref={meshRef} position={currentPos}>
      <LowPolyCharacter
        position={[0, 0, 0]}
        rotation={rotation}
        clothingColor={shadowColors[index % shadowColors.length]}
        isNight
        isWalking={isWalking}
      />
      {/* Shadow aura - reduced geometry */}
      <mesh>
        <sphereGeometry args={[1.5, 12, 12]} />
        <meshStandardMaterial 
          color="#1A0B24" 
          transparent 
          opacity={auraOpacity} 
          side={THREE.BackSide} 
          emissive={emissiveColors[index % emissiveColors.length]} 
          emissiveIntensity={isClimbing.current ? 0.7 : 0.4} 
        />
      </mesh>
    </group>
  );
}

export default function MirrorShadow() {
  const { shadowPositions, shadowCount, phase } = useMirrorWorldStore();

  if (phase !== 'hunting') return null;

  return (
    <>
      {shadowPositions.slice(0, shadowCount).map((pos, index) => (
        <SingleShadow
          key={`shadow-${index}`}
          index={index}
          initialPosition={pos}
        />
      ))}
    </>
  );
}
