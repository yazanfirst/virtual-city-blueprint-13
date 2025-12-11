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

// Low-poly NPC that walks in one direction and respawns
export default function NPCCharacter({ 
  startPosition, 
  endPosition, 
  speed = 0.015,
  clothingColor = '#4A7FB5',
  isNight = false,
  name = 'Villager'
}: NPCProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  
  const progressRef = useRef(0);
  const walkPhaseRef = useRef(Math.random() * Math.PI * 2); // Random start phase
  const [visible, setVisible] = useState(true);
  const respawnTimerRef = useRef(0);

  const skinColor = useMemo(() => new THREE.Color('#E8B89D'), []);
  const hairColor = useMemo(() => new THREE.Color(isNight ? '#2A2A3A' : '#3A2A1A'), [isNight]);
  const clothingMaterial = useMemo(() => new THREE.MeshLambertMaterial({ color: clothingColor }), [clothingColor]);

  // Calculate facing direction once
  const facingAngle = useMemo(() => {
    return Math.atan2(
      endPosition[0] - startPosition[0],
      endPosition[2] - startPosition[2]
    );
  }, [startPosition, endPosition]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // If not visible, wait for respawn
    if (!visible) {
      respawnTimerRef.current += delta;
      if (respawnTimerRef.current > 3 + Math.random() * 4) { // 3-7 seconds respawn
        respawnTimerRef.current = 0;
        progressRef.current = 0;
        setVisible(true);
      }
      return;
    }

    // Move forward only
    progressRef.current += speed * delta * 60;
    
    // When reaching the end, disappear
    if (progressRef.current >= 1) {
      setVisible(false);
      return;
    }

    // Interpolate position
    const x = startPosition[0] + (endPosition[0] - startPosition[0]) * progressRef.current;
    const z = startPosition[2] + (endPosition[2] - startPosition[2]) * progressRef.current;
    
    groupRef.current.position.set(x, startPosition[1], z);
    groupRef.current.rotation.y = facingAngle;

    // Walking animation - smooth and natural
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
      {/* Body */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[0.35, 0.5, 0.2]} />
        <primitive object={clothingMaterial} attach="material" />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[0.25, 0.3, 0.25]} />
        <meshLambertMaterial color={skinColor} />
      </mesh>
      
      {/* Hair */}
      <mesh position={[0, 1.35, 0]}>
        <boxGeometry args={[0.27, 0.12, 0.27]} />
        <meshLambertMaterial color={hairColor} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.06, 1.18, 0.13]}>
        <boxGeometry args={[0.04, 0.04, 0.02]} />
        <meshBasicMaterial color={isNight ? '#6A8ACC' : '#3A3A3A'} />
      </mesh>
      <mesh position={[0.06, 1.18, 0.13]}>
        <boxGeometry args={[0.04, 0.04, 0.02]} />
        <meshBasicMaterial color={isNight ? '#6A8ACC' : '#3A3A3A'} />
      </mesh>
      
      {/* Left Arm */}
      <mesh ref={leftArmRef} position={[-0.25, 0.65, 0]}>
        <boxGeometry args={[0.12, 0.4, 0.12]} />
        <meshLambertMaterial color={skinColor} />
      </mesh>
      
      {/* Right Arm */}
      <mesh ref={rightArmRef} position={[0.25, 0.65, 0]}>
        <boxGeometry args={[0.12, 0.4, 0.12]} />
        <meshLambertMaterial color={skinColor} />
      </mesh>
      
      {/* Left Leg */}
      <mesh ref={leftLegRef} position={[-0.1, 0.25, 0]}>
        <boxGeometry args={[0.12, 0.35, 0.12]} />
        <primitive object={clothingMaterial} attach="material" />
      </mesh>
      
      {/* Right Leg */}
      <mesh ref={rightLegRef} position={[0.1, 0.25, 0]}>
        <boxGeometry args={[0.12, 0.35, 0.12]} />
        <primitive object={clothingMaterial} attach="material" />
      </mesh>

      {/* Night glow effect */}
      {isNight && (
        <pointLight position={[0, 1, 0]} intensity={0.3} distance={3} color="#FFE4B5" />
      )}
    </group>
  );
}
