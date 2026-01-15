import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '@/stores/playerStore';
import { DestructibleType } from '@/stores/gameStore';

type DestructibleProps = {
  id: string;
  type: DestructibleType;
  position: [number, number, number];
  currentHp: number;
  maxHp: number;
  destroyed: boolean;
  onNearby: (id: string | null) => void;
  isNight?: boolean;
};

const INTERACTION_DISTANCE = 2;

const TYPE_CONFIG = {
  cardboard: {
    color: '#8B6914',
    size: [0.8, 0.6, 0.6] as [number, number, number],
    metalness: 0,
    roughness: 0.9,
  },
  crate: {
    color: '#654321',
    size: [0.9, 0.9, 0.9] as [number, number, number],
    metalness: 0.1,
    roughness: 0.8,
  },
  trash: {
    color: '#4A4A4A',
    size: [0.5, 0.8, 0.5] as [number, number, number],
    metalness: 0.7,
    roughness: 0.3,
  },
  vending: {
    color: '#2E4A62',
    size: [0.8, 1.8, 0.6] as [number, number, number],
    metalness: 0.6,
    roughness: 0.4,
  },
};

export default function Destructible({
  id,
  type,
  position,
  currentHp,
  maxHp,
  destroyed,
  onNearby,
  isNight = false,
}: DestructibleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [wasNearby, setWasNearby] = useState(false);
  const playerPosition = usePlayerStore((state) => state.position);
  const lastHpRef = useRef(currentHp);

  const config = TYPE_CONFIG[type];
  const healthPercent = currentHp / maxHp;

  useFrame(() => {
    if (destroyed || !groupRef.current) return;

    // Check if player is nearby
    const dx = playerPosition[0] - position[0];
    const dz = playerPosition[2] - position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);
    const isNearby = distance < INTERACTION_DISTANCE;

    if (isNearby !== wasNearby) {
      setWasNearby(isNearby);
      onNearby(isNearby ? id : null);
    }

    // Shake animation when damaged
    if (currentHp < lastHpRef.current) {
      setShakeIntensity(0.15);
      lastHpRef.current = currentHp;
    }

    if (shakeIntensity > 0) {
      groupRef.current.position.x = position[0] + (Math.random() - 0.5) * shakeIntensity;
      groupRef.current.position.z = position[2] + (Math.random() - 0.5) * shakeIntensity;
      setShakeIntensity((prev) => Math.max(0, prev - 0.01));
    } else {
      groupRef.current.position.x = position[0];
      groupRef.current.position.z = position[2];
    }
  });

  if (destroyed) return null;

  // Damage color tint
  const damageColor = healthPercent < 0.3 ? '#FF4444' : healthPercent < 0.6 ? '#FFAA44' : config.color;

  return (
    <group ref={groupRef} position={position}>
      {/* Main body */}
      {type === 'cardboard' && (
        <mesh position={[0, config.size[1] / 2, 0]}>
          <boxGeometry args={config.size} />
          <meshStandardMaterial
            color={damageColor}
            metalness={config.metalness}
            roughness={config.roughness}
          />
        </mesh>
      )}

      {type === 'crate' && (
        <>
          <mesh position={[0, config.size[1] / 2, 0]}>
            <boxGeometry args={config.size} />
            <meshStandardMaterial
              color={damageColor}
              metalness={config.metalness}
              roughness={config.roughness}
            />
          </mesh>
          {/* Wooden slats */}
          {[-0.3, 0, 0.3].map((y, i) => (
            <mesh key={i} position={[0, 0.3 + y * 0.8, config.size[2] / 2 + 0.01]}>
              <boxGeometry args={[config.size[0] * 0.9, 0.1, 0.02]} />
              <meshStandardMaterial color="#3A2A1A" />
            </mesh>
          ))}
        </>
      )}

      {type === 'trash' && (
        <>
          {/* Cylinder body */}
          <mesh position={[0, config.size[1] / 2, 0]}>
            <cylinderGeometry args={[config.size[0] / 2, config.size[0] / 2 * 0.9, config.size[1], 8]} />
            <meshStandardMaterial
              color={damageColor}
              metalness={config.metalness}
              roughness={config.roughness}
            />
          </mesh>
          {/* Lid */}
          <mesh position={[0, config.size[1], 0]}>
            <cylinderGeometry args={[config.size[0] / 2 * 1.1, config.size[0] / 2 * 1.1, 0.1, 8]} />
            <meshStandardMaterial color="#3A3A3A" metalness={0.7} />
          </mesh>
        </>
      )}

      {type === 'vending' && (
        <>
          {/* Main body */}
          <mesh position={[0, config.size[1] / 2, 0]}>
            <boxGeometry args={config.size} />
            <meshStandardMaterial
              color={damageColor}
              metalness={config.metalness}
              roughness={config.roughness}
            />
          </mesh>
          {/* Glass front */}
          <mesh position={[0, config.size[1] / 2, config.size[2] / 2 + 0.01]}>
            <boxGeometry args={[config.size[0] * 0.8, config.size[1] * 0.6, 0.02]} />
            <meshStandardMaterial
              color="#88CCFF"
              transparent
              opacity={0.6}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          {/* Buttons */}
          {[0.3, 0.5, 0.7].map((y, i) => (
            <mesh key={i} position={[config.size[0] / 2 - 0.1, config.size[1] * y, config.size[2] / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.02, 8]} />
              <meshStandardMaterial
                color={['#FF0000', '#00FF00', '#0000FF'][i]}
                emissive={['#FF0000', '#00FF00', '#0000FF'][i]}
                emissiveIntensity={isNight ? 0.5 : 0.2}
              />
            </mesh>
          ))}
          {/* Light on top */}
          {isNight && (
            <pointLight position={[0, config.size[1], 0]} intensity={0.5} distance={3} color="#88CCFF" />
          )}
        </>
      )}

      {/* Health bar (visible when damaged) */}
      {healthPercent < 1 && (
        <group position={[0, config.size[1] + 0.3, 0]}>
          {/* Background */}
          <mesh>
            <boxGeometry args={[1, 0.1, 0.05]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          {/* Health fill */}
          <mesh position={[(healthPercent - 1) * 0.5, 0, 0.03]}>
            <boxGeometry args={[healthPercent, 0.08, 0.02]} />
            <meshBasicMaterial color={healthPercent > 0.5 ? '#00FF00' : healthPercent > 0.25 ? '#FFFF00' : '#FF0000'} />
          </mesh>
        </group>
      )}

      {/* Interaction indicator when nearby */}
      {wasNearby && (
        <mesh position={[0, config.size[1] + 0.6, 0]}>
          <ringGeometry args={[0.15, 0.2, 6]} />
          <meshBasicMaterial color="#FFFFFF" side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
