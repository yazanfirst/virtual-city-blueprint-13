import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DroneType } from '@/stores/heistStore';

interface SecurityDroneProps {
  id: string;
  position: [number, number, number];
  patrolPath: [number, number, number][];
  type: DroneType;
  detectionRange: number;
  detectionConeAngle: number;
  isAlerted: boolean;
  alertLevel: number;
  isNight: boolean;
  onPlayerDetected: (droneId: string) => void;
  onAlertLevelChange: (droneId: string, level: number) => void;
}

export default function SecurityDrone({
  id,
  position,
  patrolPath,
  type,
  detectionRange,
  detectionConeAngle,
  isAlerted,
  alertLevel,
  isNight,
  onPlayerDetected,
  onAlertLevelChange,
}: SecurityDroneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const rotationRef = useRef(0);
  const waypointRef = useRef(0);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group || patrolPath.length === 0) return;

    const targetIndex = waypointRef.current % patrolPath.length;
    const target = new THREE.Vector3(...patrolPath[targetIndex]);
    const current = group.position.clone();
    const distance = current.distanceTo(target);
    const speed = type === 'hunter' ? 0.8 : 0.45;

    if (distance < 0.4) {
      waypointRef.current = (waypointRef.current + 1) % patrolPath.length;
    } else {
      const direction = target.sub(current).normalize();
      group.position.add(direction.multiplyScalar(delta * speed));
      rotationRef.current = Math.atan2(direction.x, direction.z);
      group.rotation.y = rotationRef.current;
    }

    if (isAlerted) {
      onAlertLevelChange(id, Math.min(100, alertLevel + delta * 10));
    } else {
      onAlertLevelChange(id, Math.max(0, alertLevel - delta * 4));
    }

    if (!isAlerted && alertLevel >= 100) {
      onPlayerDetected(id);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <sphereGeometry args={[0.6, 24, 24]} />
        <meshStandardMaterial
          color={isAlerted ? '#ff4d4d' : '#3aa0ff'}
          emissive={isAlerted ? '#ff4d4d' : '#3aa0ff'}
          emissiveIntensity={isNight ? 0.6 : 0.3}
        />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 12]} />
        <meshStandardMaterial color="#c8d2e2" />
      </mesh>
      <mesh position={[0, 0, 0.6]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -0.45, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1, 8]} />
        <meshStandardMaterial color="#6f7a8a" />
      </mesh>
    </group>
  );
}
