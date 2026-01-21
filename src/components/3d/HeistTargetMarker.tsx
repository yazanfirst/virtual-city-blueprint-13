import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { usePlayerStore } from '@/stores/playerStore';
import { useHeistStore } from '@/stores/heistStore';

interface HeistTargetMarkerProps {
  shopPosition: [number, number, number];
  shopName: string;
}

const COLLECTION_RANGE = 6;

export default function HeistTargetMarker({ shopPosition, shopName }: HeistTargetMarkerProps) {
  const markerRef = useRef<THREE.Group>(null);
  const playerPosition = usePlayerStore((state) => state.position);
  const { phase, hasItem, collectItem, targetItemName } = useHeistStore();

  useFrame(({ clock }) => {
    if (!markerRef.current) return;

    // Floating animation
    markerRef.current.position.y = shopPosition[1] + 8 + Math.sin(clock.getElapsedTime() * 2) * 0.3;

    // Check if player is near the target shop to collect item
    if (phase === 'infiltrating' && !hasItem) {
      const [px, , pz] = playerPosition;
      const [sx, , sz] = shopPosition;
      const distance = Math.hypot(px - sx, pz - sz);

      if (distance < COLLECTION_RANGE) {
        collectItem();
      }
    }
  });

  // Only show during infiltrating phase when item not collected
  if (phase !== 'infiltrating' || hasItem) return null;

  return (
    <group ref={markerRef} position={[shopPosition[0], shopPosition[1] + 8, shopPosition[2]]}>
      {/* Diamond marker */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial 
          color="#ffd700" 
          emissive="#ffd700" 
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Target text */}
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.4}
        color="#ffd700"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#332200"
      >
        TARGET
      </Text>

      {/* Shop name */}
      <Text
        position={[0, 0.7, 0]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {shopName}
      </Text>

      {/* Item name */}
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.2}
        color="#aaaaaa"
        anchorX="center"
        anchorY="middle"
      >
        Steal: {targetItemName}
      </Text>
    </group>
  );
}
