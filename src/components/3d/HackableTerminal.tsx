import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HackableTerminalProps {
  id: string;
  position: [number, number, number];
  rotation: number;
  isHacked: boolean;
  onInteract: () => void;
}

export default function HackableTerminal({
  position,
  rotation,
  isHacked,
  onInteract,
}: HackableTerminalProps) {
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!glowRef.current) return;
    const pulse = (Math.sin(clock.getElapsedTime() * 3) + 1) / 2;
    glowRef.current.material.opacity = isHacked ? 0.2 : 0.4 + pulse * 0.4;
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh>
        <boxGeometry args={[1.2, 1, 0.4]} />
        <meshStandardMaterial color={isHacked ? '#2f3542' : '#1b1f27'} />
      </mesh>
      <mesh position={[0, 0.2, 0.25]}>
        <planeGeometry args={[0.9, 0.5]} />
        <meshStandardMaterial color={isHacked ? '#4b5563' : '#22c55e'} emissive="#22c55e" emissiveIntensity={0.6} />
      </mesh>
      <mesh
        ref={glowRef}
        position={[0, -0.1, 0.26]}
        onPointerDown={(event) => {
          event.stopPropagation();
          if (!isHacked) {
            onInteract();
          }
        }}
      >
        <circleGeometry args={[0.25, 24]} />
        <meshStandardMaterial color={isHacked ? '#6b7280' : '#38bdf8'} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}
