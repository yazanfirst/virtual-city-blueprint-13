import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '@/stores/playerStore';
import { BoxRarity } from '@/stores/gameStore';

type MysteryBoxProps = {
  id: string;
  position: [number, number, number];
  rarity: BoxRarity;
  isMoving?: boolean;
  onCollect: (id: string) => void;
  onDecoyTrigger?: (id: string) => void;
  isNight?: boolean;
  isFeverMode?: boolean;
};

const COLLECT_DISTANCE = 2;

const RARITY_COLORS = {
  common: { primary: '#CD7F32', glow: '#B8860B', emissive: '#8B4513' },
  rare: { primary: '#C0C0C0', glow: '#E8E8E8', emissive: '#A9A9A9' },
  legendary: { primary: '#FFD700', glow: '#FFA500', emissive: '#FF8C00' },
  decoy: { primary: '#CD7F32', glow: '#8B4513', emissive: '#654321' },
};

export default function MysteryBox({
  id,
  position,
  rarity,
  isMoving = false,
  onCollect,
  onDecoyTrigger,
  isNight = false,
  isFeverMode = false,
}: MysteryBoxProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [collected, setCollected] = useState(false);
  const [floatPhase] = useState(() => Math.random() * Math.PI * 2);
  const [movePhase] = useState(() => Math.random() * Math.PI * 2);
  const [currentPos, setCurrentPos] = useState(position);
  const playerPosition = usePlayerStore((state) => state.position);

  const colors = RARITY_COLORS[rarity];
  const glowIntensity = isFeverMode ? 1.5 : isNight ? 0.8 : 0.4;

  useFrame((state) => {
    if (collected || !groupRef.current) return;

    const time = state.clock.elapsedTime;

    // Floating animation
    groupRef.current.position.y = currentPos[1] + Math.sin(time * 2 + floatPhase) * 0.2;

    // Rotation animation (faster for rare/legendary)
    const rotationSpeed = rarity === 'legendary' ? 0.04 : rarity === 'rare' ? 0.03 : 0.02;
    groupRef.current.rotation.y += rotationSpeed;

    // Moving behavior for some rare boxes
    if (isMoving) {
      const moveX = Math.sin(time * 0.5 + movePhase) * 3;
      const moveZ = Math.cos(time * 0.3 + movePhase) * 2;
      groupRef.current.position.x = position[0] + moveX;
      groupRef.current.position.z = position[2] + moveZ;
      setCurrentPos([position[0] + moveX, position[1], position[2] + moveZ]);
    } else {
      groupRef.current.position.x = position[0];
      groupRef.current.position.z = position[2];
    }

    // Check if player is close enough to collect
    const dx = playerPosition[0] - (isMoving ? currentPos[0] : position[0]);
    const dz = playerPosition[2] - (isMoving ? currentPos[2] : position[2]);
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < COLLECT_DISTANCE) {
      setCollected(true);
      if (rarity === 'decoy') {
        onDecoyTrigger?.(id);
      } else {
        onCollect(id);
      }
    }
  });

  if (collected) return null;

  const boxSize = rarity === 'legendary' ? 0.7 : rarity === 'rare' ? 0.6 : 0.5;

  return (
    <group ref={groupRef} position={position}>
      {/* Main box */}
      <mesh>
        <boxGeometry args={[boxSize, boxSize, boxSize]} />
        <meshStandardMaterial
          color={colors.primary}
          metalness={rarity === 'legendary' ? 0.9 : 0.7}
          roughness={0.2}
          emissive={colors.emissive}
          emissiveIntensity={glowIntensity}
        />
      </mesh>

      {/* Question mark on top for rare/legendary */}
      {(rarity === 'rare' || rarity === 'legendary') && (
        <mesh position={[0, boxSize / 2 + 0.1, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFFFFF"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}

      {/* Ribbon/bow decoration */}
      <mesh position={[0, boxSize / 2, 0]}>
        <boxGeometry args={[boxSize * 1.1, 0.08, 0.15]} />
        <meshStandardMaterial
          color={rarity === 'legendary' ? '#FF1493' : rarity === 'rare' ? '#4169E1' : '#8B0000'}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, boxSize / 2, 0]}>
        <boxGeometry args={[0.15, 0.08, boxSize * 1.1]} />
        <meshStandardMaterial
          color={rarity === 'legendary' ? '#FF1493' : rarity === 'rare' ? '#4169E1' : '#8B0000'}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* Sparkle particles for legendary */}
      {rarity === 'legendary' && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <mesh
              key={i}
              position={[
                Math.cos((i * Math.PI) / 2) * 0.6,
                0.3 + Math.sin(Date.now() / 500 + i) * 0.2,
                Math.sin((i * Math.PI) / 2) * 0.6,
              ]}
            >
              <octahedronGeometry args={[0.08]} />
              <meshStandardMaterial
                color="#FFFF00"
                emissive="#FFD700"
                emissiveIntensity={1}
              />
            </mesh>
          ))}
        </>
      )}

      {/* Glow effect */}
      <pointLight
        position={[0, 0.5, 0]}
        intensity={glowIntensity * (rarity === 'legendary' ? 2 : 1)}
        distance={rarity === 'legendary' ? 5 : 3}
        color={colors.glow}
      />

      {/* Rainbow shimmer for legendary (using multiple colored lights) */}
      {rarity === 'legendary' && (
        <>
          <pointLight position={[0.5, 0, 0]} intensity={0.3} distance={2} color="#FF0000" />
          <pointLight position={[-0.5, 0, 0]} intensity={0.3} distance={2} color="#00FF00" />
          <pointLight position={[0, 0, 0.5]} intensity={0.3} distance={2} color="#0000FF" />
        </>
      )}
    </group>
  );
}
