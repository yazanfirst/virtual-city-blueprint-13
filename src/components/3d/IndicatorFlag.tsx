import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface IndicatorFlagProps {
  position: [number, number, number];
  targetPosition?: { x: number; z: number } | null;
  isTrue?: boolean; // True indicator vs decoy
  isNight?: boolean;
  color?: string;
}

export default function IndicatorFlag({
  position,
  targetPosition,
  isTrue = false,
  isNight = false,
  color = '#E8C547',
}: IndicatorFlagProps) {
  const flagRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  // Calculate direction to target for true flags
  const targetAngle = useMemo(() => {
    if (!targetPosition) return 0;
    const dx = targetPosition.x - position[0];
    const dz = targetPosition.z - position[2];
    return Math.atan2(dx, dz);
  }, [position, targetPosition]);

  useFrame((_, delta) => {
    if (!flagRef.current) return;
    
    timeRef.current += delta;
    
    if (isTrue && targetPosition) {
      // True flag: subtle sway toward target direction
      const baseAngle = targetAngle;
      const swayAmount = Math.sin(timeRef.current * 2) * 0.15;
      flagRef.current.rotation.y = baseAngle + swayAmount;
      
      // Subtle "pointing" via scale
      const pulseScale = 1 + Math.sin(timeRef.current * 3) * 0.05;
      flagRef.current.scale.x = pulseScale;
    } else {
      // Decoy flag: random flutter
      const randomSway = Math.sin(timeRef.current * 4 + position[0]) * 0.4;
      const randomSway2 = Math.cos(timeRef.current * 3 + position[2]) * 0.3;
      flagRef.current.rotation.y = randomSway + randomSway2;
    }
    
    // Flag wave animation
    const waveFreq = isTrue ? 2.5 : 4; // True flags wave slower
    flagRef.current.rotation.z = Math.sin(timeRef.current * waveFreq) * 0.1;
  });

  const flagColor = useMemo(() => {
    if (isTrue) {
      return isNight ? '#FFD700' : color; // Gold at night for true
    }
    return isNight ? '#AA8844' : color;
  }, [isTrue, isNight, color]);

  return (
    <group position={position}>
      {/* Flag pole */}
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 6, 8]} />
        <meshLambertMaterial color="#4A4A4A" />
      </mesh>
      
      {/* Pole cap */}
      <mesh position={[0, 6.1, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshLambertMaterial color="#666666" />
      </mesh>
      
      {/* Flag */}
      <mesh ref={flagRef} position={[0.8, 5.2, 0]}>
        <planeGeometry args={[1.6, 1]} />
        <meshLambertMaterial 
          color={flagColor} 
          side={THREE.DoubleSide}
          emissive={isNight && isTrue ? '#553300' : '#000000'}
          emissiveIntensity={isNight && isTrue ? 0.3 : 0}
        />
      </mesh>
      
      {/* Flag pattern - triangle pointer for true flags */}
      {isTrue && (
        <mesh position={[1.4, 5.2, 0.01]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.3, 0.5, 3]} />
          <meshLambertMaterial 
            color={isNight ? '#FFFFFF' : '#333333'} 
          />
        </mesh>
      )}
      
      {/* Subtle glow for true flags at night */}
      {isNight && isTrue && (
        <pointLight 
          position={[0.8, 5.2, 0]} 
          color="#FFD700" 
          intensity={0.5} 
          distance={8} 
        />
      )}
    </group>
  );
}
