import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { MissionIndicator } from '@/stores/missionStore';
import { INDICATOR_CONFIGS } from '@/config/mystery-box.config';

type MysteryIndicatorProps = {
  indicator: MissionIndicator;
  isNight?: boolean;
};

export default function MysteryIndicator({ indicator, isNight = false }: MysteryIndicatorProps) {
  const groupRef = useRef<THREE.Group>(null);
  const config = INDICATOR_CONFIGS[indicator.type];
  
  // Get the appropriate color based on decoy status
  const color = indicator.isDecoy ? config.decoyColor : config.trueColor;
  const intensity = indicator.isDecoy ? config.glowIntensity * 0.4 : config.glowIntensity;
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Apply decoy tell behaviors
    if (indicator.isDecoy && indicator.decoyTell) {
      switch (indicator.decoyTell) {
        case 'glitch':
          // Position wobbles
          groupRef.current.position.x = indicator.position.x + Math.sin(time * 10) * 0.1;
          groupRef.current.position.z = indicator.position.z + Math.cos(time * 8) * 0.1;
          break;
        case 'fade':
          // Opacity pulses (handled in material)
          break;
        case 'reversed':
          // Rotation reversed (handled in render)
          break;
        case 'cold':
          // Color is already set cold via decoyColor
          break;
      }
    }
  });
  
  // Calculate fade opacity for decoy
  const fadeOpacity = useMemo(() => {
    if (indicator.isDecoy && indicator.decoyTell === 'fade') {
      return 0.5 + Math.sin(Date.now() * 0.003) * 0.3;
    }
    return 1;
  }, [indicator.isDecoy, indicator.decoyTell]);
  
  // Arrow rotation (reversed for decoy tell)
  const arrowRotation = useMemo(() => {
    if (indicator.isDecoy && indicator.decoyTell === 'reversed') {
      return Math.PI; // Point away
    }
    return 0; // Point at shop
  }, [indicator.isDecoy, indicator.decoyTell]);

  const renderIndicator = () => {
    switch (indicator.type) {
      case 'billboard':
        return (
          <group position={[0, 8, 0]}>
            {/* Billboard pole */}
            <mesh position={[0, -3, 0]}>
              <cylinderGeometry args={[0.15, 0.2, 6, 8]} />
              <meshLambertMaterial color="#444444" />
            </mesh>
            {/* Billboard board */}
            <mesh>
              <boxGeometry args={[3, 2, 0.2]} />
              <meshStandardMaterial 
                color={color}
                emissive={color}
                emissiveIntensity={isNight ? intensity : intensity * 0.3}
                transparent
                opacity={fadeOpacity}
              />
            </mesh>
            {/* Mystery symbol */}
            <Text
              position={[0, 0, 0.15]}
              fontSize={1}
              color={isNight ? '#FFFFFF' : '#000000'}
            >
              ?
            </Text>
          </group>
        );
        
      case 'arrow':
        return (
          <group position={[0, 4, 2]} rotation={[0, arrowRotation, 0]}>
            {/* Arrow body */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 2, 8]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isNight ? intensity : intensity * 0.3}
                transparent
                opacity={fadeOpacity}
              />
            </mesh>
            {/* Arrow head */}
            <mesh position={[0, 0, -1.2]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.5, 0.8, 8]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isNight ? intensity : intensity * 0.3}
                transparent
                opacity={fadeOpacity}
              />
            </mesh>
          </group>
        );
        
      case 'glow':
        return (
          <group position={[0, 0, 0]}>
            {/* Glow ring around shop */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
              <ringGeometry args={[4, 5, 32]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isNight ? intensity * 0.8 : intensity * 0.3}
                transparent
                opacity={fadeOpacity * 0.6}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Point light for glow effect */}
            <pointLight
              position={[0, 3, 0]}
              color={color}
              intensity={isNight ? intensity * 2 : intensity * 0.5}
              distance={8}
            />
          </group>
        );
        
      case 'flag':
        return (
          <group position={[4, 0, 0]}>
            {/* Flag pole */}
            <mesh position={[0, 4, 0]}>
              <cylinderGeometry args={[0.08, 0.1, 8, 8]} />
              <meshLambertMaterial color="#666666" />
            </mesh>
            {/* Flag */}
            <mesh position={[0.8, 7, 0]}>
              <boxGeometry args={[1.5, 1, 0.05]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isNight ? intensity * 0.6 : intensity * 0.2}
                transparent
                opacity={fadeOpacity}
              />
            </mesh>
          </group>
        );
        
      case 'flicker':
        return (
          <group>
            {/* Window highlight effect */}
            <mesh position={[0, 3.5, 4.2]}>
              <boxGeometry args={[2.5, 2, 0.1]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isNight ? intensity : intensity * 0.3}
                transparent
                opacity={fadeOpacity * 0.7}
              />
            </mesh>
            {/* Flickering light inside */}
            <pointLight
              position={[0, 3.5, 3]}
              color={color}
              intensity={isNight ? intensity * 1.5 * (0.5 + Math.sin(Date.now() * 0.01) * 0.5) : intensity * 0.3}
              distance={6}
            />
          </group>
        );
        
      default:
        return null;
    }
  };

  return (
    <group
      ref={groupRef}
      position={[indicator.position.x, 0, indicator.position.z]}
    >
      {renderIndicator()}
    </group>
  );
}
