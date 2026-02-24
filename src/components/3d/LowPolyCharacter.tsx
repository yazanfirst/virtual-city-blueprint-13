import { useRef, useMemo } from 'react';
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

  // Refs for animated materials
  const leftEyeMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const rightEyeMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const accentMatRefs = useRef<THREE.MeshStandardMaterial[]>([]);

  // Custom geometries created once via useMemo
  const { hoodGeometry, torsoGeometry, bootGeometry, sleeveAccentCurves, chestAccentCurve, pocketAccentCurve } = useMemo(() => {
    // --- HOOD: LatheGeometry with sculpted profile ---
    const hoodPoints: THREE.Vector2[] = [];
    // Profile from bottom (collar) to top (pointed tip)
    hoodPoints.push(new THREE.Vector2(0.18, 0));      // collar base
    hoodPoints.push(new THREE.Vector2(0.22, 0.05));    // collar flare
    hoodPoints.push(new THREE.Vector2(0.30, 0.12));    // widening
    hoodPoints.push(new THREE.Vector2(0.33, 0.22));    // max width
    hoodPoints.push(new THREE.Vector2(0.32, 0.32));    // shoulder of hood
    hoodPoints.push(new THREE.Vector2(0.28, 0.40));    // tapering
    hoodPoints.push(new THREE.Vector2(0.20, 0.48));    // upper taper
    hoodPoints.push(new THREE.Vector2(0.12, 0.54));    // near tip
    hoodPoints.push(new THREE.Vector2(0.04, 0.58));    // tip approach
    hoodPoints.push(new THREE.Vector2(0.0, 0.60));     // pointed tip
    const hoodGeo = new THREE.LatheGeometry(hoodPoints, 16);

    // --- TORSO: LatheGeometry with hoodie silhouette ---
    const torsoPoints: THREE.Vector2[] = [];
    torsoPoints.push(new THREE.Vector2(0.16, 0));       // bottom hem
    torsoPoints.push(new THREE.Vector2(0.18, 0.05));    // hip flare
    torsoPoints.push(new THREE.Vector2(0.17, 0.15));    // waist taper
    torsoPoints.push(new THREE.Vector2(0.16, 0.22));    // mid torso
    torsoPoints.push(new THREE.Vector2(0.18, 0.30));    // chest
    torsoPoints.push(new THREE.Vector2(0.22, 0.38));    // shoulder width
    torsoPoints.push(new THREE.Vector2(0.23, 0.42));    // shoulder top
    torsoPoints.push(new THREE.Vector2(0.20, 0.48));    // neck approach
    torsoPoints.push(new THREE.Vector2(0.12, 0.50));    // neck
    torsoPoints.push(new THREE.Vector2(0.0, 0.50));     // center top
    const torsoGeo = new THREE.LatheGeometry(torsoPoints, 14);

    // --- BOOTS: LatheGeometry with boot profile ---
    const bootPoints: THREE.Vector2[] = [];
    bootPoints.push(new THREE.Vector2(0.08, 0));        // sole flat
    bootPoints.push(new THREE.Vector2(0.09, 0.01));     // sole edge
    bootPoints.push(new THREE.Vector2(0.08, 0.04));     // lower boot
    bootPoints.push(new THREE.Vector2(0.07, 0.08));     // ankle taper
    bootPoints.push(new THREE.Vector2(0.06, 0.12));     // top of boot
    bootPoints.push(new THREE.Vector2(0.0, 0.12));      // center top
    const bootGeo = new THREE.LatheGeometry(bootPoints, 10);

    // --- SLEEVE ACCENT CURVES: TubeGeometry along curved paths ---
    const createSleeveAccent = (yOffset: number, armSide: number) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(armSide * 0.07, yOffset, -0.06),
        new THREE.Vector3(armSide * 0.08, yOffset + 0.01, 0),
        new THREE.Vector3(armSide * 0.07, yOffset + 0.02, 0.06),
        new THREE.Vector3(armSide * 0.05, yOffset + 0.01, 0.08),
        new THREE.Vector3(armSide * 0.03, yOffset, 0.06),
      ]);
      return new THREE.TubeGeometry(curve, 12, 0.008, 6, false);
    };

    const slvAccents = [
      createSleeveAccent(-0.08, 1),   // right arm upper
      createSleeveAccent(-0.18, 1),   // right arm lower
      createSleeveAccent(-0.08, -1),  // left arm upper (mirrored in placement)
      createSleeveAccent(-0.18, -1),  // left arm lower
    ];

    // --- CHEST ACCENT: TubeGeometry curved across chest ---
    const chestCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.15, 0.32, 0.16),
      new THREE.Vector3(-0.08, 0.34, 0.18),
      new THREE.Vector3(0, 0.35, 0.19),
      new THREE.Vector3(0.08, 0.34, 0.18),
      new THREE.Vector3(0.15, 0.32, 0.16),
    ]);
    const chestGeo = new THREE.TubeGeometry(chestCurve, 14, 0.008, 6, false);

    // --- POCKET ACCENT: TubeGeometry arc on front ---
    const pocketCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.08, 0.15, 0.17),
      new THREE.Vector3(-0.04, 0.13, 0.18),
      new THREE.Vector3(0, 0.12, 0.185),
      new THREE.Vector3(0.04, 0.13, 0.18),
      new THREE.Vector3(0.08, 0.15, 0.17),
    ]);
    const pocketGeo = new THREE.TubeGeometry(pocketCurve, 12, 0.006, 6, false);

    return {
      hoodGeometry: hoodGeo,
      torsoGeometry: torsoGeo,
      bootGeometry: bootGeo,
      sleeveAccentCurves: slvAccents,
      chestAccentCurve: chestGeo,
      pocketAccentCurve: pocketGeo,
    };
  }, []);

  // Materials
  const materials = useMemo(() => ({
    hood: new THREE.MeshStandardMaterial({ color: '#111118', roughness: 0.92, metalness: 0.05 }),
    hoodLining: new THREE.MeshStandardMaterial({ color: '#0a0a10', roughness: 0.9, metalness: 0 }),
    hoodDrape: new THREE.MeshStandardMaterial({ color: '#111118', roughness: 0.92, metalness: 0.05 }),
    faceVoid: new THREE.MeshStandardMaterial({ color: '#030306', roughness: 1, metalness: 0 }),
    faceRim: new THREE.MeshStandardMaterial({ color: '#0a0a10', roughness: 0.9, metalness: 0 }),
    eye: new THREE.MeshStandardMaterial({
      color: '#00e5ff',
      emissive: '#00e5ff',
      emissiveIntensity: 4.0,
      roughness: 0.1,
      metalness: 0.3,
    }),
    eyeGlow: new THREE.MeshStandardMaterial({
      color: '#00e5ff',
      emissive: '#00e5ff',
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.15,
      roughness: 0,
    }),
    torso: new THREE.MeshStandardMaterial({ color: '#111118', roughness: 0.88, metalness: 0.05 }),
    accent: new THREE.MeshStandardMaterial({
      color: '#00e5ff',
      emissive: '#00e5ff',
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.4,
    }),
    pocketAccent: new THREE.MeshStandardMaterial({
      color: '#00e5ff',
      emissive: '#00e5ff',
      emissiveIntensity: 2.0,
      roughness: 0.1,
      metalness: 0.4,
    }),
    arm: new THREE.MeshStandardMaterial({ color: '#111118', roughness: 0.88, metalness: 0.05 }),
    hand: new THREE.MeshStandardMaterial({ color: '#0a0a14', roughness: 0.7, metalness: 0.1 }),
    pants: new THREE.MeshStandardMaterial({ color: '#0c0c16', roughness: 0.85, metalness: 0.05 }),
    boot: new THREE.MeshStandardMaterial({
      color: '#08080e',
      emissive: '#00e5ff',
      emissiveIntensity: 0.2,
      roughness: 0.7,
      metalness: 0.1,
    }),
  }), []);

  // Store accent material refs for pulsing
  const storeAccentRef = (mat: THREE.MeshStandardMaterial | null, idx: number) => {
    if (mat) accentMatRefs.current[idx] = mat;
  };

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // --- Existing animation logic preserved exactly ---
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

    // --- NEW: Pulsing glow on eyes ---
    const eyePulse = 3.0 + Math.sin(time * 3) * 1.0;
    if (leftEyeMatRef.current) leftEyeMatRef.current.emissiveIntensity = eyePulse;
    if (rightEyeMatRef.current) rightEyeMatRef.current.emissiveIntensity = eyePulse;

    // --- NEW: Pulsing glow on accent lines ---
    const accentPulse = 2.0 + Math.sin(time * 2) * 0.5;
    accentMatRefs.current.forEach((mat) => {
      if (mat) mat.emissiveIntensity = accentPulse;
    });
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]} castShadow>

      {/* ===== HOOD (LatheGeometry) ===== */}
      <mesh position={[0, 1.35, -0.02]} geometry={hoodGeometry} material={materials.hood} castShadow />

      {/* Hood inner lining */}
      <mesh position={[0, 1.35, 0.05]} material={materials.hoodLining}>
        <cylinderGeometry args={[0.18, 0.22, 0.35, 12, 1, true]} />
      </mesh>

      {/* Hood back drape */}
      <mesh position={[0, 1.25, -0.15]} material={materials.hoodDrape} scale={[1, 0.7, 0.5]}>
        <sphereGeometry args={[0.25, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
      </mesh>

      {/* ===== FACE VOID ===== */}
      {/* Deep recessed sphere for shadow tunnel */}
      <mesh position={[0, 1.55, 0.12]} material={materials.faceVoid}>
        <sphereGeometry args={[0.16, 10, 8]} />
      </mesh>
      {/* Ring rim around face opening */}
      <mesh position={[0, 1.55, 0.18]} material={materials.faceRim} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.12, 0.16, 14]} />
      </mesh>

      {/* ===== EYES (Octahedron - angular, menacing) ===== */}
      <mesh position={[-0.06, 1.56, 0.2]}>
        <octahedronGeometry args={[0.025, 0]} />
        <meshStandardMaterial
          ref={leftEyeMatRef}
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={4.0}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>
      <mesh position={[0.06, 1.56, 0.2]}>
        <octahedronGeometry args={[0.025, 0]} />
        <meshStandardMaterial
          ref={rightEyeMatRef}
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={4.0}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>

      {/* Eye glow halos */}
      <mesh position={[-0.06, 1.56, 0.19]} material={materials.eyeGlow}>
        <sphereGeometry args={[0.045, 8, 6]} />
      </mesh>
      <mesh position={[0.06, 1.56, 0.19]} material={materials.eyeGlow}>
        <sphereGeometry args={[0.045, 8, 6]} />
      </mesh>

      {/* ===== TORSO (LatheGeometry) ===== */}
      <mesh position={[0, 0.8, 0]} geometry={torsoGeometry} material={materials.torso} castShadow />

      {/* Chest accent line (TubeGeometry) */}
      <mesh geometry={chestAccentCurve}>
        <meshStandardMaterial
          ref={(mat) => storeAccentRef(mat, 0)}
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={2.5}
          roughness={0.1}
          metalness={0.4}
        />
      </mesh>

      {/* Pocket accent (TubeGeometry) */}
      <mesh geometry={pocketAccentCurve}>
        <meshStandardMaterial
          ref={(mat) => storeAccentRef(mat, 1)}
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={2.0}
          roughness={0.1}
          metalness={0.4}
        />
      </mesh>

      {/* ===== LEFT ARM ===== */}
      <group ref={leftArmRef} position={[-0.3, 1.2, 0]}>
        {/* Upper arm */}
        <mesh position={[0, -0.12, 0]} material={materials.arm} castShadow>
          <capsuleGeometry args={[0.075, 0.2, 4, 8]} />
        </mesh>
        {/* Lower arm (slightly thinner) */}
        <mesh position={[0, -0.35, 0]} material={materials.arm} castShadow>
          <capsuleGeometry args={[0.06, 0.15, 4, 8]} />
        </mesh>
        {/* Hand - Icosahedron (faceted glove fist) */}
        <mesh position={[0, -0.48, 0]} material={materials.hand}>
          <icosahedronGeometry args={[0.055, 0]} />
        </mesh>
        {/* Sleeve accent tubes */}
        <mesh geometry={sleeveAccentCurves[2]}>
          <meshStandardMaterial
            ref={(mat) => storeAccentRef(mat, 2)}
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={2.5}
            roughness={0.1}
            metalness={0.4}
          />
        </mesh>
        <mesh geometry={sleeveAccentCurves[3]}>
          <meshStandardMaterial
            ref={(mat) => storeAccentRef(mat, 3)}
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={2.5}
            roughness={0.1}
            metalness={0.4}
          />
        </mesh>
      </group>

      {/* ===== RIGHT ARM ===== */}
      <group ref={rightArmRef} position={[0.3, 1.2, 0]}>
        <mesh position={[0, -0.12, 0]} material={materials.arm} castShadow>
          <capsuleGeometry args={[0.075, 0.2, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.35, 0]} material={materials.arm} castShadow>
          <capsuleGeometry args={[0.06, 0.15, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.48, 0]} material={materials.hand}>
          <icosahedronGeometry args={[0.055, 0]} />
        </mesh>
        {/* Sleeve accent tubes */}
        <mesh geometry={sleeveAccentCurves[0]}>
          <meshStandardMaterial
            ref={(mat) => storeAccentRef(mat, 4)}
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={2.5}
            roughness={0.1}
            metalness={0.4}
          />
        </mesh>
        <mesh geometry={sleeveAccentCurves[1]}>
          <meshStandardMaterial
            ref={(mat) => storeAccentRef(mat, 5)}
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={2.5}
            roughness={0.1}
            metalness={0.4}
          />
        </mesh>
      </group>

      {/* ===== LEFT LEG ===== */}
      <group ref={leftLegRef} position={[-0.1, 0.55, 0]}>
        <mesh position={[0, -0.05, 0]} material={materials.pants} castShadow>
          <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.3, 0]} material={materials.pants} castShadow>
          <capsuleGeometry args={[0.065, 0.15, 4, 8]} />
        </mesh>
        {/* Boot (LatheGeometry) */}
        <mesh position={[0, -0.45, 0.02]} geometry={bootGeometry} material={materials.boot} castShadow />
      </group>

      {/* ===== RIGHT LEG ===== */}
      <group ref={rightLegRef} position={[0.1, 0.55, 0]}>
        <mesh position={[0, -0.05, 0]} material={materials.pants} castShadow>
          <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.3, 0]} material={materials.pants} castShadow>
          <capsuleGeometry args={[0.065, 0.15, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.45, 0.02]} geometry={bootGeometry} material={materials.boot} castShadow />
      </group>
    </group>
  );
};

export default LowPolyCharacter;
