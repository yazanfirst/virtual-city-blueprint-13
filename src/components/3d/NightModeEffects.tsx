import React from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { IndicatorData } from '@/lib/mission/indicatorGenerator';
import { Position3D } from '@/hooks/use3DShops';

interface NightModeEffectsProps {
  indicators: IndicatorData[];
  targetShopPosition: Position3D | null;
  isNight: boolean;
}

// UV Graffiti - only visible at night
function UVGraffiti({
  position,
  content,
  visible,
  isDecoy,
}: {
  position: [number, number, number];
  content: string;
  visible: boolean;
  isDecoy: boolean;
}) {
  if (!visible) return null;

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 1.5]} />
        <meshBasicMaterial
          color={isDecoy ? '#8800FF' : '#00FF88'}
          transparent
          opacity={isDecoy ? 0.3 : 0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Text
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.35}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
      >
        {content}
      </Text>
      <pointLight
        position={[0, 0.5, 0]}
        intensity={0.8}
        distance={4}
        color={isDecoy ? '#8800FF' : '#00FF88'}
      />
    </group>
  );
}

// Glow trail leading to target
function GlowTrail({
  startPosition,
  intensity,
  isDecoy,
}: {
  startPosition: [number, number, number];
  intensity: number;
  isDecoy: boolean;
}) {
  if (intensity < 0.2) return null;

  const color = isDecoy ? '#FF4444' : '#44FF44';

  return (
    <group position={startPosition}>
      {/* Glowing orbs trail */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 0.8, 0.3, 0]}>
          <sphereGeometry args={[0.15 - i * 0.03, 12, 12]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={intensity * (1 - i * 0.25)}
          />
        </mesh>
      ))}
      <pointLight intensity={intensity} distance={6} color={color} />
    </group>
  );
}

// Flickering shop sign effect for target shop at night
function FlickeringSignEffect({
  targetPosition,
}: {
  targetPosition: Position3D;
}) {
  return (
    <group position={[targetPosition.x, 6, targetPosition.z]}>
      <pointLight
        intensity={1.5}
        distance={10}
        color="#FFFF00"
      />
    </group>
  );
}

export default function NightModeEffects({
  indicators,
  targetShopPosition,
  isNight,
}: NightModeEffectsProps) {
  if (!isNight) return null;

  const graffitiIndicators = indicators.filter(
    (i) => i.visibleAtNight && i.type === 'graffiti'
  );

  const glowIndicators = indicators.filter((i) => i.type === 'glow');

  return (
    <group>
      {/* UV Paint / Graffiti - only visible at night */}
      {graffitiIndicators.map((indicator) => (
        <UVGraffiti
          key={indicator.id}
          position={indicator.position}
          content={indicator.content}
          visible={isNight}
          isDecoy={indicator.isDecoy}
        />
      ))}

      {/* Glow trails - brighter at night */}
      {glowIndicators.map((indicator) => (
        <GlowTrail
          key={indicator.id}
          startPosition={indicator.position}
          intensity={isNight ? 1.0 : 0.1}
          isDecoy={indicator.isDecoy}
        />
      ))}

      {/* Flickering shop signs - only at night */}
      {targetShopPosition && (
        <FlickeringSignEffect targetPosition={targetShopPosition} />
      )}
    </group>
  );
}
