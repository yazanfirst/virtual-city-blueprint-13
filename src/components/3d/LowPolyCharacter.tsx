import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type LowPolyCharacterProps = {
  position?: [number, number, number];
  rotation?: number;
  clothingColor?: string;
  isNight: boolean;
  isWalking?: boolean;
};

const LowPolyCharacter = ({
  position = [0, 0, 0],
  rotation = 0,
  clothingColor = '#4a5568',
  isNight = false,
  isWalking = false,
}: LowPolyCharacterProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const leftEyeMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const rightEyeMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const accentMatRefs = useRef<THREE.MeshStandardMaterial[]>([]);

  const storeAccentRef = (mat: THREE.MeshStandardMaterial | null, idx: number) => {
    if (mat) accentMatRefs.current[idx] = mat;
  };

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (groupRef.current) {
      if (isWalking) {
        groupRef.current.position.y = position[1] + Math.abs(Math.sin(time * 8)) * 0.06;
      } else {
        groupRef.current.position.y = position[1] + Math.sin(time * 2) * 0.02;
      }
    }

    const swingSpeed = isWalking ? 8 : 1.5;
    const swingAmount = isWalking ? 0.6 : 0.08;

    if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(time * swingSpeed) * swingAmount;
    if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(time * swingSpeed + Math.PI) * swingAmount;
    if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(time * swingSpeed + Math.PI) * (isWalking ? 0.5 : 0);
    if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(time * swingSpeed) * (isWalking ? 0.5 : 0);

    const eyePulse = 3.0 + Math.sin(time * 3) * 1.5;
    if (leftEyeMatRef.current) leftEyeMatRef.current.emissiveIntensity = eyePulse;
    if (rightEyeMatRef.current) rightEyeMatRef.current.emissiveIntensity = eyePulse;

    const accentPulse = 2.0 + Math.sin(time * 2) * 0.8;
    accentMatRefs.current.forEach((mat) => {
      if (mat) mat.emissiveIntensity = accentPulse;
    });
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]} castShadow>

      {/* ===== HOOD (Scaled Sphere) ===== */}
      <mesh position={[0, 1.55, -0.02]} scale={[1, 1.2, 0.85]} castShadow>
        <sphereGeometry args={[0.28, 14, 12]} />
        <meshStandardMaterial color="#1a1a24" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Hood back drape */}
      <mesh position={[0, 1.45, -0.18]} scale={[1, 0.8, 0.5]}>
        <sphereGeometry args={[0.25, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial color="#141420" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Hood collar */}
      <mesh position={[0, 1.38, 0]}>
        <coneGeometry args={[0.15, 0.12, 12, 1, true]} />
        <meshStandardMaterial color="#1a1a24" roughness={0.85} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>

      {/* Hood rim glow — thin ring around face opening for visibility */}
      <mesh position={[0, 1.52, 0.22]} rotation={[0.1, 0, 0]}>
        <torusGeometry args={[0.14, 0.008, 6, 20]} />
        <meshStandardMaterial
          ref={(mat) => storeAccentRef(mat, 6)}
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={1.5}
          roughness={0.1}
          metalness={0.4}
        />
      </mesh>

      {/* ===== FACE VOID — small recessed disc, NOT a large sphere ===== */}
      <mesh position={[0, 1.52, 0.18]}>
        <circleGeometry args={[0.12, 14]} />
        <meshStandardMaterial color="#050508" roughness={1} metalness={0} side={THREE.DoubleSide} />
      </mesh>

      {/* ===== EYES (Octahedron) — pushed forward, larger ===== */}
      <mesh position={[-0.055, 1.54, 0.24]}>
        <octahedronGeometry args={[0.032, 0]} />
        <meshStandardMaterial
          ref={leftEyeMatRef}
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={5.0}
          roughness={0.05}
          metalness={0.3}
        />
      </mesh>
      <mesh position={[0.055, 1.54, 0.24]}>
        <octahedronGeometry args={[0.032, 0]} />
        <meshStandardMaterial
          ref={rightEyeMatRef}
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={5.0}
          roughness={0.05}
          metalness={0.3}
        />
      </mesh>

      {/* Eye glow halos — larger, brighter */}
      <mesh position={[-0.055, 1.54, 0.23]}>
        <sphereGeometry args={[0.055, 8, 6]} />
        <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2.5} transparent opacity={0.2} roughness={0} />
      </mesh>
      <mesh position={[0.055, 1.54, 0.23]}>
        <sphereGeometry args={[0.055, 8, 6]} />
        <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2.5} transparent opacity={0.2} roughness={0} />
      </mesh>

      {/* ===== NECK ===== */}
      <mesh position={[0, 1.32, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 10]} />
        <meshStandardMaterial color="#1a1a24" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* ===== TORSO (Capsule) ===== */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.45, 6, 12]} />
        <meshStandardMaterial color="#1a1a24" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Chest accent (Torus) — larger, brighter */}
      <mesh position={[0, 1.12, 0.16]} scale={[1, 0.3, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.19, 0.012, 6, 20]} />
        <meshStandardMaterial
          ref={(mat) => storeAccentRef(mat, 0)}
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={3.0}
          roughness={0.1}
          metalness={0.4}
        />
      </mesh>

      {/* Pocket accent (Torus arc) */}
      <mesh position={[0, 0.82, 0.19]} scale={[1, 0.3, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.01, 6, 12, Math.PI]} />
        <meshStandardMaterial
          ref={(mat) => storeAccentRef(mat, 1)}
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={2.5}
          roughness={0.1}
          metalness={0.4}
        />
      </mesh>

      {/* ===== LEFT ARM ===== */}
      <group ref={leftArmRef} position={[-0.3, 1.18, 0]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.18, 4, 8]} />
          <meshStandardMaterial color="#1a1a24" roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.32, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.14, 4, 8]} />
          <meshStandardMaterial color="#1a1a24" roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.45, 0]}>
          <icosahedronGeometry args={[0.05, 0]} />
          <meshStandardMaterial color="#0e0e18" roughness={0.7} metalness={0.1} />
        </mesh>
        {/* Sleeve accent rings */}
        <mesh position={[0, -0.1, 0]}>
          <torusGeometry args={[0.078, 0.01, 6, 16]} />
          <meshStandardMaterial
            ref={(mat) => storeAccentRef(mat, 2)}
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={3.0}
            roughness={0.1}
            metalness={0.4}
          />
        </mesh>
        <mesh position={[0, -0.22, 0]}>
          <torusGeometry args={[0.065, 0.01, 6, 16]} />
          <meshStandardMaterial
            ref={(mat) => storeAccentRef(mat, 3)}
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={3.0}
            roughness={0.1}
            metalness={0.4}
          />
        </mesh>
      </group>

      {/* ===== RIGHT ARM ===== */}
      <group ref={rightArmRef} position={[0.3, 1.18, 0]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.18, 4, 8]} />
          <meshStandardMaterial color="#1a1a24" roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.32, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.14, 4, 8]} />
          <meshStandardMaterial color="#1a1a24" roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.45, 0]}>
          <icosahedronGeometry args={[0.05, 0]} />
          <meshStandardMaterial color="#0e0e18" roughness={0.7} metalness={0.1} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <torusGeometry args={[0.078, 0.01, 6, 16]} />
          <meshStandardMaterial
            ref={(mat) => storeAccentRef(mat, 4)}
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={3.0}
            roughness={0.1}
            metalness={0.4}
          />
        </mesh>
        <mesh position={[0, -0.22, 0]}>
          <torusGeometry args={[0.065, 0.01, 6, 16]} />
          <meshStandardMaterial
            ref={(mat) => storeAccentRef(mat, 5)}
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={3.0}
            roughness={0.1}
            metalness={0.4}
          />
        </mesh>
      </group>

      {/* ===== LEFT LEG ===== */}
      <group ref={leftLegRef} position={[-0.1, 0.55, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.18, 4, 8]} />
          <meshStandardMaterial color="#121220" roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.06, 0.14, 4, 8]} />
          <meshStandardMaterial color="#121220" roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.42, 0.02]} scale={[1.2, 1, 1]}>
          <capsuleGeometry args={[0.07, 0.06, 4, 8]} />
          <meshStandardMaterial color="#0c0c14" emissive="#00e5ff" emissiveIntensity={0.4} roughness={0.7} metalness={0.1} />
        </mesh>
      </group>

      {/* ===== RIGHT LEG ===== */}
      <group ref={rightLegRef} position={[0.1, 0.55, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.18, 4, 8]} />
          <meshStandardMaterial color="#121220" roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.06, 0.14, 4, 8]} />
          <meshStandardMaterial color="#121220" roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.42, 0.02]} scale={[1.2, 1, 1]}>
          <capsuleGeometry args={[0.07, 0.06, 4, 8]} />
          <meshStandardMaterial color="#0c0c14" emissive="#00e5ff" emissiveIntensity={0.4} roughness={0.7} metalness={0.1} />
        </mesh>
      </group>
    </group>
  );
};

export default LowPolyCharacter;
