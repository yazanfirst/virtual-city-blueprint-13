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
const PROMPT_DISTANCE = 5;
const BOUNDS = 70;
const SACRIFICE_HOLD = 3;
const MOVEMENT_THRESHOLD = 0.02;
const PULSE_CYCLE = 4; // seconds visible, then 2s hidden
const PULSE_HIDDEN = 2;

const clampPosition = (value: number) => THREE.MathUtils.clamp(value, -BOUNDS, BOUNDS);

// Unique colors per anchor type
const ANCHOR_COLORS: Record<string, { main: string; glow: string; emissive: string }> = {
  pulse: { main: '#FFD700', glow: '#FFA500', emissive: '#FFD700' },       // Gold - pulses on/off
  chase: { main: '#FF4444', glow: '#FF0000', emissive: '#FF2222' },       // Red - runs away
  guardian: { main: '#8B5CF6', glow: '#7C3AED', emissive: '#8B5CF6' },    // Purple - orbiting shields
  riddle: { main: '#00FFAA', glow: '#00CC88', emissive: '#00FFAA' },      // Green - press key
  sacrifice: { main: '#FF69B4', glow: '#FF1493', emissive: '#FF69B4' },   // Pink - stand still
};

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
  const stationaryTimeRef = useRef(0);
  const [riddleActiveAt, setRiddleActiveAt] = useState<number | null>(null);
  const lastPlayerPos = useRef<[number, number, number] | null>(null);
  const pulseVisibleRef = useRef(true);
  const playerPosition = usePlayerStore((state) => state.position);
  const {
    collectAnchor,
    updateAnchorPosition,
    updateAnchorState,
    setPrompt,
    clearPrompt,
    chaseAnchorSpeed,
  } = useMirrorWorldStore();

  const colors = ANCHOR_COLORS[type] || ANCHOR_COLORS.pulse;

  const promptMessage = useMemo(() => {
    if (type === 'pulse') return 'Pulse Anchor: grab it while it glows!';
    if (type === 'chase') return 'Chase Anchor: corner and catch it!';
    if (type === 'guardian') return 'Guardian Anchor: wait for the gap!';
    if (type === 'sacrifice') return 'Sacrifice Anchor: stand still 3s to disable shield.';
    if (type === 'riddle') return `Riddle Anchor: press [${requiredKey || '?'}] to collect!`;
    return null;
  }, [type, requiredKey]);

  useEffect(() => {
    return () => clearPrompt(id);
  }, [clearPrompt, id]);

  // Riddle timeout — 3 seconds to press the key
  useEffect(() => {
    if (!riddleActiveAt) return;
    const timeout = setTimeout(() => {
      setRiddleActiveAt(null);
      clearPrompt(id);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [riddleActiveAt, clearPrompt, id]);

  // Riddle keypress handler
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

    const dx = playerPosition[0] - position[0];
    const dy = playerPosition[1] - position[1];
    const dz = playerPosition[2] - position[2];
    const distanceXZ = Math.sqrt(dx * dx + dz * dz);
    const sameLevel = Math.abs(dy) < 3.5;
    const inPromptRange = distanceXZ < PROMPT_DISTANCE && sameLevel;
    const inCollectRange = distanceXZ < COLLECT_DISTANCE && sameLevel;

    // --- TYPE-SPECIFIC BEHAVIOR ---

    // PULSE: blinks on/off. Only collectible when visible (glowing)
    if (type === 'pulse') {
      const cycle = PULSE_CYCLE + PULSE_HIDDEN;
      const phase = (time + floatPhase) % cycle;
      pulseVisibleRef.current = phase < PULSE_CYCLE;
      const opacity = pulseVisibleRef.current ? 1 : 0.15;
      meshRef.current.rotation.y += 0.03;
      meshRef.current.position.y = position[1] + Math.sin(time * 3 + floatPhase) * 0.3;
      (meshRef.current.material as THREE.MeshStandardMaterial).opacity = opacity;
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulseVisibleRef.current ? 1.5 : 0.1;

      if (inPromptRange && promptMessage) {
        setPrompt(id, pulseVisibleRef.current ? 'Pulse Anchor: NOW! Grab it!' : 'Pulse Anchor: wait for the glow...', null);
      } else if (!inPromptRange) {
        clearPrompt(id);
      }

      if (inCollectRange && pulseVisibleRef.current) {
        collectAnchor(id);
      }
      return;
    }

    // CHASE: runs away from player, must corner it
    if (type === 'chase') {
      meshRef.current.rotation.y += 0.05;
      meshRef.current.position.y = position[1] + Math.sin(time * 4 + floatPhase) * 0.1;

      const moveX = position[0] - playerPosition[0];
      const moveZ = position[2] - playerPosition[2];
      const length = Math.sqrt(moveX * moveX + moveZ * moveZ) || 1;
      const nextPosition: [number, number, number] = [
        clampPosition(position[0] + (moveX / length) * chaseAnchorSpeed * delta * 60),
        position[1],
        clampPosition(position[2] + (moveZ / length) * chaseAnchorSpeed * delta * 60),
      ];
      updateAnchorPosition(id, nextPosition);

      if (inPromptRange && promptMessage) {
        setPrompt(id, promptMessage, null);
      } else if (!inPromptRange) {
        clearPrompt(id);
      }

      if (inCollectRange) {
        collectAnchor(id);
      }
      return;
    }

    // GUARDIAN: orbiting blockers, must time your approach through the gap
    if (type === 'guardian') {
      meshRef.current.rotation.y += 0.02;
      meshRef.current.position.y = position[1] + Math.sin(time * 2 + floatPhase) * 0.15;

      if (orbitRef.current) {
        orbitRef.current.rotation.y += delta * 1.2;
      }

      // Check if player is blocked by a guardian sphere
      let blocked = false;
      if (inCollectRange && orbitRef.current) {
        const orbitAngle = orbitRef.current.rotation.y;
        for (let i = 0; i < 3; i++) {
          const sphereAngle = orbitAngle + i * (Math.PI * 2 / 3);
          const sphereX = position[0] + Math.cos(sphereAngle) * 1.8;
          const sphereZ = position[2] + Math.sin(sphereAngle) * 1.8;
          const dsx = playerPosition[0] - sphereX;
          const dsz = playerPosition[2] - sphereZ;
          const sphereDist = Math.sqrt(dsx * dsx + dsz * dsz);
          if (sphereDist < 1.2) {
            blocked = true;
            break;
          }
        }
      }

      if (inPromptRange && promptMessage) {
        setPrompt(id, blocked ? 'Guardian Anchor: blocked! Wait for the gap!' : promptMessage, null);
      } else if (!inPromptRange) {
        clearPrompt(id);
      }

      if (inCollectRange && !blocked) {
        collectAnchor(id);
      }
      return;
    }

    // SACRIFICE: stand still near it for 3 seconds to disable shield, then collect
    if (type === 'sacrifice') {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.position.y = position[1] + Math.sin(time * 1.5 + floatPhase) * 0.1;

      if (shieldActive) {
        if (!lastPlayerPos.current) {
          lastPlayerPos.current = [...playerPosition];
        }
        const movementX = Math.abs(playerPosition[0] - lastPlayerPos.current[0]);
        const movementZ = Math.abs(playerPosition[2] - lastPlayerPos.current[2]);
        lastPlayerPos.current = [...playerPosition];

        if (distanceXZ < PROMPT_DISTANCE && sameLevel && movementX < MOVEMENT_THRESHOLD && movementZ < MOVEMENT_THRESHOLD) {
          stationaryTimeRef.current = Math.min(SACRIFICE_HOLD, stationaryTimeRef.current + delta);
        } else {
          stationaryTimeRef.current = 0;
        }

        const progress = Math.round((stationaryTimeRef.current / SACRIFICE_HOLD) * 100);
        if (inPromptRange) {
          setPrompt(id, progress > 0 ? `Shield breaking... ${progress}%` : promptMessage!, null);
        } else {
          clearPrompt(id);
        }

        if (stationaryTimeRef.current >= SACRIFICE_HOLD) {
          updateAnchorState(id, { shieldActive: false });
          stationaryTimeRef.current = 0;
        }
      } else {
        // Shield is down — can collect
        if (inPromptRange) {
          setPrompt(id, 'Shield down! Grab the anchor!', null);
        } else if (!inPromptRange) {
          clearPrompt(id);
        }
        if (inCollectRange) {
          collectAnchor(id);
        }
      }
      return;
    }

    // RIDDLE: press the correct key within time limit
    if (type === 'riddle') {
      meshRef.current.rotation.y += 0.015;
      meshRef.current.position.y = position[1] + Math.sin(time * 2.5 + floatPhase) * 0.2;

      if (inPromptRange && !riddleActiveAt) {
        setRiddleActiveAt(Date.now());
        setPrompt(id, `Press [${requiredKey || '?'}] now!`, requiredKey ?? null);
      } else if (inPromptRange && riddleActiveAt) {
        const elapsed = (Date.now() - riddleActiveAt) / 1000;
        const remaining = Math.max(0, 3 - elapsed).toFixed(1);
        setPrompt(id, `Press [${requiredKey || '?'}]! ${remaining}s left`, requiredKey ?? null);
      } else if (!inPromptRange) {
        clearPrompt(id);
      }
      // Collection handled by keypress listener above
      return;
    }
  });

  if (isCollected) return null;

  return (
    <group position={position}>
      {/* PULSE: Star shape, gold, blinks */}
      {type === 'pulse' && (
        <>
          <mesh ref={meshRef}>
            <icosahedronGeometry args={[0.5]} />
            <meshStandardMaterial
              color={colors.main}
              emissive={colors.emissive}
              emissiveIntensity={1.5}
              metalness={0.6}
              roughness={0.2}
              transparent
              opacity={1}
            />
          </mesh>
          <pointLight position={[0, 0.5, 0]} intensity={1.5} distance={5} color={colors.glow} />
        </>
      )}

      {/* CHASE: Small fast diamond, red */}
      {type === 'chase' && (
        <>
          <mesh ref={meshRef}>
            <octahedronGeometry args={[0.4]} />
            <meshStandardMaterial
              color={colors.main}
              emissive={colors.emissive}
              emissiveIntensity={1.2}
              metalness={0.3}
              roughness={0.1}
            />
          </mesh>
          {/* Speed trail */}
          <mesh position={[0, 0, 0.6]}>
            <coneGeometry args={[0.15, 0.8, 6]} />
            <meshBasicMaterial color={colors.glow} transparent opacity={0.3} />
          </mesh>
          <pointLight position={[0, 0.5, 0]} intensity={1} distance={4} color={colors.glow} />
        </>
      )}

      {/* GUARDIAN: Central gem with orbiting blockers, purple */}
      {type === 'guardian' && (
        <>
          <mesh ref={meshRef}>
            <dodecahedronGeometry args={[0.5]} />
            <meshStandardMaterial
              color={colors.main}
              emissive={colors.emissive}
              emissiveIntensity={1}
              metalness={0.4}
              roughness={0.2}
            />
          </mesh>
          <group ref={orbitRef}>
            {Array.from({ length: 3 }).map((_, index) => (
              <mesh key={index} position={[Math.cos(index * (Math.PI * 2 / 3)) * 1.8, 0.2, Math.sin(index * (Math.PI * 2 / 3)) * 1.8]}>
                <sphereGeometry args={[0.35, 8, 8]} />
                <meshStandardMaterial color="#FF4444" emissive="#FF0000" emissiveIntensity={0.8} />
              </mesh>
            ))}
          </group>
          <pointLight position={[0, 0.8, 0]} intensity={1.2} distance={6} color={colors.glow} />
        </>
      )}

      {/* RIDDLE: Floating cube with question mark glow, green */}
      {type === 'riddle' && (
        <>
          <mesh ref={meshRef}>
            <boxGeometry args={[0.7, 0.7, 0.7]} />
            <meshStandardMaterial
              color={colors.main}
              emissive={colors.emissive}
              emissiveIntensity={1.3}
              metalness={0.5}
              roughness={0.15}
            />
          </mesh>
          {/* Inner rotating ring */}
          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <torusGeometry args={[0.6, 0.06, 8, 16]} />
            <meshBasicMaterial color={colors.glow} transparent opacity={0.6} />
          </mesh>
          <pointLight position={[0, 0.5, 0]} intensity={1} distance={5} color={colors.glow} />
        </>
      )}

      {/* SACRIFICE: Sphere with shield aura, pink */}
      {type === 'sacrifice' && (
        <>
          <mesh ref={meshRef}>
            <sphereGeometry args={[0.45, 16, 16]} />
            <meshStandardMaterial
              color={colors.main}
              emissive={colors.emissive}
              emissiveIntensity={shieldActive ? 0.5 : 1.5}
              metalness={0.4}
              roughness={0.3}
            />
          </mesh>
          {shieldActive && (
            <mesh>
              <sphereGeometry args={[1.3, 16, 16]} />
              <meshBasicMaterial color={colors.glow} transparent opacity={0.2} wireframe />
            </mesh>
          )}
          <pointLight position={[0, 0.5, 0]} intensity={shieldActive ? 0.5 : 1.5} distance={5} color={colors.glow} />
        </>
      )}

      {/* Beam of light above anchor */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.08, 0.15, 3, 8]} />
        <meshBasicMaterial color={colors.glow} transparent opacity={0.25} />
      </mesh>
    </group>
  );
}
