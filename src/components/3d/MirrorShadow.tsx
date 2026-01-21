import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMirrorWorldStore } from '@/stores/mirrorWorldStore';
import { usePlayerStore } from '@/stores/playerStore';

const BOUNDS = 70;
const COLLISION_DISTANCE = 2;

export default function MirrorShadow() {
  const meshRef = useRef<THREE.Group>(null);
  const lastPlayerPos = useRef<[number, number, number] | null>(null);
  const playerPosition = usePlayerStore((state) => state.position);
  const {
    shadowPosition,
    shadowSpeed,
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
    const distance = Math.sqrt(distX * distX + distZ * distZ);

    if (distance < COLLISION_DISTANCE && !isProtected) {
      hitByShadow();
    }
  });

  if (phase !== 'hunting') return null;

  return (
    <group ref={meshRef} position={shadowPosition}>
      <mesh>
        <cylinderGeometry args={[0.9, 1.1, 2.4, 12]} />
        <meshStandardMaterial color="#1A0B24" emissive="#3B0A54" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 1.1, 0.7]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#FF4B4B" emissive="#FF4B4B" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.3, 1.1, 0.7]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#FF4B4B" emissive="#FF4B4B" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0, 1.2, 0.6]} intensity={1.4} distance={6} color="#FF4B4B" />
    </group>
  );
}
