import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type CarProps = {
  startPosition: [number, number, number];
  endPosition: [number, number, number];
  speed?: number;
  carColor?: string;
  isNight?: boolean;
};

// Low-poly car that drives in one direction and respawns
export default function CarVehicle({ 
  startPosition, 
  endPosition, 
  speed = 0.02,
  carColor = '#D97B4A',
  isNight = false,
}: CarProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  const progressRef = useRef(Math.random()); // Random start position
  const [visible, setVisible] = useState(true);
  const respawnTimerRef = useRef(0);

  const bodyColor = useMemo(() => new THREE.Color(carColor), [carColor]);
  const wheelColor = useMemo(() => new THREE.Color('#2A2A2A'), []);
  const windowColor = useMemo(() => new THREE.Color(isNight ? '#4A6080' : '#8ABEDC'), [isNight]);

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
      if (respawnTimerRef.current > 2 + Math.random() * 3) { // 2-5 seconds respawn
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
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={startPosition}>
      {/* Car Body - Main */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.2, 0.4, 2.4]} />
        <meshLambertMaterial color={bodyColor} />
      </mesh>
      
      {/* Car Cabin */}
      <mesh position={[0, 0.75, -0.1]}>
        <boxGeometry args={[1.0, 0.35, 1.4]} />
        <meshLambertMaterial color={bodyColor} />
      </mesh>
      
      {/* Windshield - Front */}
      <mesh position={[0, 0.75, 0.65]}>
        <boxGeometry args={[0.9, 0.3, 0.1]} />
        <meshLambertMaterial color={windowColor} transparent opacity={0.7} />
      </mesh>
      
      {/* Rear Window */}
      <mesh position={[0, 0.75, -0.75]}>
        <boxGeometry args={[0.9, 0.3, 0.1]} />
        <meshLambertMaterial color={windowColor} transparent opacity={0.7} />
      </mesh>
      
      {/* Side Windows */}
      <mesh position={[0.55, 0.75, -0.1]}>
        <boxGeometry args={[0.1, 0.25, 1.2]} />
        <meshLambertMaterial color={windowColor} transparent opacity={0.7} />
      </mesh>
      <mesh position={[-0.55, 0.75, -0.1]}>
        <boxGeometry args={[0.1, 0.25, 1.2]} />
        <meshLambertMaterial color={windowColor} transparent opacity={0.7} />
      </mesh>
      
      {/* Wheels */}
      <mesh position={[0.5, 0.2, 0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.15, 8]} />
        <meshLambertMaterial color={wheelColor} />
      </mesh>
      <mesh position={[-0.5, 0.2, 0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.15, 8]} />
        <meshLambertMaterial color={wheelColor} />
      </mesh>
      <mesh position={[0.5, 0.2, -0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.15, 8]} />
        <meshLambertMaterial color={wheelColor} />
      </mesh>
      <mesh position={[-0.5, 0.2, -0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.15, 8]} />
        <meshLambertMaterial color={wheelColor} />
      </mesh>

      {/* Headlights */}
      <mesh position={[0.4, 0.4, 1.21]}>
        <boxGeometry args={[0.2, 0.15, 0.05]} />
        <meshBasicMaterial color={isNight ? '#FFFFAA' : '#FFFFFF'} />
      </mesh>
      <mesh position={[-0.4, 0.4, 1.21]}>
        <boxGeometry args={[0.2, 0.15, 0.05]} />
        <meshBasicMaterial color={isNight ? '#FFFFAA' : '#FFFFFF'} />
      </mesh>
      
      {/* Tail lights */}
      <mesh position={[0.4, 0.4, -1.21]}>
        <boxGeometry args={[0.2, 0.1, 0.05]} />
        <meshBasicMaterial color="#CC3333" />
      </mesh>
      <mesh position={[-0.4, 0.4, -1.21]}>
        <boxGeometry args={[0.2, 0.1, 0.05]} />
        <meshBasicMaterial color="#CC3333" />
      </mesh>

      {/* Night headlight glow */}
      {isNight && (
        <>
          <pointLight position={[0, 0.4, 2]} intensity={0.5} distance={8} color="#FFFFCC" />
          <pointLight position={[0, 0.4, -1.5]} intensity={0.2} distance={3} color="#FF4444" />
        </>
      )}
    </group>
  );
}
