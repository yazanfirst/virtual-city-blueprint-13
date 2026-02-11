import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMirrorWorldStore } from '@/stores/mirrorWorldStore';
import { usePlayerStore } from '@/stores/playerStore';
import LowPolyCharacter from './LowPolyCharacter';

const BOUNDS = 70;

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
    // Each shadow mirrors differently for unpredictable movement
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
    const distZ = playerPosition[2] - nextZ;
    const distanceToPlayer = Math.sqrt(distX * distX + distZ * distZ);

    if (distanceToPlayer < collisionDistance && !isProtected) {
      hitByShadow();
    }
  });

  const rotation = useMemo(() => {
    const dx = playerPosition[0] - currentPos[0];
    const dz = playerPosition[2] - currentPos[2];
    return Math.atan2(dx, dz);
  }, [playerPosition, currentPos]);

  // Slightly different colors per shadow for visual distinction
  const shadowColors = ['#2D0A3E', '#1A0533', '#3D1050'];
  const emissiveColors = ['#FF0066', '#CC0055', '#FF3388'];

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
          opacity={0.3} 
          side={THREE.BackSide} 
          emissive={emissiveColors[index % emissiveColors.length]} 
          emissiveIntensity={0.4} 
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
