import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type LowPolyCharacterProps = {
  position?: [number, number, number];
  rotation?: number;
  clothingColor?: string;
  isNight: boolean;
  isWalking?: boolean;
};

const LowPolyCharacter = ({
  position = [0, 0, 0],
  rotation = 0,
  clothingColor = '#4a5568',
  isNight = false,
  isWalking = false,
}: LowPolyCharacterProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  // Memoized materials for performance
  const materials = useMemo(() => ({
    skin: new THREE.MeshStandardMaterial({ color: '#f5d0c5' }),
    clothing: new THREE.MeshStandardMaterial({ color: clothingColor }),
    hood: new THREE.MeshStandardMaterial({ color: '#2d3748' }),
    pants: new THREE.MeshStandardMaterial({ color: '#1a202c' }),
    shoes: new THREE.MeshStandardMaterial({ color: '#2d2d2d' }),
    eyeWhite: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
    eyeGlow: new THREE.MeshStandardMaterial({
      color: '#00ffff',
      emissive: '#00ffff',
      emissiveIntensity: isNight ? 2 : 0,
    }),
  }), [clothingColor, isNight]);

  // Animation - idle bobbing or walking
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (groupRef.current) {
      if (isWalking) {
        // Walking bob - faster and more pronounced
        groupRef.current.position.y = position[1] + Math.abs(Math.sin(time * 8)) * 0.08;
      } else {
        // Idle bob - subtle breathing
        groupRef.current.position.y = position[1] + Math.sin(time * 2) * 0.03;
      }
    }

    // Arm animation
    if (leftArmRef.current && rightArmRef.current) {
      if (isWalking) {
        // Walking arm swing - opposite to legs
        leftArmRef.current.rotation.x = Math.sin(time * 8) * 0.6;
        rightArmRef.current.rotation.x = Math.sin(time * 8 + Math.PI) * 0.6;
      } else {
        // Idle arm sway
        leftArmRef.current.rotation.x = Math.sin(time * 1.5) * 0.1;
        rightArmRef.current.rotation.x = Math.sin(time * 1.5 + Math.PI) * 0.1;
      }
    }

    // Leg animation
    if (leftLegRef.current && rightLegRef.current) {
      if (isWalking) {
        // Walking leg swing
        leftLegRef.current.rotation.x = Math.sin(time * 8 + Math.PI) * 0.5;
        rightLegRef.current.rotation.x = Math.sin(time * 8) * 0.5;
      } else {
        // Idle - legs stay still
        leftLegRef.current.rotation.x = 0;
        rightLegRef.current.rotation.x = 0;
      }
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Hood/Hair - dark curved shape behind head */}
      <mesh position={[0, 1.55, -0.1]} material={materials.hood}>
        <boxGeometry args={[0.5, 0.45, 0.35]} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.5, 0]} material={materials.skin}>
        <boxGeometry args={[0.4, 0.45, 0.4]} />
      </mesh>

      {/* Left Eye */}
      <mesh position={[-0.1, 1.52, 0.2]} material={isNight ? materials.eyeGlow : materials.eyeWhite}>
        <sphereGeometry args={[0.06, 8, 8]} />
      </mesh>

      {/* Right Eye */}
      <mesh position={[0.1, 1.52, 0.2]} material={isNight ? materials.eyeGlow : materials.eyeWhite}>
        <sphereGeometry args={[0.06, 8, 8]} />
      </mesh>

      {/* Eye pupils (only visible in day) */}
      {!isNight && (
        <>
          <mesh position={[-0.1, 1.52, 0.25]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0.1, 1.52, 0.25]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
        </>
      )}

      {/* Torso/Hoodie */}
      <mesh position={[0, 1.0, 0]} material={materials.clothing}>
        <boxGeometry args={[0.5, 0.6, 0.3]} />
      </mesh>

      {/* Hood detail on torso */}
      <mesh position={[0, 1.25, 0.12]} material={materials.hood}>
        <boxGeometry args={[0.3, 0.15, 0.1]} />
      </mesh>

      {/* Left Arm */}
      <mesh
        ref={leftArmRef}
        position={[-0.35, 1.0, 0]}
        material={materials.clothing}
      >
        <boxGeometry args={[0.15, 0.5, 0.15]} />
      </mesh>

      {/* Left Hand */}
      <mesh position={[-0.35, 0.7, 0]} material={materials.skin}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
      </mesh>

      {/* Right Arm */}
      <mesh
        ref={rightArmRef}
        position={[0.35, 1.0, 0]}
        material={materials.clothing}
      >
        <boxGeometry args={[0.15, 0.5, 0.15]} />
      </mesh>

      {/* Right Hand */}
      <mesh position={[0.35, 0.7, 0]} material={materials.skin}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
      </mesh>

      {/* Left Leg */}
      <group position={[-0.12, 0.35, 0]}>
        <mesh ref={leftLegRef} material={materials.pants}>
          <boxGeometry args={[0.18, 0.5, 0.2]} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group position={[0.12, 0.35, 0]}>
        <mesh ref={rightLegRef} material={materials.pants}>
          <boxGeometry args={[0.18, 0.5, 0.2]} />
        </mesh>
      </group>

      {/* Left Foot */}
      <mesh position={[-0.12, 0.08, 0.05]} material={materials.shoes}>
        <boxGeometry args={[0.18, 0.1, 0.28]} />
      </mesh>

      {/* Right Foot */}
      <mesh position={[0.12, 0.08, 0.05]} material={materials.shoes}>
        <boxGeometry args={[0.18, 0.1, 0.28]} />
      </mesh>

      {/* Night glow effect under character */}
      {isNight && (
        <pointLight
          position={[0, 0.2, 0]}
          color="#00ffff"
          intensity={0.5}
          distance={2}
        />
      )}
    </group>
  );
};

export default LowPolyCharacter;
