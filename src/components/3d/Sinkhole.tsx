import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useHazardStore } from '@/stores/hazardStore';
import { usePlayerStore } from '@/stores/playerStore';

export type SinkholeProps = {
  id: string;
  position: [number, number, number];
  isTriggered: boolean;
  isActive: boolean;
  onPlayerFall: () => void;
};

export default function Sinkhole({ id, position, isTriggered, isActive, onPlayerFall }: SinkholeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [openProgress, setOpenProgress] = useState(0);
  const [isWarning, setIsWarning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasHitPlayer, setHasHitPlayer] = useState(false);
  const warningStartTime = useRef<number | null>(null);
  const openStartTime = useRef<number | null>(null);
  const warningOpacity = useRef(0.3);

  const activateHazard = useHazardStore((state) => state.activateHazard);

  const WARNING_DURATION = 1500;
  const OPEN_DURATION = 500;

  // Start warning phase when triggered
  useEffect(() => {
    if (isTriggered && !isWarning && !isOpen) {
      setIsWarning(true);
      warningStartTime.current = Date.now();
    }
  }, [isTriggered, isWarning, isOpen]);

  useFrame(() => {
    if (!groupRef.current) return;

    const now = Date.now();

    // Update warning opacity for pulsing (doesn't cause re-render)
    warningOpacity.current = 0.3 + Math.sin(now * 0.01) * 0.2;

    // Warning phase
    if (isWarning && warningStartTime.current) {
      const elapsed = now - warningStartTime.current;

      if (elapsed >= WARNING_DURATION) {
        setIsWarning(false);
        openStartTime.current = now;
      }
    }

    // Opening phase
    if (openStartTime.current && !isOpen) {
      const elapsed = now - openStartTime.current;
      const progress = Math.min(1, elapsed / OPEN_DURATION);

      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setOpenProgress(easedProgress);

      if (progress >= 1) {
        setIsOpen(true);
        activateHazard(id);
      }
    }

    // Check if player falls in
    if (isOpen && !hasHitPlayer) {
      const playerPos = usePlayerStore.getState().position;
      const dx = playerPos[0] - position[0];
      const dz = playerPos[2] - position[2];
      const distance = Math.sqrt(dx * dx + dz * dz);

      const holeRadius = 2 + openProgress * 1.5;
      if (distance < holeRadius - 0.5) {
        setHasHitPlayer(true);
        onPlayerFall();
      }
    }
  });

  // Don't render until triggered
  if (!isTriggered && !isWarning && !isOpen) {
    return null;
  }

  const holeRadius = 2 + openProgress * 1.5;
  const holeDepth = openProgress * 3;

  return (
    <group ref={groupRef} position={position}>
      {/* Warning cracks */}
      {isWarning && (
        <>
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <mesh
              key={i}
              rotation={[-Math.PI / 2, 0, (angle * Math.PI) / 180]}
              position={[0, 0.02, 0]}
            >
              <planeGeometry args={[0.1, 2 + Math.random()]} />
              <meshBasicMaterial color="#3A2A1A" />
            </mesh>
          ))}

          {/* Pulsing danger indicator */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <circleGeometry args={[2.5, 16]} />
            <meshBasicMaterial color="#FF4444" transparent opacity={0.4} />
          </mesh>

          {/* Warning sphere */}
          <mesh position={[0, 1, 0]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshBasicMaterial color="#FFFF00" />
          </mesh>
        </>
      )}

      {/* The actual hole */}
      {openProgress > 0 && (
        <>
          {/* Hole rim */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <ringGeometry args={[holeRadius - 0.3, holeRadius + 0.5, 16]} />
            <meshLambertMaterial color="#3A2A1A" />
          </mesh>

          {/* Dark hole interior */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -holeDepth / 2, 0]}>
            <cylinderGeometry args={[holeRadius, holeRadius * 0.8, holeDepth, 16, 1, true]} />
            <meshLambertMaterial color="#1A0A0A" side={THREE.DoubleSide} />
          </mesh>

          {/* Bottom of hole */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -holeDepth, 0]}>
            <circleGeometry args={[holeRadius * 0.8, 16]} />
            <meshLambertMaterial color="#0A0505" />
          </mesh>

          {/* Danger glow */}
          {!isOpen && (
            <pointLight
              position={[0, 0.5, 0]}
              color="#FF4400"
              intensity={2 * openProgress}
              distance={5}
            />
          )}
        </>
      )}
    </group>
  );
}
