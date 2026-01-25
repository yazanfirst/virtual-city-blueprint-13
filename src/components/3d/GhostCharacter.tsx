import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '@/stores/playerStore';
import { useGhostHuntStore, GhostType } from '@/stores/ghostHuntStore';

interface GhostCharacterProps {
  id: string;
  position: [number, number, number];
  type: GhostType;
  isRevealed: boolean;
  isCaptured: boolean;
  isNight: boolean;
  onCaptured?: (id: string) => void;
}

// Ghost type colors and behaviors
const GHOST_CONFIGS: Record<GhostType, {
  color: string;
  emissive: string;
  speed: number;
  movePattern: 'wander' | 'lurk' | 'teleport' | 'stalk';
}> = {
  wanderer: {
    color: '#88CCFF',
    emissive: '#4488FF',
    speed: 0.02,
    movePattern: 'wander',
  },
  lurker: {
    color: '#88FF88',
    emissive: '#44AA44',
    speed: 0.01,
    movePattern: 'lurk',
  },
  trickster: {
    color: '#FFAA44',
    emissive: '#FF6600',
    speed: 0.03,
    movePattern: 'teleport',
  },
  shadow: {
    color: '#AA44FF',
    emissive: '#6600AA',
    speed: 0.025,
    movePattern: 'stalk',
  },
};

// Capture distance
const CAPTURE_DISTANCE = 2.5;
// EMF detection range
const EMF_MAX_RANGE = 15;
// Attack range (ghost can hurt player)
const ATTACK_RANGE = 1.5;

