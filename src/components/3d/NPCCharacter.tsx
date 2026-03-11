import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type NPCProps = {
  startPosition: [number, number, number];
  endPosition: [number, number, number];
  speed?: number;
  clothingColor?: string;
  isNight?: boolean;
  name?: string;
};

export default function NPCCharacter({ 
  startPosition, 
  endPosition, 
  speed = 0.015,
  clothingColor = '#4A7FB5',
  isNight = false,
  name = 'Villager'
}: NPCProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  
  const progressRef = useRef(0);
  const walkPhaseRef = useRef(Math.random() * Math.PI * 2);
  const [visible, setVisible] = useState(true);
  const respawnTimerRef = useRef(0);

  const materials = useMemo(() => ({
    skin: new THREE.MeshStandardMaterial({ color: '#e8b89d', roughness: 0.7, metalness: 0.05 }),
    clothing: new THREE.MeshStandardMaterial({ color: clothingColor, roughness: 0.6, metalness: 0.1 }),
    clothingDark: new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(clothingColor).multiplyScalar(0.7), roughness: 0.6 
    }),
    pants: new THREE.MeshStandardMaterial({ color: '#3a3a4a', roughness: 0.7 }),
    hair: new THREE.MeshStandardMaterial({ color: isNight ? '#2A2A3A' : '#3A2A1A', roughness: 0.9 }),
    shoes: new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.5, metalness: 0.1 }),
    eye: new THREE.MeshBasicMaterial({ color: isNight ? '#6A8ACC' : '#3A3A3A' }),
  }), [clothingColor, isNight]);

  const facingAngle = useMemo(() => {
    return Math.atan2(
      endPosition[0] - startPosition[0],
      endPosition[2] - startPosition[2]
    );
  }, [startPosition, endPosition]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (!visible) {
      respawnTimerRef.current += delta;
      if (respawnTimerRef.current > 3 + Math.random() * 4) {
        respawnTimerRef.current = 0;
        progressRef.current = 0;
        setVisible(true);
      }
      return;
    }

    progressRef.current += speed * delta * 60;
    
    if (progressRef.current >= 1) {
      setVisible(false);
      return;
    }

    const x = startPosition[0] + (endPosition[0] - startPosition[0]) * progressRef.current;
    const z = startPosition[2] + (endPosition[2] - startPosition[2]) * progressRef.current;
    
    groupRef.current.position.set(x, startPosition[1], z);
    groupRef.current.rotation.y = facingAngle;

    walkPhaseRef.current += delta * 6;
    const swing = Math.sin(walkPhaseRef.current) * 0.35;

    if (leftArmRef.current) leftArmRef.current.rotation.x = swing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -swing;
    if (leftLegRef.current) leftLegRef.current.rotation.x = -swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = swing;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={startPosition}>
      {/* Head */}
      <mesh position={[0, 1.18, 0]} material={materials.skin}>
        <sphereGeometry args={[0.17, 10, 8]} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.3, -0.02]} material={materials.hair}>
        <sphereGeometry args={[0.18, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.06, 1.2, 0.14]} material={materials.eye}>
        <sphereGeometry args={[0.025, 6, 6]} />
      </mesh>
      <mesh position={[0.06, 1.2, 0.14]} material={materials.eye}>
        <sphereGeometry args={[0.025, 6, 6]} />
      </mesh>
      
      {/* Neck */}
      <mesh position={[0, 1.0, 0]} material={materials.skin}>
        <cylinderGeometry args={[0.06, 0.07, 0.06, 6]} />
      </mesh>
      
      {/* Torso */}
      <mesh position={[0, 0.72, 0]} material={materials.clothing}>
        <capsuleGeometry args={[0.15, 0.28, 4, 8]} />
      </mesh>
      
      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.22, 0.88, 0]}>
        <mesh position={[0, -0.1, 0]} material={materials.clothing}>
          <capsuleGeometry args={[0.05, 0.15, 4, 6]} />
        </mesh>
        <mesh position={[0, -0.28, 0]} material={materials.skin}>
          <capsuleGeometry args={[0.045, 0.1, 4, 6]} />
        </mesh>
        <mesh position={[0, -0.38, 0]} material={materials.skin}>
          <sphereGeometry args={[0.04, 6, 6]} />
        </mesh>
      </group>
      
      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.22, 0.88, 0]}>
        <mesh position={[0, -0.1, 0]} material={materials.clothing}>
          <capsuleGeometry args={[0.05, 0.15, 4, 6]} />
        </mesh>
        <mesh position={[0, -0.28, 0]} material={materials.skin}>
          <capsuleGeometry args={[0.045, 0.1, 4, 6]} />
        </mesh>
        <mesh position={[0, -0.38, 0]} material={materials.skin}>
          <sphereGeometry args={[0.04, 6, 6]} />
        </mesh>
      </group>
      
      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.08, 0.35, 0]}>
        <mesh position={[0, -0.03, 0]} material={materials.pants}>
          <capsuleGeometry args={[0.06, 0.15, 4, 6]} />
        </mesh>
        <mesh position={[0, -0.22, 0]} material={materials.pants}>
          <capsuleGeometry args={[0.05, 0.1, 4, 6]} />
        </mesh>
        <mesh position={[0, -0.32, 0.03]} material={materials.shoes}>
          <boxGeometry args={[0.1, 0.06, 0.16]} />
        </mesh>
      </group>
      
      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.08, 0.35, 0]}>
        <mesh position={[0, -0.03, 0]} material={materials.pants}>
          <capsuleGeometry args={[0.06, 0.15, 4, 6]} />
        </mesh>
        <mesh position={[0, -0.22, 0]} material={materials.pants}>
          <capsuleGeometry args={[0.05, 0.1, 4, 6]} />
        </mesh>
        <mesh position={[0, -0.32, 0.03]} material={materials.shoes}>
          <boxGeometry args={[0.1, 0.06, 0.16]} />
        </mesh>
      </group>

      {/* Night glow */}
      {isNight && (
        <pointLight position={[0, 1, 0]} intensity={0.3} distance={3} color="#FFE4B5" />
      )}
    </group>
  );
}
