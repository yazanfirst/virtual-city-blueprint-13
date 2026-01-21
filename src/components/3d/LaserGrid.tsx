import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LaserGridData } from '@/stores/heistStore';
import { usePlayerStore } from '@/stores/playerStore';

interface LaserGridProps extends LaserGridData {
  onPlayerHit: () => void;
}

export default function LaserGrid({
  position,
  rotation,
  width,
  height,
  pattern,
  isActive,
  cycleTime,
  onPlayerHit,
}: LaserGridProps) {
  const groupRef = useRef<THREE.Group>(null);
  const hitCooldownRef = useRef(0);
  const playerPosition = usePlayerStore((state) => state.position);
  const [isVisible, setIsVisible] = useState(true);
  const sweepOffsetRef = useRef(0);

  useFrame((_, delta) => {
    if (!isActive) return;
    
    // Update cooldown
    if (hitCooldownRef.current > 0) {
      hitCooldownRef.current -= delta;
    }

    // Handle pattern animations
    if (pattern === 'sweep') {
      sweepOffsetRef.current = 0.6 + Math.sin(Date.now() * 0.002) * 0.6;
      if (groupRef.current) {
        groupRef.current.position.y = sweepOffsetRef.current;
      }
    }
    
    if (pattern === 'pulse') {
      const pulse = (Math.sin(Date.now() * 0.003 * Math.PI) + 1) / 2;
      const visible = pulse > 0.4;
      setIsVisible(visible);
      if (groupRef.current) {
        groupRef.current.visible = visible;
      }
      // Don't check collision when not visible
      if (!visible) return;
    }

    // Collision detection with proper Y-axis check
    const [px, py, pz] = playerPosition;
    const [lx, ly, lz] = position;
    
    // Calculate distance in XZ plane
    const dx = px - lx;
    const dz = pz - lz;
    const horizontalDist = Math.hypot(dx, dz);

    // Check if player is within the laser grid area (horizontal)
    if (horizontalDist > width * 0.6) return;

    // Get current laser heights based on pattern
    let laserHeights: number[];
    if (pattern === 'sweep') {
      // Sweep pattern: single beam that moves up and down
      const currentY = sweepOffsetRef.current;
      laserHeights = [currentY];
    } else {
      // Static/pulse: three horizontal beams at fixed heights
      laserHeights = [0.3, height / 2, height - 0.3];
    }

    // Check if player Y intersects with any laser beam
    // Player can jump over lasers (threshold: player Y > beam Y + 0.5)
    const playerBottomY = py;
    const playerTopY = py + 1.8; // Approximate player height

    for (const beamY of laserHeights) {
      const absoluteBeamY = ly + beamY;
      const beamThickness = 0.15;

      // Check if player body intersects with beam
      if (playerBottomY < absoluteBeamY + beamThickness && 
          playerTopY > absoluteBeamY - beamThickness) {
        
        // Player hit by laser!
        if (hitCooldownRef.current <= 0) {
          onPlayerHit();
          hitCooldownRef.current = 1.5; // 1.5 second cooldown between hits
        }
        break;
      }
    }
  });

  if (!isActive) return null;

  const beamColor = '#ff3b3b';
  const emissiveIntensity = 1.5;

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Laser beam emitter posts on each side */}
      <mesh position={[-width / 2 - 0.1, height / 2, 0]}>
        <boxGeometry args={[0.2, height, 0.2]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[width / 2 + 0.1, height / 2, 0]}>
        <boxGeometry args={[0.2, height, 0.2]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {pattern === 'sweep' ? (
        // Sweep pattern: single moving beam
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width, 0.08, 0.08]} />
          <meshStandardMaterial 
            color={beamColor} 
            emissive={beamColor} 
            emissiveIntensity={emissiveIntensity}
            transparent
            opacity={0.9}
          />
        </mesh>
      ) : (
        // Static/pulse pattern: three horizontal beams
        <>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[width, 0.05, 0.05]} />
            <meshStandardMaterial 
              color={beamColor} 
              emissive={beamColor} 
              emissiveIntensity={emissiveIntensity} 
            />
          </mesh>
          <mesh position={[0, height / 2, 0]}>
            <boxGeometry args={[width, 0.05, 0.05]} />
            <meshStandardMaterial 
              color={beamColor} 
              emissive={beamColor} 
              emissiveIntensity={emissiveIntensity} 
            />
          </mesh>
          <mesh position={[0, height - 0.3, 0]}>
            <boxGeometry args={[width, 0.05, 0.05]} />
            <meshStandardMaterial 
              color={beamColor} 
              emissive={beamColor} 
              emissiveIntensity={emissiveIntensity} 
            />
          </mesh>
        </>
      )}

      {/* Glow effect on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[width + 0.5, 1]} />
        <meshBasicMaterial color={beamColor} transparent opacity={0.15} />
      </mesh>
    </group>
  );
}
