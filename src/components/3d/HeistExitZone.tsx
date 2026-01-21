import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { usePlayerStore } from '@/stores/playerStore';
import { useHeistStore } from '@/stores/heistStore';

const EXIT_ZONE_POSITION: [number, number, number] = [0, 0, 55];
const EXIT_ZONE_RADIUS = 5;

export default function HeistExitZone() {
  const ringRef = useRef<THREE.Mesh>(null);
  const playerPosition = usePlayerStore((state) => state.position);
  const { phase, hasItem, completeMission } = useHeistStore();

  useFrame(({ clock }) => {
    if (!ringRef.current) return;

    // Pulse animation
    const pulse = (Math.sin(clock.getElapsedTime() * 3) + 1) / 2;
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + pulse * 0.3;

    // Check if player is in exit zone during escape phase
    if (phase === 'escaping' && hasItem) {
      const [px, , pz] = playerPosition;
      const [ex, , ez] = EXIT_ZONE_POSITION;
      const distance = Math.hypot(px - ex, pz - ez);

      if (distance < EXIT_ZONE_RADIUS) {
        completeMission();
      }
    }
  });

  // Only show during escape phase
  if (phase !== 'escaping') return null;

  return (
    <group position={EXIT_ZONE_POSITION}>
      {/* Glowing ring on ground */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[EXIT_ZONE_RADIUS - 0.5, EXIT_ZONE_RADIUS, 32]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Inner glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[EXIT_ZONE_RADIUS - 0.5, 32]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.15} />
      </mesh>

      {/* Exit text */}
      <Text
        position={[0, 2, 0]}
        fontSize={0.8}
        color="#00ff88"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#003322"
      >
        EXIT ZONE
      </Text>

      {/* Arrow pointing down */}
      <mesh position={[0, 1.2, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.3, 0.6, 8]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>
    </group>
  );
}

export { EXIT_ZONE_POSITION, EXIT_ZONE_RADIUS };
