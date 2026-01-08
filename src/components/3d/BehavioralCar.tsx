import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BehavioralCarProps {
  startPosition: [number, number, number];
  endPosition: [number, number, number];
  targetShopPosition?: { x: number; z: number } | null;
  speed?: number;
  carColor?: string;
  isNight?: boolean;
  isIndicator?: boolean; // True = this car exhibits indicator behavior
  isDecoy?: boolean; // True = decoy car (wrong timing)
}

export default function BehavioralCar({
  startPosition,
  endPosition,
  targetShopPosition,
  speed = 0.02,
  carColor = '#D97B4A',
  isNight = false,
  isIndicator = false,
  isDecoy = false,
}: BehavioralCarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);
  const respawnTimerRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(true);

  // Calculate angle to face the end position
  const facingAngle = useMemo(() => {
    const dx = endPosition[0] - startPosition[0];
    const dz = endPosition[2] - startPosition[2];
    return Math.atan2(dx, dz);
  }, [startPosition, endPosition]);

  // Headlight colors
  const headlightColor = useMemo(() => (isNight ? '#FFFFCC' : '#FFFFFF'), [isNight]);
  const tailLightColor = '#FF3333';

  useFrame(() => {
    if (!groupRef.current || !visible) return;

    // Calculate current position
    const x = startPosition[0] + (endPosition[0] - startPosition[0]) * progressRef.current;
    const z = startPosition[2] + (endPosition[2] - startPosition[2]) * progressRef.current;

    // Behavioral indicator logic: slow down near target shop
    let currentSpeed = speed;
    
    if (isIndicator && targetShopPosition) {
      const distToTarget = Math.sqrt(
        Math.pow(x - targetShopPosition.x, 2) + Math.pow(z - targetShopPosition.z, 2)
      );
      
      // Slow down zone
      const slowDownRadius = isDecoy ? 25 : 15; // Decoys slow at wrong distance
      const slowFactor = isDecoy ? 0.4 : 0.15; // Decoys don't slow as much
      
      if (distToTarget < slowDownRadius) {
        // Smooth slow down
        const slowAmount = 1 - (distToTarget / slowDownRadius);
        currentSpeed = speed * (1 - slowAmount * (1 - slowFactor));
      }
    }

    progressRef.current += currentSpeed;

    if (progressRef.current >= 1) {
      // Reached end - respawn after delay
      setVisible(false);
      progressRef.current = 0;

      if (respawnTimerRef.current) {
        clearTimeout(respawnTimerRef.current);
      }

      respawnTimerRef.current = window.setTimeout(() => {
        setVisible(true);
      }, 2000 + Math.random() * 3000); // 2-5 second respawn
    }

    // Update position and rotation
    groupRef.current.position.set(x, 0, z);
    groupRef.current.rotation.y = facingAngle;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {/* Car body */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.8, 0.6, 4]} />
        <meshLambertMaterial color={carColor} />
      </mesh>
      
      {/* Cabin */}
      <mesh position={[0, 1, -0.3]}>
        <boxGeometry args={[1.5, 0.6, 2]} />
        <meshLambertMaterial color={isNight ? '#2A3A4A' : '#4A5A6A'} />
      </mesh>
      
      {/* Windows */}
      <mesh position={[0, 1.05, -0.3]}>
        <boxGeometry args={[1.4, 0.4, 1.8]} />
        <meshLambertMaterial 
          color={isNight ? '#6688AA' : '#88AACC'} 
          emissive={isNight ? '#334455' : '#000000'}
          emissiveIntensity={isNight ? 0.3 : 0}
        />
      </mesh>
      
      {/* Wheels */}
      {[[-0.9, 0.3, 1.2], [0.9, 0.3, 1.2], [-0.9, 0.3, -1.2], [0.9, 0.3, -1.2]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 0.3, 8]} />
          <meshLambertMaterial color="#1A1A1A" />
        </mesh>
      ))}
      
      {/* Headlights */}
      <mesh position={[-0.6, 0.5, 2.01]}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <meshBasicMaterial color={headlightColor} />
      </mesh>
      <mesh position={[0.6, 0.5, 2.01]}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <meshBasicMaterial color={headlightColor} />
      </mesh>
      
      {/* Night headlight glow */}
      {isNight && isIndicator && !isDecoy && (
        <>
          <pointLight position={[0, 0.5, 3]} color="#FFFFAA" intensity={0.8} distance={10} />
        </>
      )}
      
      {/* Tail lights */}
      <mesh position={[-0.6, 0.5, -2.01]}>
        <boxGeometry args={[0.3, 0.15, 0.05]} />
        <meshBasicMaterial color={tailLightColor} />
      </mesh>
      <mesh position={[0.6, 0.5, -2.01]}>
        <boxGeometry args={[0.3, 0.15, 0.05]} />
        <meshBasicMaterial color={tailLightColor} />
      </mesh>
      
      {isNight && (
        <pointLight position={[0, 0.5, -2.5]} color="#FF4444" intensity={0.3} distance={5} />
      )}
    </group>
  );
}
