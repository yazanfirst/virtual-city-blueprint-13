import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { 
  MysteryBoxConfig, 
  RARITY_CONFIG, 
  pickRandomReward,
  Reward 
} from '@/config/mysteryBoxes.config';
import { usePlayerStore } from '@/stores/playerStore';
import { useGameStore } from '@/stores/gameStore';

type MysteryBoxProps = {
  config: MysteryBoxConfig;
  onCollect: (boxId: string, reward: Reward) => void;
  isNight?: boolean;
};

// Particle system for collection effect
function CollectionParticles({ 
  position, 
  color, 
  active 
}: { 
  position: [number, number, number]; 
  color: string;
  active: boolean;
}) {
  const particlesRef = useRef<THREE.Points>(null);
  const startTimeRef = useRef(0);
  
  const [positions, velocities] = useMemo(() => {
    const count = 30;
    const pos = new Float32Array(count * 3);
    const vel: [number, number, number][] = [];
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 1] = Math.random() * 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      
      vel.push([
        (Math.random() - 0.5) * 4,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 4,
      ]);
    }
    
    return [pos, vel];
  }, []);

  useEffect(() => {
    if (active) {
      startTimeRef.current = Date.now();
    }
  }, [active]);

  useFrame(() => {
    if (!particlesRef.current || !active) return;
    
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    if (elapsed > 1.5) return;
    
    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < velocities.length; i++) {
      posArray[i * 3] += velocities[i][0] * 0.016;
      posArray[i * 3 + 1] += velocities[i][1] * 0.016 - 9.8 * elapsed * 0.01;
      posArray[i * 3 + 2] += velocities[i][2] * 0.016;
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Fade out
    const mat = particlesRef.current.material as THREE.PointsMaterial;
    mat.opacity = Math.max(0, 1 - elapsed / 1.5);
  });

  if (!active) return null;

  return (
    <points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.15}
        transparent
        opacity={1}
        sizeAttenuation
      />
    </points>
  );
}

export default function MysteryBox({ config, onCollect, isNight = false }: MysteryBoxProps) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const [isCollected, setIsCollected] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [respawnTimer, setRespawnTimer] = useState(0);
  const timeRef = useRef(0);
  
  const playerPosition = usePlayerStore((state) => state.position);
  const rarityConfig = RARITY_CONFIG[config.rarity];
  
  const boxColor = useMemo(() => new THREE.Color(rarityConfig.color), [rarityConfig.color]);
  const glowColor = useMemo(() => new THREE.Color(rarityConfig.glowColor), [rarityConfig.glowColor]);

  // Check collision with player
  useFrame((_, delta) => {
    if (isCollected) {
      // Handle respawn timer
      setRespawnTimer((prev) => {
        const newTime = prev + delta;
        if (newTime >= config.respawnSeconds) {
          setIsCollected(false);
          setShowParticles(false);
          return 0;
        }
        return newTime;
      });
      return;
    }

    timeRef.current += delta;
    
    if (!groupRef.current) return;
    
    // Spinning animation
    groupRef.current.rotation.y += delta * rarityConfig.spinSpeed;
    
    // Floating/bouncing animation
    const bounce = Math.sin(timeRef.current * 3) * rarityConfig.bounceHeight;
    groupRef.current.position.y = config.position[1] + 0.5 + bounce;
    
    // Inner glow pulse
    if (innerRef.current) {
      const pulse = Math.sin(timeRef.current * 4) * 0.5 + 0.5;
      (innerRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + pulse * 0.4;
    }
    
    // Collision detection
    const dx = playerPosition[0] - config.position[0];
    const dz = playerPosition[2] - config.position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < 1.5) {
      // Collect the box!
      setIsCollected(true);
      setShowParticles(true);
      const reward = pickRandomReward(config.rarity);
      onCollect(config.id, reward);
    }
  });

  if (isCollected && !showParticles) return null;

  return (
    <group position={[config.position[0], 0, config.position[2]]}>
      {/* Particles on collection */}
      <CollectionParticles 
        position={[0, 1, 0]} 
        color={rarityConfig.particleColor} 
        active={showParticles} 
      />
      
      {!isCollected && (
        <group ref={groupRef} position={[0, config.position[1] + 0.5, 0]} scale={rarityConfig.scale}>
          {/* Question mark floating above */}
          <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[0.3, 0.5, 0.1]} />
            <meshBasicMaterial color={rarityConfig.glowColor} />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <boxGeometry args={[0.15, 0.15, 0.1]} />
            <meshBasicMaterial color={rarityConfig.glowColor} />
          </mesh>
          
          {/* Outer box frame */}
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={boxColor}
              metalness={0.8}
              roughness={0.2}
              emissive={glowColor}
              emissiveIntensity={isNight ? rarityConfig.glowIntensity * 1.5 : rarityConfig.glowIntensity}
            />
          </mesh>
          
          {/* Inner glow core */}
          <mesh ref={innerRef} scale={0.6}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial
              color={rarityConfig.glowColor}
              transparent
              opacity={0.5}
            />
          </mesh>
          
          {/* Corner decorations */}
          {[
            [-0.45, -0.45, -0.45], [0.45, -0.45, -0.45],
            [-0.45, 0.45, -0.45], [0.45, 0.45, -0.45],
            [-0.45, -0.45, 0.45], [0.45, -0.45, 0.45],
            [-0.45, 0.45, 0.45], [0.45, 0.45, 0.45],
          ].map((pos, i) => (
            <mesh key={i} position={pos as [number, number, number]}>
              <sphereGeometry args={[0.1, 6, 6]} />
              <meshBasicMaterial color={rarityConfig.glowColor} />
            </mesh>
          ))}
          
          {/* Glow light */}
          <pointLight
            color={rarityConfig.glowColor}
            intensity={isNight ? 2 : 1}
            distance={5}
            decay={2}
          />
          
          {/* Ground ring indicator */}
          <mesh position={[0, -0.49, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 1.1, 16]} />
            <meshBasicMaterial
              color={rarityConfig.glowColor}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
