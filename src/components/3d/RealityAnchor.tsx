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

const COLLECT_DISTANCE = 4.5;

export default function RealityAnchor({ id, position, isCollected }: RealityAnchorProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [floatPhase] = useState(() => Math.random() * Math.PI * 2);
  const playerPosition = usePlayerStore((state) => state.position);
  const collectAnchor = useMirrorWorldStore((state) => state.collectAnchor);

  useFrame((state) => {
    if (!meshRef.current || isCollected) return;
    const time = state.clock.elapsedTime;

    // Float and rotate
    meshRef.current.rotation.y += 0.03;
    meshRef.current.position.y = position[1] + Math.sin(time * 3 + floatPhase) * 0.3;

    // Distance check
    const dx = playerPosition[0] - position[0];
    const dy = playerPosition[1] - position[1];
    const dz = playerPosition[2] - position[2];
    const distanceXZ = Math.sqrt(dx * dx + dz * dz);
    const sameLevel = Math.abs(dy) < 3.5;

    if (distanceXZ < COLLECT_DISTANCE && sameLevel) {
      collectAnchor(id);
    }
  });

  if (isCollected) return null;

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.5]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={1.5}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>
      <pointLight position={[0, 0.5, 0]} intensity={1.5} distance={5} color="#a855f7" />
      {/* Beam of light above anchor */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.08, 0.15, 3, 8]} />
        <meshBasicMaterial color="#c084fc" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}
