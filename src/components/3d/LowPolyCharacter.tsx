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
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const materials = useMemo(() => ({
    skin: new THREE.MeshStandardMaterial({ color: '#e8b89d', roughness: 0.7, metalness: 0.05 }),
    clothing: new THREE.MeshStandardMaterial({ color: clothingColor, roughness: 0.6, metalness: 0.1 }),
    clothingDark: new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(clothingColor).multiplyScalar(0.7), roughness: 0.6, metalness: 0.1 
    }),
    pants: new THREE.MeshStandardMaterial({ color: '#2d3748', roughness: 0.7, metalness: 0.05 }),
    shoes: new THREE.MeshStandardMaterial({ color: '#1a1a2e', roughness: 0.5, metalness: 0.15 }),
    hair: new THREE.MeshStandardMaterial({ color: '#2a1810', roughness: 0.9, metalness: 0 }),
    eyeWhite: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 }),
    eyeIris: new THREE.MeshStandardMaterial({
      color: isNight ? '#00ffff' : '#3a6ea5',
      emissive: isNight ? '#00ffff' : '#000000',
      emissiveIntensity: isNight ? 1.5 : 0,
      roughness: 0.2,
    }),
    mouth: new THREE.MeshStandardMaterial({ color: '#8b5e5e', roughness: 0.8 }),
  }), [clothingColor, isNight]);

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
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Head - sphere */}
      <mesh position={[0, 1.55, 0]} material={materials.skin}>
        <sphereGeometry args={[0.22, 12, 10]} />
      </mesh>

      {/* Hair - rounded cap on top */}
      <mesh position={[0, 1.7, -0.04]} material={materials.hair}>
        <sphereGeometry args={[0.23, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* Hair back */}
      <mesh position={[0, 1.55, -0.1]} material={materials.hair}>
        <sphereGeometry args={[0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.08, 1.57, 0.18]} material={materials.eyeWhite}>
        <sphereGeometry args={[0.04, 8, 6]} />
      </mesh>
      <mesh position={[0.08, 1.57, 0.18]} material={materials.eyeWhite}>
        <sphereGeometry args={[0.04, 8, 6]} />
      </mesh>
      {/* Pupils */}
      <mesh position={[-0.08, 1.57, 0.215]} material={materials.eyeIris}>
        <sphereGeometry args={[0.025, 6, 6]} />
      </mesh>
      <mesh position={[0.08, 1.57, 0.215]} material={materials.eyeIris}>
        <sphereGeometry args={[0.025, 6, 6]} />
      </mesh>

      {/* Mouth */}
      <mesh position={[0, 1.46, 0.2]} material={materials.mouth}>
        <boxGeometry args={[0.08, 0.02, 0.02]} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.35, 0]} material={materials.skin}>
        <cylinderGeometry args={[0.08, 0.1, 0.1, 8]} />
      </mesh>

      {/* Torso - capsule-like (cylinder + spheres) */}
      <mesh position={[0, 1.05, 0]} material={materials.clothing}>
        <cylinderGeometry args={[0.22, 0.2, 0.5, 10]} />
      </mesh>
      {/* Torso top cap */}
      <mesh position={[0, 1.3, 0]} material={materials.clothing}>
        <sphereGeometry args={[0.22, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* Torso bottom */}
      <mesh position={[0, 0.8, 0]} material={materials.clothingDark}>
        <sphereGeometry args={[0.2, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      </mesh>

      {/* Hoodie collar detail */}
      <mesh position={[0, 1.32, 0.1]} material={materials.clothingDark}>
        <boxGeometry args={[0.2, 0.08, 0.08]} />
      </mesh>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.3, 1.2, 0]}>
        {/* Upper arm */}
        <mesh position={[0, -0.12, 0]} material={materials.clothing}>
          <capsuleGeometry args={[0.07, 0.2, 4, 8]} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.35, 0]} material={materials.skin}>
          <capsuleGeometry args={[0.06, 0.15, 4, 8]} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.48, 0]} material={materials.skin}>
          <sphereGeometry args={[0.055, 6, 6]} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.3, 1.2, 0]}>
        <mesh position={[0, -0.12, 0]} material={materials.clothing}>
          <capsuleGeometry args={[0.07, 0.2, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.35, 0]} material={materials.skin}>
          <capsuleGeometry args={[0.06, 0.15, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.48, 0]} material={materials.skin}>
          <sphereGeometry args={[0.055, 6, 6]} />
        </mesh>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.1, 0.55, 0]}>
        {/* Upper leg */}
        <mesh position={[0, -0.05, 0]} material={materials.pants}>
          <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
        </mesh>
        {/* Lower leg */}
        <mesh position={[0, -0.3, 0]} material={materials.pants}>
          <capsuleGeometry args={[0.065, 0.15, 4, 8]} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.45, 0.04]} material={materials.shoes}>
          <boxGeometry args={[0.13, 0.08, 0.2]} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.1, 0.55, 0]}>
        <mesh position={[0, -0.05, 0]} material={materials.pants}>
          <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.3, 0]} material={materials.pants}>
          <capsuleGeometry args={[0.065, 0.15, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.45, 0.04]} material={materials.shoes}>
          <boxGeometry args={[0.13, 0.08, 0.2]} />
        </mesh>
      </group>

      {/* Night glow */}
      {isNight && (
        <pointLight position={[0, 0.5, 0]} color="#00ffff" intensity={0.4} distance={2} />
      )}
    </group>
  );
};

export default LowPolyCharacter;
