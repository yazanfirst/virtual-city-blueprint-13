import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMirrorWorldStore } from '@/stores/mirrorWorldStore';
import { usePlayerStore } from '@/stores/playerStore';

interface RealityAnchorProps {
  id: string;
  position: [number, number, number];
  isCollected: boolean;
  type: 'pulse' | 'chase' | 'guardian' | 'riddle' | 'sacrifice';
  isVisible?: boolean;
  requiredKey?: string;
  shieldActive?: boolean;
}

const COLLECT_DISTANCE = 4.5;
const PROMPT_DISTANCE = 3.2;
const BOUNDS = 70;
const SACRIFICE_HOLD = 3;
const MOVEMENT_THRESHOLD = 0.02;

const clampPosition = (value: number) => THREE.MathUtils.clamp(value, -BOUNDS, BOUNDS);

export default function RealityAnchor({
  id,
  position,
  isCollected,
  type,
  isVisible = true,
  requiredKey,
  shieldActive = false,
}: RealityAnchorProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(null);
  const [floatPhase] = useState(() => Math.random() * Math.PI * 2);
  const [visible] = useState(isVisible);
  const stationaryTimeRef = useRef(0);
  const [riddleActiveAt, setRiddleActiveAt] = useState<number | null>(null);
  const lastPlayerPos = useRef<[number, number, number] | null>(null);
  const playerPosition = usePlayerStore((state) => state.position);
  const {
    collectAnchor,
    updateAnchorPosition,
    updateAnchorState,
    setPrompt,
    clearPrompt,
    chaseAnchorSpeed,
  } = useMirrorWorldStore();

  const promptMessage = useMemo(() => {
    if (type === 'pulse') return 'Pulse Anchor: time your touch.';
    if (type === 'chase') return 'Chase Anchor: catch it.';
    if (type === 'guardian') return 'Guardian Anchor: enter through the gap.';
    if (type === 'sacrifice') return 'Sacrifice Anchor: stand still to disable.';
    if (type === 'riddle') return 'Riddle Anchor: press the correct key.';
    return null;
  }, [type]);

  useEffect(() => {
    return () => clearPrompt(id);
  }, [clearPrompt, id]);

  useEffect(() => {
    if (!riddleActiveAt) return;
    const timeout = setTimeout(() => {
      setRiddleActiveAt(null);
      clearPrompt(id);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [riddleActiveAt, clearPrompt, id]);

  useEffect(() => {
    if (type !== 'riddle' || !riddleActiveAt || !requiredKey) return;
    const handleKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const expected = requiredKey.toLowerCase();
      if ((expected === 'space' && event.code === 'Space') || key === expected) {
        collectAnchor(id);
        setRiddleActiveAt(null);
        clearPrompt(id);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [type, riddleActiveAt, requiredKey, collectAnchor, clearPrompt, id]);

  useFrame((state, delta) => {
    if (!meshRef.current || isCollected) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.y += 0.02;
    meshRef.current.position.y = position[1] + Math.sin(time * 2 + floatPhase) * 0.2;

    const dx = playerPosition[0] - position[0];
    const dz = playerPosition[2] - position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);
    const inPromptRange = distance < PROMPT_DISTANCE;

    if (inPromptRange && promptMessage) {
      setPrompt(id, promptMessage, type === 'riddle' ? requiredKey ?? null : null);
    } else if (!inPromptRange) {
      clearPrompt(id);
    }

    if (type === 'pulse' && !visible) {
      updateAnchorState(id, { isVisible: true });
    }

    if (type === 'chase') {
      const moveX = position[0] - playerPosition[0];
      const moveZ = position[2] - playerPosition[2];
      const length = Math.sqrt(moveX * moveX + moveZ * moveZ) || 1;
      const nextPosition: [number, number, number] = [
        clampPosition(position[0] + (moveX / length) * chaseAnchorSpeed * delta * 60),
        position[1],
        clampPosition(position[2] + (moveZ / length) * chaseAnchorSpeed * delta * 60),
      ];
      updateAnchorPosition(id, nextPosition);
    }

    if (type === 'guardian' && orbitRef.current) {
      orbitRef.current.rotation.y += delta * 0.8;
    }

    if (type === 'sacrifice' && shieldActive) {
      if (!lastPlayerPos.current) {
        lastPlayerPos.current = [...playerPosition];
      }
      const movementX = Math.abs(playerPosition[0] - lastPlayerPos.current[0]);
      const movementZ = Math.abs(playerPosition[2] - lastPlayerPos.current[2]);
      lastPlayerPos.current = [...playerPosition];

      if (distance < PROMPT_DISTANCE && movementX < MOVEMENT_THRESHOLD && movementZ < MOVEMENT_THRESHOLD) {
        stationaryTimeRef.current = Math.min(SACRIFICE_HOLD, stationaryTimeRef.current + delta);
      } else {
        stationaryTimeRef.current = 0;
      }

      if (stationaryTimeRef.current >= SACRIFICE_HOLD) {
        updateAnchorState(id, { shieldActive: false });
        stationaryTimeRef.current = 0;
      }
    }

    if (type === 'riddle') {
      if (distance < PROMPT_DISTANCE && !riddleActiveAt) {
        setRiddleActiveAt(Date.now());
        setPrompt(id, 'Press the key before time runs out.', requiredKey ?? null);
      }
    }

    if (distance < COLLECT_DISTANCE) {
      collectAnchor(id);
    }
  });

  if (isCollected) return null;

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.6]} />
        <meshStandardMaterial
          color="#D6F4FF"
          emissive="#7FE7FF"
          emissiveIntensity={1.2}
          metalness={0.4}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.12, 0.22, 2.6, 12]} />
        <meshBasicMaterial color="#8BDBFF" transparent opacity={0.35} />
      </mesh>
      <pointLight position={[0, 0.8, 0]} intensity={1.2} distance={6} color="#7FE7FF" />
      {type === 'guardian' && (
        <group ref={orbitRef}>
          {Array.from({ length: 4 }).map((_, index) => (
            <mesh key={index} position={[Math.cos(index * (Math.PI / 2)) * 1.2, 0.2, Math.sin(index * (Math.PI / 2)) * 1.2]}>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={0.8} />
            </mesh>
          ))}
        </group>
      )}
      {type === 'sacrifice' && shieldActive && (
        <mesh>
          <sphereGeometry args={[1.1, 16, 16]} />
          <meshBasicMaterial color="#7C3AED" transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
}
