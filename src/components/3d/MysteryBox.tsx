import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '@/stores/playerStore';

type MysteryBoxProps = {
  position: { x: number; y: number; z: number };
  onCollect: () => void;
  isNight?: boolean;
};

const COLLECT_DISTANCE = 2.0;

export default function MysteryBox({ position, onCollect, isNight = false }: MysteryBoxProps) {
  const groupRef = useRef<THREE.Group>(null);
  const boxRef = useRef<THREE.Mesh>(null);
  const [collected, setCollected] = useState(false);
  const [collectAnimation, setCollectAnimation] = useState(0);
  const [floatPhase] = useState(() => Math.random() * Math.PI * 2);
  const playerPosition = usePlayerStore((state) => state.position);

  // Colors for the mystery box
  const colors = useMemo(() => ({
    box: '#FFD700',
    glow: '#FFA500',
    ribbon: '#FF1493',
    particles: '#00FFFF',
  }), []);

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;

    if (collected) {
      // Collection animation - float up and fade
      setCollectAnimation(prev => Math.min(prev + 0.05, 1));
      groupRef.current.position.y = position.y + collectAnimation * 3;
      groupRef.current.scale.setScalar(Math.max(0, 1 - collectAnimation));
      
      if (collectAnimation >= 1) {
        return;
      }
      return;
    }

    // Floating animation
    groupRef.current.position.y = position.y + Math.sin(time * 1.5 + floatPhase) * 0.2;
    
    // Slow rotation
    if (boxRef.current) {
      boxRef.current.rotation.y += 0.01;
    }

    // Check proximity to player
    const dx = playerPosition[0] - position.x;
    const dz = playerPosition[2] - position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < COLLECT_DISTANCE) {
      setCollected(true);
      onCollect();
    }
  });

  if (collected && collectAnimation >= 1) return null;

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      {/* Main box */}
      <mesh ref={boxRef}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial
          color={colors.box}
          metalness={0.7}
          roughness={0.2}
          emissive={isNight ? colors.glow : '#000000'}
          emissiveIntensity={isNight ? 0.8 : 0}
        />
      </mesh>

      {/* Question mark on top */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial
          color={colors.ribbon}
          emissive={colors.ribbon}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Ribbon horizontal */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.85, 0.15, 0.15]} />
        <meshStandardMaterial
          color={colors.ribbon}
          emissive={isNight ? colors.ribbon : '#000000'}
          emissiveIntensity={isNight ? 0.5 : 0}
        />
      </mesh>

      {/* Ribbon vertical */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.15, 0.85, 0.15]} />
        <meshStandardMaterial
          color={colors.ribbon}
          emissive={isNight ? colors.ribbon : '#000000'}
          emissiveIntensity={isNight ? 0.5 : 0}
        />
      </mesh>

      {/* Glow effect */}
      <pointLight
        position={[0, 0.5, 0]}
        intensity={isNight ? 2 : 0.5}
        distance={5}
        color={colors.glow}
      />

      {/* Particle ring effect */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 4) * Math.PI * 2) * 0.8,
            0.2 + Math.sin(Date.now() * 0.002 + i) * 0.2,
            Math.sin((i / 4) * Math.PI * 2) * 0.8,
          ]}
        >
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshBasicMaterial color={colors.particles} />
        </mesh>
      ))}
    </group>
  );
}
