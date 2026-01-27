import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMirrorWorldStore } from '@/stores/mirrorWorldStore';
import { usePlayerStore } from '@/stores/playerStore';
import LowPolyCharacter from './LowPolyCharacter';

const BOUNDS = 70;
export default function MirrorShadow() {
  const meshRef = useRef<THREE.Group>(null);
  const lastPlayerPos = useRef<[number, number, number] | null>(null);
  const playerVelocity = useRef({ x: 0, z: 0 });
  const [isWalking, setIsWalking] = useState(false);
  const playerPosition = usePlayerStore((state) => state.position);
  const {
    shadowPosition,
    shadowSpeed,
    collisionDistance,
    isProtected,
    phase,
    updateShadowPosition,
    hitByShadow,
  } = useMirrorWorldStore();

  useFrame((_, delta) => {
    if (phase !== 'hunting') return;
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

    const mirroredX = -dx;
    const mirroredZ = -dz;

    const nextX = THREE.MathUtils.clamp(
      shadowPosition[0] + mirroredX * shadowSpeed * 60 * delta,
      -BOUNDS,
      BOUNDS
    );
    const nextZ = THREE.MathUtils.clamp(
      shadowPosition[2] + mirroredZ * shadowSpeed * 60 * delta,
      -BOUNDS,
      BOUNDS
    );

    updateShadowPosition([nextX, shadowPosition[1], nextZ]);

    if (meshRef.current) {
      meshRef.current.position.set(nextX, shadowPosition[1], nextZ);
    }

    const distX = playerPosition[0] - nextX;
    const distZ = playerPosition[2] - nextZ;
    const distanceToPlayer = Math.sqrt(distX * distX + distZ * distZ);

    if (distanceToPlayer < collisionDistance && !isProtected) {
      hitByShadow();
    }
  });

  if (phase !== 'hunting') return null;

  const rotation = useMemo(() => {
    const dx = playerPosition[0] - shadowPosition[0];
    const dz = playerPosition[2] - shadowPosition[2];
    return Math.atan2(dx, dz);
  }, [playerPosition, shadowPosition]);

  return (
    <group ref={meshRef} position={shadowPosition}>
      <LowPolyCharacter
        position={[0, 0, 0]}
        rotation={rotation}
        clothingColor="#2D0A3E"
        isNight
        isWalking={isWalking}
      />
      <mesh>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#1A0B24" transparent opacity={0.3} side={THREE.BackSide} />
      </mesh>
      <pointLight position={[0, 1.5, 0.3]} intensity={2} distance={5} color="#FF0066" />
    </group>
  );
}
