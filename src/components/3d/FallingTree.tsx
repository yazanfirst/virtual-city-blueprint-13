import { useRef, useEffect } from 'react';
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
  const trunkRef = useRef<THREE.Mesh>(null);
  const foliage1Ref = useRef<THREE.Mesh>(null);
  const foliage2Ref = useRef<THREE.Mesh>(null);
  const dangerPlaneRef = useRef<THREE.Mesh>(null);
  const warningRef = useRef<THREE.Group>(null);

  // Use refs for animation state to avoid re-renders
  const animState = useRef({
    isShaking: false,
    hasFallen: false,
    hasHitPlayer: false,
    shakeStartTime: 0,
    fallStartTime: 0,
    fallDirection: Math.random() * Math.PI * 2,
  });

  const activateHazard = useHazardStore((state) => state.activateHazard);

  const SHAKE_DURATION = 800;
  const FALL_DURATION = 600;

  // Start shaking when triggered
  useEffect(() => {
    if (isTriggered && !animState.current.isShaking && !animState.current.hasFallen) {
      animState.current.isShaking = true;
      animState.current.shakeStartTime = Date.now();
    }
  }, [isTriggered]);

  useFrame(() => {
    if (!groupRef.current) return;

    const state = animState.current;
    const now = Date.now();

    // Show/hide warning indicator
    if (warningRef.current) {
      warningRef.current.visible = state.isShaking;
    }

    // Show/hide danger zone
    if (dangerPlaneRef.current) {
      dangerPlaneRef.current.visible = state.isShaking || (state.fallStartTime > 0 && !state.hasFallen);
    }

    // Shaking phase
    if (state.isShaking && state.shakeStartTime > 0) {
      const elapsed = now - state.shakeStartTime;

      if (elapsed < SHAKE_DURATION) {
        const intensity = 0.02 + (elapsed / SHAKE_DURATION) * 0.08;
        groupRef.current.position.x = position[0] + (Math.random() - 0.5) * intensity;
        groupRef.current.position.z = position[2] + (Math.random() - 0.5) * intensity;

        // Change colors to indicate danger
        if (trunkRef.current) {
          (trunkRef.current.material as THREE.MeshLambertMaterial).color.setHex(0x8B4513);
        }
        if (foliage1Ref.current) {
          (foliage1Ref.current.material as THREE.MeshLambertMaterial).color.setHex(0xFF6B6B);
        }
        if (foliage2Ref.current) {
          (foliage2Ref.current.material as THREE.MeshLambertMaterial).color.setHex(0xFF6B6B);
        }
      } else {
        // Transition to falling
        state.isShaking = false;
        state.fallStartTime = now;
        groupRef.current.position.x = position[0];
        groupRef.current.position.z = position[2];
        activateHazard(id);
      }
    }

    // Falling phase
    if (state.fallStartTime > 0 && !state.hasFallen) {
      const elapsed = now - state.fallStartTime;
      const progress = Math.min(1, elapsed / FALL_DURATION);
      const easedProgress = progress * progress;

      const fallAngle = easedProgress * (Math.PI / 2);
      groupRef.current.rotation.x = Math.cos(state.fallDirection) * fallAngle;
      groupRef.current.rotation.z = Math.sin(state.fallDirection) * fallAngle;

      const fallOffset = Math.sin(fallAngle) * 4;
      groupRef.current.position.x = position[0] + Math.cos(state.fallDirection) * fallOffset * 0.3;
      groupRef.current.position.z = position[2] + Math.sin(state.fallDirection) * fallOffset * 0.3;

      // Check if player is in danger zone during fall
      if (!state.hasHitPlayer && progress > 0.5) {
        const playerPos = usePlayerStore.getState().position;
        const dx = playerPos[0] - position[0];
        const dz = playerPos[2] - position[2];
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 4) {
          const playerAngle = Math.atan2(dz, dx);
          const angleDiff = Math.abs(playerAngle - state.fallDirection);
          if (angleDiff < Math.PI / 3 || angleDiff > Math.PI * 5 / 3) {
            state.hasHitPlayer = true;
            onPlayerHit();
          }
        }
      }

      // Update fallen colors
      if (foliage1Ref.current) {
        (foliage1Ref.current.material as THREE.MeshLambertMaterial).color.setHex(0x3A7A3A);
      }
      if (foliage2Ref.current) {
        (foliage2Ref.current.material as THREE.MeshLambertMaterial).color.setHex(0x3A7A3A);
      }

      if (progress >= 1) {
        state.hasFallen = true;
        // Darker color when fallen
        if (foliage1Ref.current) {
          (foliage1Ref.current.material as THREE.MeshLambertMaterial).color.setHex(0x2A5A2A);
        }
        if (foliage2Ref.current) {
          (foliage2Ref.current.material as THREE.MeshLambertMaterial).color.setHex(0x2A5A2A);
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Warning indicator - visibility controlled in useFrame */}
      <group ref={warningRef} visible={false}>
        <mesh position={[0, 8, 0]}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshBasicMaterial color="#FF0000" transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, 9, 0]}>
          <boxGeometry args={[2, 0.5, 0.1]} />
          <meshBasicMaterial color="#FF0000" />
        </mesh>
      </group>

      {/* Trunk */}
      <mesh ref={trunkRef} position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 3, 6]} />
        <meshLambertMaterial color="#5A3A1A" />
      </mesh>

      {/* Foliage */}
      <mesh ref={foliage1Ref} position={[0, 4, 0]}>
        <icosahedronGeometry args={[1.8, 0]} />
        <meshLambertMaterial color="#3A7A3A" />
      </mesh>
      <mesh ref={foliage2Ref} position={[0.5, 5, 0.3]}>
        <icosahedronGeometry args={[1.3, 0]} />
        <meshLambertMaterial color="#4A8A4A" />
      </mesh>

      {/* Danger zone indicator - visibility controlled in useFrame */}
      <mesh 
        ref={dangerPlaneRef} 
        visible={false}
        rotation={[-Math.PI / 2, 0, animState.current.fallDirection]} 
        position={[0, 0.01, 0]}
      >
        <planeGeometry args={[3, 8]} />
        <meshBasicMaterial color="#FF0000" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
