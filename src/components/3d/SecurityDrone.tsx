import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DroneType } from '@/stores/heistStore';
import { usePlayerStore } from '@/stores/playerStore';

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
  const playerPosition = usePlayerStore((state) => state.position);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group || patrolPath.length === 0) return;

    // Patrol logic: move towards current waypoint
    const targetIndex = waypointRef.current % patrolPath.length;
    const target = new THREE.Vector3(...patrolPath[targetIndex]);
    const current = group.position.clone();
    const distanceToWaypoint = current.distanceTo(target);
    const speed = type === 'hunter' && isAlerted ? 1.2 : type === 'hunter' ? 0.8 : 0.45;

    if (distanceToWaypoint < 0.4) {
      waypointRef.current = (waypointRef.current + 1) % patrolPath.length;
    } else if (!isAlerted) {
      // Normal patrol movement
      const direction = target.sub(current).normalize();
      group.position.add(direction.multiplyScalar(delta * speed));
      rotationRef.current = Math.atan2(direction.x, direction.z);
      group.rotation.y = rotationRef.current;
    }

    // If alerted (hunter type), chase player
    if (isAlerted && type === 'hunter') {
      const playerVec = new THREE.Vector3(playerPosition[0], group.position.y, playerPosition[2]);
      const chaseDir = playerVec.sub(group.position).normalize();
      group.position.add(chaseDir.multiplyScalar(delta * speed));
      rotationRef.current = Math.atan2(chaseDir.x, chaseDir.z);
      group.rotation.y = rotationRef.current;
    }

    // Detection logic: check if player is in detection cone
    const dx = playerPosition[0] - group.position.x;
    const dz = playerPosition[2] - group.position.z;
    const distanceToPlayer = Math.hypot(dx, dz);

    if (distanceToPlayer < detectionRange) {
      // Calculate angle to player
      const angleToPlayer = Math.atan2(dx, dz);
      // Normalize angles for comparison
      const droneFacing = rotationRef.current;
      let angleDiff = Math.abs(angleToPlayer - droneFacing);
      // Normalize to -PI to PI range
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

      // Convert cone angle from degrees to radians
      const halfConeRad = (detectionConeAngle / 2) * (Math.PI / 180);

      if (angleDiff < halfConeRad) {
        // Player is within detection cone
        const proximityFactor = 1 - distanceToPlayer / detectionRange;
        const detectionSpeed = 15 * proximityFactor; // Closer = faster detection
        const newAlertLevel = Math.min(100, alertLevel + detectionSpeed * delta);
        onAlertLevelChange(id, newAlertLevel);

        if (newAlertLevel >= 100 && !isAlerted) {
          onPlayerDetected(id);
        }
      } else {
        // Player outside cone, slowly reduce alert
        const decayRate = 8;
        const newAlertLevel = Math.max(0, alertLevel - decayRate * delta);
        onAlertLevelChange(id, newAlertLevel);
      }
    } else {
      // Player out of range, decay alert level
      const decayRate = 10;
      const newAlertLevel = Math.max(0, alertLevel - decayRate * delta);
      onAlertLevelChange(id, newAlertLevel);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Main body */}
      <mesh>
        <sphereGeometry args={[0.6, 24, 24]} />
        <meshStandardMaterial
          color={isAlerted ? '#ff4d4d' : alertLevel > 50 ? '#ffaa00' : '#3aa0ff'}
          emissive={isAlerted ? '#ff4d4d' : alertLevel > 50 ? '#ffaa00' : '#3aa0ff'}
          emissiveIntensity={isNight ? 0.6 : 0.3}
        />
      </mesh>
      {/* Antenna */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 12]} />
        <meshStandardMaterial color="#c8d2e2" />
      </mesh>
      {/* Eye/Sensor */}
      <mesh position={[0, 0, 0.6]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
      </mesh>
      {/* Wings */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -0.45, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1, 8]} />
        <meshStandardMaterial color="#6f7a8a" />
      </mesh>
      {/* Alert indicator ring */}
      {alertLevel > 0 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
          <ringGeometry args={[0.8, 1.0, 32]} />
          <meshBasicMaterial 
            color={isAlerted ? '#ff0000' : '#ffaa00'} 
            transparent 
            opacity={alertLevel / 200} 
          />
        </mesh>
      )}
    </group>
  );
}
