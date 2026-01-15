import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useHazardStore } from '@/stores/hazardStore';
import { usePlayerStore } from '@/stores/playerStore';

export type FallingTreeProps = {
  id: string;
  position: [number, number, number];
  isTriggered: boolean;
  isActive: boolean;
  onPlayerHit: () => void;
};

export default function FallingTree({ id, position, isTriggered, isActive, onPlayerHit }: FallingTreeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [fallProgress, setFallProgress] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [hasFallen, setHasFallen] = useState(false);
  const [hasHitPlayer, setHasHitPlayer] = useState(false);
  const shakeStartTime = useRef<number | null>(null);
  const fallStartTime = useRef<number | null>(null);
  const fallDirection = useRef(Math.random() * Math.PI * 2);
  
  const triggerHazard = useHazardStore((state) => state.triggerHazard);
  const activateHazard = useHazardStore((state) => state.activateHazard);
  const checkProximityHazards = useHazardStore((state) => state.checkProximityHazards);
  
  const SHAKE_DURATION = 800;
  const FALL_DURATION = 600;

  useEffect(() => {
    if (isTriggered && !isShaking && !hasFallen) {
      setIsShaking(true);
      shakeStartTime.current = Date.now();
    }
  }, [isTriggered, isShaking, hasFallen]);

  useFrame((state) => {
    if (!groupRef.current) return;

    const now = Date.now();
    
    // Check player proximity to trigger
    if (!isTriggered && !hasFallen) {
      const playerPos = state.camera.position;
      checkProximityHazards([playerPos.x, playerPos.y, playerPos.z]);
    }

    // Shaking phase
    if (isShaking && shakeStartTime.current) {
      const elapsed = now - shakeStartTime.current;
      
      if (elapsed < SHAKE_DURATION) {
        const intensity = 0.02 + (elapsed / SHAKE_DURATION) * 0.08;
        groupRef.current.position.x = position[0] + (Math.random() - 0.5) * intensity;
        groupRef.current.position.z = position[2] + (Math.random() - 0.5) * intensity;
      } else {
        setIsShaking(false);
        fallStartTime.current = now;
        groupRef.current.position.x = position[0];
        groupRef.current.position.z = position[2];
        activateHazard(id);
      }
    }

    // Falling phase
    if (fallStartTime.current && !hasFallen) {
      const elapsed = now - fallStartTime.current;
      const progress = Math.min(1, elapsed / FALL_DURATION);
      
      const easedProgress = progress * progress;
      setFallProgress(easedProgress);
      
      const fallAngle = easedProgress * (Math.PI / 2);
      groupRef.current.rotation.x = Math.cos(fallDirection.current) * fallAngle;
      groupRef.current.rotation.z = Math.sin(fallDirection.current) * fallAngle;
      
      const fallOffset = Math.sin(fallAngle) * 4;
      groupRef.current.position.x = position[0] + Math.cos(fallDirection.current) * fallOffset * 0.3;
      groupRef.current.position.z = position[2] + Math.sin(fallDirection.current) * fallOffset * 0.3;
      
      // Check if player is in danger zone during fall
      if (!hasHitPlayer && progress > 0.5) {
        const playerPos = state.camera.position;
        const dx = playerPos.x - position[0];
        const dz = playerPos.z - position[2];
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Player is in fall zone
        if (distance < 4) {
          // Check if player is in the direction of fall
          const playerAngle = Math.atan2(dz, dx);
          const angleDiff = Math.abs(playerAngle - fallDirection.current);
          if (angleDiff < Math.PI / 3 || angleDiff > Math.PI * 5 / 3) {
            setHasHitPlayer(true);
            onPlayerHit();
          }
        }
      }
      
      if (progress >= 1) {
        setHasFallen(true);
      }
    }
  });

  const trunkColor = isShaking ? '#8B4513' : '#5A3A1A';
  const foliageColor = isShaking ? '#FF6B6B' : hasFallen ? '#2A5A2A' : '#3A7A3A';

  return (
    <group ref={groupRef} position={position}>
      {/* Warning indicator when shaking */}
      {isShaking && (
        <>
          <mesh position={[0, 8, 0]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshBasicMaterial color="#FF0000" transparent opacity={0.8} />
          </mesh>
          {/* Danger text */}
          <mesh position={[0, 9, 0]}>
            <boxGeometry args={[2, 0.5, 0.1]} />
            <meshBasicMaterial color="#FF0000" />
          </mesh>
        </>
      )}
      
      {/* Trunk */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 3, 6]} />
        <meshLambertMaterial color={trunkColor} />
      </mesh>
      
      {/* Foliage */}
      <mesh position={[0, 4, 0]}>
        <icosahedronGeometry args={[1.8, 0]} />
        <meshLambertMaterial color={foliageColor} />
      </mesh>
      <mesh position={[0.5, 5, 0.3]}>
        <icosahedronGeometry args={[1.3, 0]} />
        <meshLambertMaterial color={foliageColor} />
      </mesh>
      
      {/* Danger zone indicator on ground when falling */}
      {(isShaking || (fallStartTime.current && !hasFallen)) && (
        <mesh rotation={[-Math.PI / 2, 0, fallDirection.current]} position={[0, 0.01, 0]}>
          <planeGeometry args={[3, 8]} />
          <meshBasicMaterial color="#FF0000" transparent opacity={0.3 + Math.sin(Date.now() * 0.01) * 0.2} />
        </mesh>
      )}
    </group>
  );
}