export default function GhostCharacter({
  id,
  position,
  type,
  isRevealed,
  isCaptured,
  isNight,
  onCaptured,
}: GhostCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const moveTimeRef = useRef(0);
  const wanderTargetRef = useRef<[number, number, number]>([...position]);
  const lastAttackRef = useRef(0);
  
  const playerPosition = usePlayerStore((s) => s.position);
  const { 
    moveGhost, 
    updateGhostEMF, 
    captureGhost, 
    hitByGhost,
    equipment, 
    phase,
    isProtected,
    ghostSpeedMultiplier,
  } = useGhostHuntStore();
  
  const config = GHOST_CONFIGS[type];
  
  // Create ghostly material - completely invisible until revealed
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.emissive,
      emissiveIntensity: isRevealed ? 0.8 : 0,
      transparent: true,
      opacity: isRevealed ? 0.85 : 0,
      side: THREE.DoubleSide,
    });
  }, [config, isRevealed]);
  
  // Update material opacity when revealed state changes
  useEffect(() => {
    if (material) {
      material.opacity = isRevealed ? 0.85 : 0;
      material.emissiveIntensity = isRevealed ? 0.8 : 0;
      material.needsUpdate = true;
    }
  }, [isRevealed, material]);
  
  useFrame((state, delta) => {
    if (isCaptured || phase !== 'hunting') return;
    if (!groupRef.current) return;
    
    timeRef.current += delta;
    moveTimeRef.current += delta;
    
    const [px, py, pz] = playerPosition;
    const [gx, gy, gz] = position;
    
    // Calculate distance to player
    const dx = px - gx;
    const dz = pz - gz;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    // Update EMF strength based on distance (only when EMF is active)
    if (equipment.emfActive) {
      const emfStrength = Math.max(0, 1 - distance / EMF_MAX_RANGE);
      updateGhostEMF(id, emfStrength);
    }
    
    // Ghost trap captures revealed ghosts (handled by useGhostTrapCapture hook)
    // No longer capturing by walking through
    
    // Ghost attacks player if close enough and not revealed
    if (!isRevealed && distance < ATTACK_RANGE && !isProtected) {
      const now = Date.now();
      if (now - lastAttackRef.current > 3000) { // 3 second cooldown between attacks
        lastAttackRef.current = now;
        hitByGhost();
      }
    }
    
    // Ghost movement AI
    let newX = gx;
    let newZ = gz;
    
    const adjustedSpeed = config.speed * ghostSpeedMultiplier;

    switch (config.movePattern) {
      case 'wander':
        // Random wandering
        if (moveTimeRef.current > 2) {
          moveTimeRef.current = 0;
          const angle = Math.random() * Math.PI * 2;
          const dist = 3 + Math.random() * 5;
          wanderTargetRef.current = [
            gx + Math.cos(angle) * dist,
            gy,
            gz + Math.sin(angle) * dist,
          ];
        }
        const [tx, , tz] = wanderTargetRef.current;
        const tdx = tx - gx;
        const tdz = tz - gz;
        const tDist = Math.sqrt(tdx * tdx + tdz * tdz);
        if (tDist > 0.5) {
          newX = gx + (tdx / tDist) * adjustedSpeed;
          newZ = gz + (tdz / tDist) * adjustedSpeed;
        }
        break;
        
      case 'lurk':
        // Stays mostly still, slight floating movement
        newX = gx + Math.sin(timeRef.current * 0.5) * 0.01;
        newZ = gz + Math.cos(timeRef.current * 0.3) * 0.01;
        break;
        
      case 'teleport':
        // Occasional teleport
        if (moveTimeRef.current > 4 && Math.random() < 0.1) {
          moveTimeRef.current = 0;
          const angle = Math.random() * Math.PI * 2;
          const dist = 8 + Math.random() * 10;
          newX = gx + Math.cos(angle) * dist;
          newZ = gz + Math.sin(angle) * dist;
        }
        break;
        
      case 'stalk':
        // Slowly moves toward player when not revealed
        if (!isRevealed && distance > ATTACK_RANGE) {
          newX = gx + (dx / distance) * adjustedSpeed;
          newZ = gz + (dz / distance) * adjustedSpeed;
        }
        break;
    }
    
    // Keep within bounds
    newX = Math.max(-70, Math.min(70, newX));
    newZ = Math.max(-65, Math.min(55, newZ));
    
    // Update position in store
    if (newX !== gx || newZ !== gz) {
      moveGhost(id, [newX, gy, newZ]);
    }
    
    // Floating animation
    const floatY = Math.sin(timeRef.current * 2) * 0.2;
    groupRef.current.position.set(gx, gy + floatY, gz);
    
    // Rotation for ghostly effect
    if (meshRef.current) {
      meshRef.current.rotation.y = timeRef.current * 0.5;
    }
  });
  
  if (isCaptured) return null;
  
  return (
    <group ref={groupRef} position={position}>
      {/* Ghost body - ethereal shape */}
      <mesh ref={meshRef} material={material}>
        <capsuleGeometry args={[0.6, 1.2, 8, 16]} />
      </mesh>
      
      {/* Ghost trail/wisps */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[
            Math.sin(i * 2.1) * 0.3,
            -0.8 - i * 0.3,
            Math.cos(i * 2.1) * 0.3,
          ]}
        >
          <sphereGeometry args={[0.25 - i * 0.05, 8, 8]} />
          <meshStandardMaterial
            color={config.color}
            emissive={config.emissive}
            emissiveIntensity={isRevealed ? 0.5 : 0}
            transparent
            opacity={isRevealed ? 0.6 - i * 0.15 : 0}
          />
        </mesh>
      ))}
      
      {/* Eyes - only visible when revealed */}
      {isRevealed && (
        <>
          <mesh position={[-0.2, 0.3, 0.5]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0.2, 0.3, 0.5]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          {/* Pupils */}
          <mesh position={[-0.2, 0.3, 0.6]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <mesh position={[0.2, 0.3, 0.6]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
        </>
      )}
      
      {/* Glow effect when revealed */}
      {isRevealed && (
        <pointLight
          color={config.emissive}
          intensity={1.5}
          distance={8}
          decay={2}
        />
      )}
    </group>
  );
}
