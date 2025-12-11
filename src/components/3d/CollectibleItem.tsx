import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '@/stores/playerStore';

type CollectibleType = 'coin' | 'gem' | 'star';

type CollectibleProps = {
  position: [number, number, number];
  type?: CollectibleType;
  id: string;
  onCollect?: (id: string, type: CollectibleType) => void;
  isNight?: boolean;
};

const COLLECT_DISTANCE = 1.5;

const COLORS = {
  coin: { primary: '#FFD700', glow: '#FFA500' },
  gem: { primary: '#FF69B4', glow: '#FF1493' },
  star: { primary: '#00FFFF', glow: '#00CED1' },
};

export default function CollectibleItem({ 
  position, 
  type = 'coin', 
  id, 
  onCollect,
  isNight = false 
}: CollectibleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [collected, setCollected] = useState(false);
  const [floatPhase] = useState(() => Math.random() * Math.PI * 2);
  const playerPosition = usePlayerStore((state) => state.position);

  useFrame((state) => {
    if (collected || !meshRef.current) return;

    // Floating and rotation animation
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.y += 0.02;
    meshRef.current.position.y = position[1] + Math.sin(time * 2 + floatPhase) * 0.15;

    // Check if player is close enough to collect
    const dx = playerPosition[0] - position[0];
    const dz = playerPosition[2] - position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < COLLECT_DISTANCE) {
      setCollected(true);
      onCollect?.(id, type);
    }
  });

  if (collected) return null;

  const colors = COLORS[type];

  return (
    <group position={position}>
      {type === 'coin' && (
        <mesh ref={meshRef}>
          <cylinderGeometry args={[0.3, 0.3, 0.08, 16]} />
          <meshStandardMaterial 
            color={colors.primary} 
            metalness={0.8} 
            roughness={0.2}
            emissive={isNight ? colors.glow : '#000000'}
            emissiveIntensity={isNight ? 0.5 : 0}
          />
        </mesh>
      )}
      
      {type === 'gem' && (
        <mesh ref={meshRef}>
          <octahedronGeometry args={[0.25]} />
          <meshStandardMaterial 
            color={colors.primary} 
            metalness={0.3} 
            roughness={0.1}
            emissive={isNight ? colors.glow : '#000000'}
            emissiveIntensity={isNight ? 0.8 : 0}
          />
        </mesh>
      )}
      
      {type === 'star' && (
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[0.25]} />
          <meshStandardMaterial 
            color={colors.primary} 
            metalness={0.5} 
            roughness={0.2}
            emissive={colors.glow}
            emissiveIntensity={isNight ? 1 : 0.3}
          />
        </mesh>
      )}

      {/* Glow effect */}
      {isNight && (
        <pointLight 
          position={[0, 0.3, 0]} 
          intensity={0.5} 
          distance={2} 
          color={colors.glow} 
        />
      )}
    </group>
  );
}
