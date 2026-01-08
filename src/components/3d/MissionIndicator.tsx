import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { IndicatorData } from '@/lib/mission/indicatorGenerator';
import { usePlayerStore } from '@/stores/playerStore';

interface MissionIndicatorProps {
  data: IndicatorData;
  isNight: boolean;
}

export default function MissionIndicator({ data, isNight }: MissionIndicatorProps) {
  const meshRef = useRef<THREE.Group>(null);
  const playerPosition = usePlayerStore((s) => s.position);
  const opacityRef = useRef(1);

  // Calculate distance
  const dx = playerPosition[0] - data.position[0];
  const dz = playerPosition[2] - data.position[2];
  const distance = Math.sqrt(dx * dx + dz * dz);

  // Check visibility based on night mode (computed, not early return)
  const isVisible = !(data.visibleAtNight === true && !isNight) && 
                    !(data.visibleAtNight === false && isNight);

  useFrame((state) => {
    if (!meshRef.current || !isVisible) return;

    // Fade on approach for decoys
    if (data.fadeOnApproach && data.isDecoy) {
      const targetOpacity = distance < 6 ? Math.max(0, (distance - 2) / 4) : 1;
      opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, 0.1);
    }

    // Glitchy effect for decoys
    if (data.glitchy && data.isDecoy) {
      const glitch = Math.sin(state.clock.elapsedTime * 20) > 0.8;
      meshRef.current.visible = !glitch;
    }

    // Flickering effect
    if (data.flickering) {
      const flicker = Math.sin(state.clock.elapsedTime * 15) > 0.3;
      meshRef.current.visible = flicker;
    }
  });

  // Early return AFTER all hooks
  if (!isVisible) return null;

  const baseColor = data.isDecoy ? '#FF6B6B' : '#66FF66';
  const glowColor = data.isDecoy ? '#AA4444' : '#44AA44';

  const renderIndicator = () => {
    switch (data.type) {
      case 'arrow':
        return (
          <group>
            {/* Arrow body */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.4, 1.2, 4]} />
              <meshStandardMaterial
                color={baseColor}
                emissive={isNight ? glowColor : '#000000'}
                emissiveIntensity={isNight ? 0.8 : 0}
                transparent
                opacity={data.fadeOnApproach ? opacityRef.current : 1}
              />
            </mesh>
            <mesh position={[0, -0.8, 0]}>
              <boxGeometry args={[0.2, 1, 0.2]} />
              <meshStandardMaterial
                color={baseColor}
                emissive={isNight ? glowColor : '#000000'}
                emissiveIntensity={isNight ? 0.6 : 0}
                transparent
                opacity={data.fadeOnApproach ? opacityRef.current : 1}
              />
            </mesh>
          </group>
        );

      case 'poster':
        return (
          <group>
            <mesh>
              <boxGeometry args={[1.5, 2, 0.1]} />
              <meshStandardMaterial
                color="#222222"
                emissive={isNight ? '#111111' : '#000000'}
                emissiveIntensity={0.2}
              />
            </mesh>
            <Text
              position={[0, 0, 0.06]}
              fontSize={0.25}
              color={baseColor}
              anchorX="center"
              anchorY="middle"
              maxWidth={1.3}
            >
              {data.content}
            </Text>
            {isNight && (
              <pointLight intensity={0.5} distance={3} color={baseColor} />
            )}
          </group>
        );

      case 'banner':
        return (
          <group>
            {/* Banner pole */}
            <mesh position={[0, -2, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 4, 8]} />
              <meshStandardMaterial color="#666666" />
            </mesh>
            {/* Banner fabric */}
            <mesh position={[0.6, 0, 0]}>
              <boxGeometry args={[1.2, 1.5, 0.05]} />
              <meshStandardMaterial
                color={data.isDecoy ? '#442222' : '#224422'}
                emissive={isNight ? glowColor : '#000000'}
                emissiveIntensity={isNight ? 0.4 : 0}
              />
            </mesh>
            <Text
              position={[0.6, 0, 0.03]}
              fontSize={0.18}
              color={baseColor}
              anchorX="center"
              anchorY="middle"
              maxWidth={1}
            >
              {data.content}
            </Text>
          </group>
        );

      case 'billboard':
        return (
          <group>
            {/* Billboard frame */}
            <mesh>
              <boxGeometry args={[3, 2, 0.2]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
            {/* Billboard screen */}
            <mesh position={[0, 0, 0.11]}>
              <boxGeometry args={[2.8, 1.8, 0.02]} />
              <meshStandardMaterial
                color={data.isDecoy ? '#1A0A0A' : '#0A1A0A'}
                emissive={isNight ? glowColor : baseColor}
                emissiveIntensity={isNight ? 0.6 : 0.2}
              />
            </mesh>
            <Text
              position={[0, 0, 0.15]}
              fontSize={0.35}
              color={baseColor}
              anchorX="center"
              anchorY="middle"
            >
              {data.content}
            </Text>
            {/* Support poles */}
            <mesh position={[-1, -3, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 5, 8]} />
              <meshStandardMaterial color="#555555" />
            </mesh>
            <mesh position={[1, -3, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 5, 8]} />
              <meshStandardMaterial color="#555555" />
            </mesh>
          </group>
        );

      case 'graffiti':
        return (
          <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[2, 2]} />
              <meshBasicMaterial
                color={baseColor}
                transparent
                opacity={isNight ? 0.8 : 0.3}
              />
            </mesh>
            <Text
              position={[0, 0.01, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.4}
              color={isNight ? '#FFFFFF' : '#888888'}
              anchorX="center"
              anchorY="middle"
            >
              {data.content}
            </Text>
          </group>
        );

      case 'glow':
        return (
          <group>
            <mesh>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshBasicMaterial
                color={baseColor}
                transparent
                opacity={0.6}
              />
            </mesh>
            <pointLight
              intensity={isNight ? 1.5 : 0.5}
              distance={5}
              color={baseColor}
            />
          </group>
        );

      default:
        return null;
    }
  };

  return (
    <group
      ref={meshRef}
      position={data.position}
      rotation={[0, data.rotation, 0]}
    >
      {renderIndicator()}
    </group>
  );
}
