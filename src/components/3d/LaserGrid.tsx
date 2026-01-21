import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LaserGridData } from '@/stores/heistStore';
import { usePlayerStore } from '@/stores/playerStore';

interface LaserGridProps extends LaserGridData {
  onPlayerHit: () => void;
}

export default function LaserGrid({
  position,
  rotation,
  width,
  height,
  pattern,
  isActive,
  cycleTime,
  onPlayerHit,
}: LaserGridProps) {
  const groupRef = useRef<THREE.Group>(null);
  const hitCooldownRef = useRef(0);
  const playerPosition = usePlayerStore((state) => state.position);

  useFrame((_, delta) => {
    if (!isActive) return;
    if (hitCooldownRef.current > 0) {
      hitCooldownRef.current -= delta;
    }

    const [px, , pz] = playerPosition;
    const [lx, , lz] = position;
    const distance = Math.hypot(px - lx, pz - lz);
    if (distance < width * 0.5 && hitCooldownRef.current <= 0) {
      onPlayerHit();
      hitCooldownRef.current = 1;
    }

    if (!groupRef.current) return;
    if (pattern === 'sweep') {
      groupRef.current.position.y = 0.6 + Math.sin(Date.now() * 0.002) * 0.6;
    }
    if (pattern === 'pulse') {
      const pulse = (Math.sin(Date.now() * 0.002 * Math.PI) + 1) / 2;
      groupRef.current.visible = pulse > 0.4;
    }
  });

  if (!isActive) return null;

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, 0.05, 0.05]} />
        <meshStandardMaterial color="#ff3b3b" emissive="#ff3b3b" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[width, 0.05, 0.05]} />
        <meshStandardMaterial color="#ff3b3b" emissive="#ff3b3b" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, 0.05, 0.05]} />
        <meshStandardMaterial color="#ff3b3b" emissive="#ff3b3b" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}
