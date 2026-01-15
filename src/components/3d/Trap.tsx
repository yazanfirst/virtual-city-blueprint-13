import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '@/stores/playerStore';
import { TrapType } from '@/stores/gameStore';

type TrapProps = {
  id: string;
  type: TrapType;
  position: [number, number, number];
  pattern: { activeTime: number; cooldownTime: number };
  onPlayerHit: () => void;
  isNight?: boolean;
};

const TRAP_DAMAGE_DISTANCE = 1.2;

export default function Trap({
  id,
  type,
  position,
  pattern,
  onPlayerHit,
  isNight = false,
}: TrapProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isActive, setIsActive] = useState(false);
  const [spikeHeight, setSpikeHeight] = useState(0);
  const lastDamageTimeRef = useRef(0);
  const playerPosition = usePlayerStore((state) => state.position);

  // Trap activation cycle
  useEffect(() => {
    if (type === 'pressure') return; // Pressure plates are triggered by player

    const cycle = () => {
      // Activate
      setIsActive(true);
      
      setTimeout(() => {
        // Deactivate
        setIsActive(false);
      }, pattern.activeTime);
    };

    const interval = setInterval(cycle, pattern.activeTime + pattern.cooldownTime);
    cycle(); // Start immediately

    return () => clearInterval(interval);
  }, [pattern, type]);

  useFrame(() => {
    if (!groupRef.current) return;

    // Animate spike traps
    if (type === 'spike') {
      const targetHeight = isActive ? 1 : 0;
      const newHeight = THREE.MathUtils.lerp(spikeHeight, targetHeight, 0.15);
      setSpikeHeight(newHeight);
    }

    // Check for player collision when active
    if (isActive || type === 'pressure') {
      const dx = playerPosition[0] - position[0];
      const dz = playerPosition[2] - position[2];
      const distance = Math.sqrt(dx * dx + dz * dz);

      // Pressure plate activation
      if (type === 'pressure' && distance < TRAP_DAMAGE_DISTANCE && !isActive) {
        setIsActive(true);
        setTimeout(() => setIsActive(false), pattern.activeTime);
      }

      // Damage check
      if (isActive && distance < TRAP_DAMAGE_DISTANCE) {
        const now = Date.now();
        if (now - lastDamageTimeRef.current > 2000) { // 2 second cooldown
          lastDamageTimeRef.current = now;
          onPlayerHit();
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Spike Trap */}
      {type === 'spike' && (
        <>
          {/* Base plate */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 0.1, 8]} />
            <meshStandardMaterial color="#4A4A4A" metalness={0.8} roughness={0.3} />
          </mesh>
          
          {/* Spikes */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const angle = (i * Math.PI * 2) / 6;
            const x = Math.cos(angle) * 0.4;
            const z = Math.sin(angle) * 0.4;
            return (
              <mesh 
                key={i} 
                position={[x, 0.1 + spikeHeight * 0.5, z]}
                scale={[1, spikeHeight, 1]}
              >
                <coneGeometry args={[0.08, 0.8, 4]} />
                <meshStandardMaterial 
                  color="#8B0000" 
                  metalness={0.9} 
                  roughness={0.2}
                  emissive={isActive ? "#FF0000" : "#000000"}
                  emissiveIntensity={isActive ? 0.5 : 0}
                />
              </mesh>
            );
          })}
          {/* Center spike */}
          <mesh 
            position={[0, 0.1 + spikeHeight * 0.5, 0]}
            scale={[1, spikeHeight, 1]}
          >
            <coneGeometry args={[0.1, 1, 4]} />
            <meshStandardMaterial 
              color="#8B0000" 
              metalness={0.9} 
              roughness={0.2}
              emissive={isActive ? "#FF0000" : "#000000"}
              emissiveIntensity={isActive ? 0.5 : 0}
            />
          </mesh>
          
          {/* Warning indicator */}
          {isActive && (
            <pointLight position={[0, 0.5, 0]} intensity={1} distance={3} color="#FF0000" />
          )}
        </>
      )}

      {/* Laser Trap - Only visible at night */}
      {type === 'laser' && isNight && (
        <>
          {/* Laser emitter posts */}
          <mesh position={[-2, 0.5, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 1, 8]} />
            <meshStandardMaterial color="#333333" metalness={0.8} />
          </mesh>
          <mesh position={[2, 0.5, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 1, 8]} />
            <meshStandardMaterial color="#333333" metalness={0.8} />
          </mesh>
          
          {/* Laser beam */}
          {isActive && (
            <>
              <mesh position={[0, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.03, 0.03, 4, 8]} />
                <meshStandardMaterial 
                  color="#FF0000" 
                  emissive="#FF0000"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.8}
                />
              </mesh>
              <pointLight position={[0, 0.8, 0]} intensity={2} distance={4} color="#FF0000" />
            </>
          )}
          
          {/* Laser glow on emitters */}
          <mesh position={[-2, 0.8, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial 
              color={isActive ? "#FF0000" : "#330000"} 
              emissive={isActive ? "#FF0000" : "#000000"}
              emissiveIntensity={isActive ? 1 : 0}
            />
          </mesh>
          <mesh position={[2, 0.8, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial 
              color={isActive ? "#FF0000" : "#330000"} 
              emissive={isActive ? "#FF0000" : "#000000"}
              emissiveIntensity={isActive ? 1 : 0}
            />
          </mesh>
        </>
      )}

      {/* Pressure Plate */}
      {type === 'pressure' && (
        <>
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[1.2, 0.05, 1.2]} />
            <meshStandardMaterial 
              color={isActive ? "#FF6600" : "#666666"} 
              metalness={0.6} 
              roughness={0.4}
              emissive={isActive ? "#FF3300" : "#000000"}
              emissiveIntensity={isActive ? 0.8 : 0}
            />
          </mesh>
          
          {/* Warning symbol */}
          <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.4, 3]} />
            <meshStandardMaterial 
              color="#FFFF00" 
              emissive="#FFFF00"
              emissiveIntensity={0.3}
            />
          </mesh>
        </>
      )}

      {/* Falling Obstacle Trap */}
      {type === 'falling' && (
        <>
          {/* Shadow warning on ground */}
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1, 16]} />
            <meshStandardMaterial 
              color="#000000" 
              transparent 
              opacity={isActive ? 0.5 : 0.1}
            />
          </mesh>
          
          {/* Falling crate */}
          {isActive && (
            <mesh position={[0, 5, 0]}>
              <boxGeometry args={[1.5, 1.5, 1.5]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
          )}
        </>
      )}
    </group>
  );
}
