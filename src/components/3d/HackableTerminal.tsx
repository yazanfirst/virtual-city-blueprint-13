import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { usePlayerStore } from '@/stores/playerStore';

interface HackableTerminalProps {
  id: string;
  position: [number, number, number];
  rotation: number;
  isHacked: boolean;
  onInteract: () => void;
}

const INTERACTION_RANGE = 4;

export default function HackableTerminal({
  id,
  position,
  rotation,
  isHacked,
  onInteract,
}: HackableTerminalProps) {
  const glowRef = useRef<THREE.Mesh>(null);
  const playerPosition = usePlayerStore((state) => state.position);
  const [isNearby, setIsNearby] = useState(false);
  const interactionCooldownRef = useRef(0);

  useFrame(({ clock }, delta) => {
    // Update cooldown
    if (interactionCooldownRef.current > 0) {
      interactionCooldownRef.current -= delta;
    }

    // Glow pulse animation
    if (glowRef.current) {
      const pulse = (Math.sin(clock.getElapsedTime() * 3) + 1) / 2;
      (glowRef.current.material as THREE.MeshStandardMaterial).opacity = 
        isHacked ? 0.2 : 0.4 + pulse * 0.4;
    }

    // Check proximity to player
    const [px, , pz] = playerPosition;
    const [tx, , tz] = position;
    const distance = Math.hypot(px - tx, pz - tz);
    setIsNearby(distance < INTERACTION_RANGE && !isHacked);
  });

  const handleInteract = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    if (!isHacked && isNearby && interactionCooldownRef.current <= 0) {
      interactionCooldownRef.current = 0.5;
      onInteract();
    }
  };

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Terminal base */}
      <mesh>
        <boxGeometry args={[1.2, 1.5, 0.4]} />
        <meshStandardMaterial color={isHacked ? '#2f3542' : '#1b1f27'} />
      </mesh>
      
      {/* Screen */}
      <mesh position={[0, 0.2, 0.25]}>
        <planeGeometry args={[0.9, 0.6]} />
        <meshStandardMaterial 
          color={isHacked ? '#4b5563' : '#22c55e'} 
          emissive={isHacked ? '#222' : '#22c55e'} 
          emissiveIntensity={isHacked ? 0.1 : 0.8} 
        />
      </mesh>

      {/* Interaction button/glow */}
      <mesh
        ref={glowRef}
        position={[0, -0.3, 0.26]}
        onPointerDown={handleInteract}
      >
        <circleGeometry args={[0.2, 24]} />
        <meshStandardMaterial 
          color={isHacked ? '#6b7280' : isNearby ? '#00ff88' : '#38bdf8'} 
          transparent 
          opacity={0.6} 
          emissive={isNearby ? '#00ff88' : '#38bdf8'}
          emissiveIntensity={isNearby ? 0.5 : 0.2}
        />
      </mesh>

      {/* Proximity indicator - "HACK" text */}
      {isNearby && !isHacked && (
        <Text
          position={[0, 1.2, 0]}
          fontSize={0.25}
          color="#00ff88"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#003322"
        >
          [HACK]
        </Text>
      )}

      {/* Hacked indicator */}
      {isHacked && (
        <Text
          position={[0, 1.0, 0]}
          fontSize={0.2}
          color="#666"
          anchorX="center"
          anchorY="middle"
        >
          DISABLED
        </Text>
      )}

      {/* Status light */}
      <mesh position={[0.4, 0.5, 0.25]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial 
          color={isHacked ? '#666' : '#00ff00'} 
          emissive={isHacked ? '#333' : '#00ff00'} 
          emissiveIntensity={isHacked ? 0 : 1} 
        />
      </mesh>
    </group>
  );
}
