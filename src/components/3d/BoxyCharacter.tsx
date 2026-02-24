import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type BoxyCharacterProps = {
  position?: [number, number, number];
  rotation?: number;
  clothingColor?: string;
  isNight: boolean;
  isWalking?: boolean;
};

const BoxyCharacter = ({
  position = [0, 0, 0],
  rotation = 0,
  clothingColor = '#4a5568',
  isNight = false,
  isWalking = false,
}: BoxyCharacterProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (groupRef.current) {
      if (isWalking) {
        groupRef.current.position.y = position[1] + Math.abs(Math.sin(time * 8)) * 0.06;
      } else {
        groupRef.current.position.y = position[1] + Math.sin(time * 2) * 0.02;
      }
    }

    const swingSpeed = isWalking ? 8 : 1.5;
    const swingAmount = isWalking ? 0.6 : 0.08;

    if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(time * swingSpeed) * swingAmount;
    if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(time * swingSpeed + Math.PI) * swingAmount;
    if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(time * swingSpeed + Math.PI) * (isWalking ? 0.5 : 0);
    if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(time * swingSpeed) * (isWalking ? 0.5 : 0);
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]} castShadow>

      {/* ===== HEAD (Box) ===== */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#2d2d3a" roughness={0.8} metalness={0.05} />
      </mesh>

      {/* Face - front panel lighter */}
      <mesh position={[0, 1.55, 0.201]}>
        <planeGeometry args={[0.38, 0.38]} />
        <meshStandardMaterial color="#3a3a4a" roughness={0.9} metalness={0} />
      </mesh>

      {/* Left eye - simple dot */}
      <mesh position={[-0.08, 1.58, 0.21]}>
        <boxGeometry args={[0.06, 0.06, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>

      {/* Right eye - simple dot */}
      <mesh position={[0.08, 1.58, 0.21]}>
        <boxGeometry args={[0.06, 0.06, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>

      {/* Mouth - small line */}
      <mesh position={[0, 1.48, 0.21]}>
        <boxGeometry args={[0.12, 0.025, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>

      {/* ===== TORSO (Box) ===== */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.45, 0.55, 0.25]} />
        <meshStandardMaterial color={clothingColor} roughness={0.75} metalness={0.05} />
      </mesh>

      {/* ===== LEFT ARM ===== */}
      <group ref={leftArmRef} position={[-0.32, 1.25, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.15, 0.5, 0.2]} />
          <meshStandardMaterial color="#1a1a2a" roughness={0.8} metalness={0.05} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.48, 0]}>
          <boxGeometry args={[0.12, 0.1, 0.15]} />
          <meshStandardMaterial color="#c4a882" roughness={0.6} />
        </mesh>
      </group>

      {/* ===== RIGHT ARM ===== */}
      <group ref={rightArmRef} position={[0.32, 1.25, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.15, 0.5, 0.2]} />
          <meshStandardMaterial color="#1a1a2a" roughness={0.8} metalness={0.05} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.48, 0]}>
          <boxGeometry args={[0.12, 0.1, 0.15]} />
          <meshStandardMaterial color="#c4a882" roughness={0.6} />
        </mesh>
      </group>

      {/* ===== LEFT LEG ===== */}
      <group ref={leftLegRef} position={[-0.1, 0.55, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.18, 0.5, 0.2]} />
          <meshStandardMaterial color="#1a1a2a" roughness={0.8} metalness={0.05} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.47, 0.03]}>
          <boxGeometry args={[0.18, 0.08, 0.25]} />
          <meshStandardMaterial color="#0e0e14" roughness={0.7} />
        </mesh>
      </group>

      {/* ===== RIGHT LEG ===== */}
      <group ref={rightLegRef} position={[0.1, 0.55, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.18, 0.5, 0.2]} />
          <meshStandardMaterial color="#1a1a2a" roughness={0.8} metalness={0.05} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.47, 0.03]}>
          <boxGeometry args={[0.18, 0.08, 0.25]} />
          <meshStandardMaterial color="#0e0e14" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
};

export default BoxyCharacter;
