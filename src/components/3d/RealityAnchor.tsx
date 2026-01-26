import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMirrorWorldStore } from '@/stores/mirrorWorldStore';
import { usePlayerStore } from '@/stores/playerStore';

interface RealityAnchorProps {
  id: string;
  position: [number, number, number];
  isCollected: boolean;
}

const COLLECT_DISTANCE = 1.8;

export default function RealityAnchor({ id, position, isCollected }: RealityAnchorProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [floatPhase] = useState(() => Math.random() * Math.PI * 2);
  const playerPosition = usePlayerStore((state) => state.position);
  const { collectAnchor } = useMirrorWorldStore();

  useFrame((state) => {
    if (!meshRef.current || isCollected) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.y += 0.02;
    meshRef.current.position.y = position[1] + Math.sin(time * 2 + floatPhase) * 0.2;

    const dx = playerPosition[0] - position[0];
    const dz = playerPosition[2] - position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < COLLECT_DISTANCE) {
      collectAnchor(id);
    }
  });

  if (isCollected) return null;

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.35]} />
        <meshStandardMaterial
          color="#D6F4FF"
          emissive="#7FE7FF"
          emissiveIntensity={1}
          metalness={0.4}
          roughness={0.2}
        />
      </mesh>
      <pointLight position={[0, 0.4, 0]} intensity={0.8} distance={4} color="#7FE7FF" />
    </group>
  );
}
