import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { usePlayerStore } from '@/stores/playerStore';

interface MysteryBoxProps {
  position: [number, number, number];
  isNight: boolean;
  onAttempt: () => void;
  collected?: boolean;
}

export default function MysteryBox({
  position,
  isNight,
  onAttempt,
  collected = false,
}: MysteryBoxProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const playerPosition = usePlayerStore((s) => s.position);
  const [hovered, setHovered] = useState(false);

  // Calculate distance to player
  const distance = useMemo(() => {
    const dx = playerPosition[0] - position[0];
    const dz = playerPosition[2] - position[2];
    return Math.sqrt(dx * dx + dz * dz);
  }, [playerPosition, position]);

  const canInteract = distance < 4;

  useFrame((state) => {
    if (!meshRef.current || collected) return;

    // Floating + rotation animation
    meshRef.current.rotation.y += 0.015;
    meshRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.15;

    // Pulsing glow
    if (glowRef.current) {
      glowRef.current.intensity =
        (isNight ? 2 : 1) + Math.sin(state.clock.elapsedTime * 3) * 0.5;
    }
  });

  if (collected) return null;

  return (
    <group position={position}>
      {/* Mystery box mesh */}
      <mesh
        ref={meshRef}
        onClick={() => canInteract && onAttempt()}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial
          color={hovered ? '#BB88FF' : '#9966FF'}
          emissive={isNight ? '#6633CC' : '#4422AA'}
          emissiveIntensity={isNight ? 1.2 : 0.5}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>

      {/* Question mark faces */}
      {[
        [0, 0, 0.46],
        [0, 0, -0.46],
        [0.46, 0, 0],
        [-0.46, 0, 0],
      ].map((pos, i) => (
        <mesh
          key={i}
          position={pos as [number, number, number]}
          rotation={[0, i < 2 ? 0 : Math.PI / 2, 0]}
        >
          <planeGeometry args={[0.5, 0.5]} />
          <meshBasicMaterial color="#FFFF00" transparent opacity={0.9} />
        </mesh>
      ))}

      {/* Particle ring effect */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <ringGeometry args={[1.2, 1.4, 32]} />
        <meshBasicMaterial
          color={isNight ? '#9966FF' : '#6644CC'}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Glow effect */}
      <pointLight
        ref={glowRef}
        intensity={isNight ? 2 : 1}
        distance={8}
        color="#9966FF"
      />

      {/* Interaction hint */}
      {canInteract && (
        <Html center position={[0, 1.5, 0]} style={{ pointerEvents: 'none' }}>
          <div className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-primary/50 shadow-lg whitespace-nowrap">
            <span className="text-primary font-bold text-sm">✦ Tap to Open ✦</span>
          </div>
        </Html>
      )}

      {/* Distance indicator when not close enough */}
      {!canInteract && distance < 12 && (
        <Html center position={[0, 1.5, 0]} style={{ pointerEvents: 'none' }}>
          <div className="bg-background/70 backdrop-blur-sm px-2 py-1 rounded border border-border/50 whitespace-nowrap">
            <span className="text-muted-foreground text-xs">Get closer...</span>
          </div>
        </Html>
      )}
    </group>
  );
}
