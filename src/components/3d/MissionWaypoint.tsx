import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useMissionStore } from '@/stores/missionStore';
import { usePlayerStore } from '@/stores/playerStore';

// Glowing waypoint beacon for current mission objective
const MissionWaypoint = () => {
  const beaconRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const arrowRef = useRef<THREE.Group>(null);
  
  const currentTask = useMissionStore((s) => s.currentTask);
  const playerPosition = usePlayerStore((s) => s.position);
  
  // Animation state
  const animationRef = useRef({ time: 0, pulseScale: 1 });
  
  // Get target location from current task
  const targetLocation = useMemo(() => {
    if (!currentTask?.targetLocation) return null;
    return {
      x: currentTask.targetLocation.x,
      z: currentTask.targetLocation.z,
      radius: currentTask.targetLocation.radius,
    };
  }, [currentTask]);
  
  // Calculate distance to target
  const distance = useMemo(() => {
    if (!targetLocation) return 0;
    const dx = playerPosition[0] - targetLocation.x;
    const dz = playerPosition[2] - targetLocation.z;
    return Math.sqrt(dx * dx + dz * dz);
  }, [playerPosition, targetLocation]);
  
  // Waypoint color based on task type
  const waypointColor = useMemo(() => {
    if (!currentTask) return '#4488FF';
    switch (currentTask.type) {
      case 'move_to': return '#4488FF'; // Blue
      case 'find_box': return '#FFD700'; // Gold
      case 'visit_shop': return '#00FF88'; // Green
      case 'collect_coins': return '#FFAA00'; // Orange
      case 'destroy_count': return '#FF4444'; // Red
      case 'punch_object': return '#FF6600'; // Orange-red
      default: return '#4488FF';
    }
  }, [currentTask]);
  
  // Animate beacon
  useFrame((_, delta) => {
    if (!beaconRef.current || !ringRef.current) return;
    
    animationRef.current.time += delta;
    const t = animationRef.current.time;
    
    // Pulse scale
    const pulse = 1 + Math.sin(t * 3) * 0.15;
    beaconRef.current.scale.set(pulse, 1, pulse);
    
    // Ring expansion animation
    const ringScale = 1 + (t % 2) * 0.5;
    const ringOpacity = 1 - (t % 2) / 2;
    ringRef.current.scale.set(ringScale, 1, ringScale);
    if (ringRef.current.material instanceof THREE.MeshBasicMaterial) {
      ringRef.current.material.opacity = ringOpacity * 0.6;
    }
    
    // Rotate beacon slowly
    beaconRef.current.rotation.y += delta * 0.5;
    
    // Floating arrow animation
    if (arrowRef.current) {
      arrowRef.current.position.y = 8 + Math.sin(t * 2) * 0.5;
      arrowRef.current.rotation.y += delta;
    }
  });
  
  if (!targetLocation || !currentTask || currentTask.completed) return null;
  
  // Don't show waypoint if player is within radius (task about to complete)
  if (distance <= targetLocation.radius) return null;
  
  return (
    <group position={[targetLocation.x, 0, targetLocation.z]}>
      {/* Ground ring - pulsing circle */}
      <mesh 
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0.05, 0]}
      >
        <ringGeometry args={[targetLocation.radius - 0.3, targetLocation.radius, 32]} />
        <meshBasicMaterial 
          color={waypointColor} 
          transparent 
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Inner target area indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[targetLocation.radius, 32]} />
        <meshBasicMaterial 
          color={waypointColor} 
          transparent 
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Vertical beacon pillar */}
      <mesh ref={beaconRef} position={[0, 10, 0]}>
        <cylinderGeometry args={[0.15, 0.4, 20, 8]} />
        <meshBasicMaterial 
          color={waypointColor} 
          transparent 
          opacity={0.4}
        />
      </mesh>
      
      {/* Glowing beacon top */}
      <mesh position={[0, 20, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial color={waypointColor} />
      </mesh>
      
      {/* Floating arrow pointing down */}
      <group ref={arrowRef} position={[0, 8, 0]}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.5, 1.2, 4]} />
          <meshBasicMaterial color={waypointColor} />
        </mesh>
      </group>
      
      {/* Task description text */}
      <Text
        position={[0, 6, 0]}
        fontSize={0.8}
        color={waypointColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#000000"
        rotation={[0, 0, 0]}
        // Make text always face camera using billboard effect
        {...{ billboard: true } as any}
      >
        {currentTask.description}
      </Text>
      
      {/* Distance indicator */}
      <Text
        position={[0, 5, 0]}
        fontSize={0.5}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
        {...{ billboard: true } as any}
      >
        {`${Math.round(distance)}m away`}
      </Text>
    </group>
  );
};

export default MissionWaypoint;
