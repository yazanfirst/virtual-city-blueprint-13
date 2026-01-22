"use client";

import React, { Suspense, useMemo, useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import PlayerController from "./PlayerController";
import MobileControls from "./MobileControls";
import BrandedShop from "./BrandedShop";
import CollectibleItem from "./CollectibleItem";
import ZombieCharacter from "./ZombieCharacter";
import FirePitTrap from "./FirePitTrap";
import SwingingAxeTrap from "./SwingingAxeTrap";
import ThornsTrap from "./ThornsTrap";
import GhostCharacter from "./GhostCharacter";
import { useDeviceType } from "@/hooks/useDeviceType";
import { usePlayerStore } from "@/stores/playerStore";
import { useGameStore } from "@/stores/gameStore";
import { useMissionStore } from "@/stores/missionStore";
import { useGhostHuntStore } from "@/stores/ghostHuntStore";
import { useMirrorWorldStore } from "@/stores/mirrorWorldStore";
import { ShopBranding } from "@/hooks/use3DShops";
import MirrorShadow from "./MirrorShadow";
import RealityAnchor from "./RealityAnchor";
import MirrorWorldEnvironment from "./MirrorWorldEnvironment";

export type CameraView = "thirdPerson" | "firstPerson";

type CitySceneProps = {
  streetId: string;
  timeOfDay?: "day" | "night";
  cameraView?: CameraView;
  shopBrandings?: ShopBranding[];
  onShopClick?: (branding: ShopBranding) => void;
  forcedTimeOfDay?: "day" | "night" | null; // For mission control
  onZombieTouchPlayer?: () => void;
  onTrapHitPlayer?: () => void;
  hideMobileControls?: boolean;
};

type InnerProps = {
  timeOfDay: "day" | "night";
  cameraView: CameraView;
  joystickInput: { x: number; y: number };
  cameraRotation: { azimuth: number; polar: number };
  shopBrandings: ShopBranding[];
  onShopClick?: (branding: ShopBranding) => void;
  onZombieTouchPlayer?: () => void;
  onTrapHitPlayer?: () => void;
  mirrorWorldActive: boolean;
};

// Pastel color palette
const COLORS = {
  yellow: "#E8C547",
  blue: "#5B9BD5",
  teal: "#5BBAA5",
  orange: "#D97B4A",
  pink: "#D98BB5",
  green: "#6B9B6B",
  beige: "#E8DCC8",
  cream: "#F5EEE0",
  brown: "#8B6B4A",
  rust: "#8B5A3A",
  purple: "#9B7BB5",
  grass: "#5BA55B",
  road: "#4A5568",
  sidewalk: "#C8C0B0",
  water: "#5BA8C8",
  stone: "#8A8A8A",
};

// ============ CITY LAYOUT - PROPERLY ORGANIZED ============

// Main Boulevard Shops (North-South) - FACING THE ROAD
const mainBoulevardShops = [
  { x: 18, z: 40, color: COLORS.yellow, rotation: -Math.PI / 2 },
  { x: 18, z: 28, color: COLORS.blue, rotation: -Math.PI / 2 },
  { x: 18, z: 16, color: COLORS.pink, rotation: -Math.PI / 2 },
  { x: 18, z: -16, color: COLORS.teal, rotation: -Math.PI / 2 },
  { x: 18, z: -28, color: COLORS.orange, rotation: -Math.PI / 2 },
  { x: 18, z: -40, color: COLORS.green, rotation: -Math.PI / 2 },
  { x: 18, z: -52, color: COLORS.purple, rotation: -Math.PI / 2 },
  { x: -18, z: 40, color: COLORS.blue, rotation: Math.PI / 2 },
  { x: -18, z: 28, color: COLORS.orange, rotation: Math.PI / 2 },
  { x: -18, z: 16, color: COLORS.green, rotation: Math.PI / 2 },
  { x: -18, z: -16, color: COLORS.yellow, rotation: Math.PI / 2 },
  { x: -18, z: -28, color: COLORS.pink, rotation: Math.PI / 2 },
  { x: -18, z: -40, color: COLORS.teal, rotation: Math.PI / 2 },
  { x: -18, z: -52, color: COLORS.rust, rotation: Math.PI / 2 },
];

// Cross Street Shops (East-West) - FACING THE ROAD
const crossStreetShops = [
  { x: 35, z: 18, color: COLORS.rust, rotation: Math.PI },
  { x: 47, z: 18, color: COLORS.purple, rotation: Math.PI },
  { x: 59, z: 18, color: COLORS.teal, rotation: Math.PI },
  { x: -35, z: 18, color: COLORS.teal, rotation: Math.PI },
  { x: -47, z: 18, color: COLORS.yellow, rotation: Math.PI },
  { x: -59, z: 18, color: COLORS.blue, rotation: Math.PI },
  { x: 35, z: -18, color: COLORS.green, rotation: 0 },
  { x: 47, z: -18, color: COLORS.blue, rotation: 0 },
  { x: 59, z: -18, color: COLORS.orange, rotation: 0 },
  { x: -35, z: -18, color: COLORS.orange, rotation: 0 },
  { x: -47, z: -18, color: COLORS.pink, rotation: 0 },
  { x: -59, z: -18, color: COLORS.green, rotation: 0 },
];

// Tall Background Buildings
const tallBuildings = [
  { x: 32, z: 45, height: 26, color: COLORS.beige },
  { x: 32, z: 20, height: 22, color: COLORS.cream },
  { x: 32, z: -35, height: 28, color: COLORS.beige },
  { x: 32, z: -55, height: 24, color: COLORS.cream },
  { x: -32, z: 45, height: 24, color: COLORS.cream },
  { x: -32, z: 20, height: 28, color: COLORS.beige },
  { x: -32, z: -35, height: 22, color: COLORS.cream },
  { x: -32, z: -55, height: 26, color: COLORS.beige },
  { x: -50, z: -70, height: 32, color: COLORS.beige },
  { x: 0, z: -80, height: 38, color: COLORS.cream },
  { x: 50, z: -70, height: 30, color: COLORS.beige },
  { x: 70, z: 25, height: 20, color: COLORS.cream },
  { x: -70, z: 25, height: 22, color: COLORS.beige },
];

// Trees
const treePositions = [
  { x: 10, z: 45 }, { x: 10, z: 33 }, { x: 10, z: 21 },
  { x: 10, z: -21 }, { x: 10, z: -33 }, { x: 10, z: -45 },
  { x: -10, z: 45 }, { x: -10, z: 33 }, { x: -10, z: 21 },
  { x: -10, z: -21 }, { x: -10, z: -33 }, { x: -10, z: -45 },
  { x: 28, z: 15 }, { x: 40, z: 15 }, { x: 52, z: 15 },
  { x: -28, z: 15 }, { x: -40, z: 15 }, { x: -52, z: 15 },
  { x: 45, z: 40 }, { x: 48, z: 43 }, { x: 42, z: 38 },
  { x: -45, z: 40 }, { x: -48, z: 43 }, { x: -42, z: 38 },
  { x: -55, z: -45 }, { x: -58, z: -42 },
  { x: 58, z: 45 }, { x: 55, z: 48 },
];

// Street Lamps
const lampPositions = [
  { x: -10, z: 38 }, { x: 10, z: 38 }, { x: -10, z: 24 }, { x: 10, z: 24 },
  { x: -10, z: -24 }, { x: 10, z: -24 }, { x: -10, z: -38 }, { x: 10, z: -38 },
  { x: -10, z: -50 }, { x: 10, z: -50 },
  { x: 30, z: 10 }, { x: 42, z: 10 }, { x: 54, z: 10 },
  { x: -30, z: 10 }, { x: -42, z: 10 }, { x: -54, z: 10 },
  { x: 30, z: -10 }, { x: 42, z: -10 }, { x: 54, z: -10 },
  { x: -30, z: -10 }, { x: -42, z: -10 }, { x: -54, z: -10 },
];

// Benches
const benchPositions = [
  { x: 9, z: 40, rotation: -Math.PI / 2 },
  { x: -9, z: 40, rotation: Math.PI / 2 },
  { x: 9, z: -48, rotation: -Math.PI / 2 },
  { x: -9, z: -48, rotation: Math.PI / 2 },
  { x: 45, z: 38, rotation: Math.PI / 4 },
  { x: -45, z: 38, rotation: -Math.PI / 4 },
];

// Lakes
const lakes = [
  { x: -55, z: -48, scaleX: 9, scaleZ: 7 },
  { x: 58, z: 48, scaleX: 8, scaleZ: 6 },
];

// District Gates
const districtGates = [
  { x: 78, z: 0, rotation: -Math.PI / 2, name: "ELECTRONICS", color: "#4A7FB5" },
  { x: -78, z: 0, rotation: Math.PI / 2, name: "FOOD STREET", color: "#8B6B4A" },
];

// Billboards
const billboards = [
  { x: 25, z: 50, rotation: -Math.PI / 6 },
  { x: -25, z: 50, rotation: Math.PI / 6 },
  { x: 68, z: 20, rotation: -Math.PI / 3 },
  { x: -68, z: 20, rotation: Math.PI / 3 },
];

// Collectible coins scattered around
const coinPositions = [
  { id: 'coin1', x: 5, z: 25, type: 'coin' as const },
  { id: 'coin2', x: -5, z: 35, type: 'coin' as const },
  { id: 'coin3', x: 25, z: 5, type: 'coin' as const },
  { id: 'coin4', x: -25, z: -5, type: 'coin' as const },
  { id: 'coin5', x: 0, z: -35, type: 'coin' as const },
  { id: 'coin6', x: 40, z: 12, type: 'coin' as const },
  { id: 'coin7', x: -40, z: -12, type: 'coin' as const },
  { id: 'gem1', x: 45, z: 40, type: 'gem' as const },
  { id: 'gem2', x: -45, z: 40, type: 'gem' as const },
  { id: 'star1', x: 0, z: 0, type: 'star' as const },
  { id: 'coin8', x: 55, z: 5, type: 'coin' as const },
  { id: 'coin9', x: -55, z: -5, type: 'coin' as const },
  { id: 'coin10', x: 8, z: -45, type: 'coin' as const },
];

// Clouds
const cloudPositions = [
  { x: -35, y: 50, z: -25, scale: 2.0 },
  { x: 30, y: 55, z: -40, scale: 1.7 },
  { x: -15, y: 48, z: 35, scale: 1.5 },
  { x: 45, y: 52, z: 15, scale: 1.8 },
  { x: -50, y: 58, z: -50, scale: 2.2 },
  { x: 60, y: 45, z: -20, scale: 1.4 },
];

export default function CityScene({
  streetId,
  timeOfDay = "day",
  cameraView = "thirdPerson",
  shopBrandings = [],
  onShopClick,
  forcedTimeOfDay = null,
  onZombieTouchPlayer,
  onTrapHitPlayer,
  hideMobileControls = false,
}: CitySceneProps) {
  // Use forced time of day if provided (for mission night mode)
  const effectiveTimeOfDay = forcedTimeOfDay ?? timeOfDay;
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const mirrorWorld = useMirrorWorldStore();
  const mission = useMissionStore();
  const ghostHunt = useGhostHuntStore();
  const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });
  
  // Use store for camera rotation to persist across game mode changes
  const { cameraRotation, setCameraRotation, incrementJump } = usePlayerStore();
  
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);

  const handleJoystickMove = useCallback((x: number, y: number) => {
    setJoystickInput({ x, y });
  }, []);

  const handleJump = useCallback(() => {
    incrementJump();
  }, [incrementJump]);

  const handleCameraMove = useCallback((deltaX: number, deltaY: number) => {
    setCameraRotation({
      azimuth: cameraRotation.azimuth + deltaX,
      // Polar range: 0.1 (looking up at sky) to 1.6 (looking down) - full vertical freedom
      polar: Math.max(0.1, Math.min(1.6, cameraRotation.polar + deltaY)),
    });
  }, [cameraRotation, setCameraRotation]);

  // Desktop mouse controls for camera rotation - LEFT CLICK to orbit
  useEffect(() => {
    if (isMobile) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        isMouseDownRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDownRef.current = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      
      // Calculate delta from last position
      const deltaX = (e.clientX - lastMousePosRef.current.x) * 0.003;
      const deltaY = (e.clientY - lastMousePosRef.current.y) * 0.003;
      
      // Apply camera rotation only when mouse is held down
      handleCameraMove(-deltaX, deltaY);
      
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isMobile, handleCameraMove]);

  const showMirrorWorld = mirrorWorld.isActive && mirrorWorld.phase !== 'inactive' && !mission.isActive && !ghostHunt.isActive;
  const mirrorWorldActive = mirrorWorld.isActive && mirrorWorld.phase === 'hunting' && !mission.isActive && !ghostHunt.isActive;
  const cameraUp: [number, number, number] = mirrorWorldActive ? [0, -1, 0] : [0, 1, 0];

  return (
    <div className="relative h-full w-full">
      <Canvas
        key={mirrorWorldActive ? 'mirror-world' : 'default-world'}
        className={`h-full w-full ${mirrorWorldActive ? 'mirror-world-canvas' : ''}`}
        style={{ touchAction: "none" }}
        camera={{ position: [0, 10, 50], fov: 50, up: cameraUp }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <SceneInner 
            timeOfDay={effectiveTimeOfDay} 
            cameraView={cameraView}
            joystickInput={joystickInput}
            cameraRotation={cameraRotation}
            shopBrandings={shopBrandings}
            onShopClick={onShopClick}
            onZombieTouchPlayer={onZombieTouchPlayer}
            onTrapHitPlayer={onTrapHitPlayer}
            mirrorWorldActive={showMirrorWorld}
          />
          {showMirrorWorld && (
            <>
              <MirrorShadow />
              {mirrorWorld.anchors.map((anchor) => (
                <RealityAnchor
                  key={anchor.id}
                  id={anchor.id}
                  position={anchor.position}
                  isCollected={anchor.isCollected}
                  type={anchor.type}
                  isVisible={anchor.isVisible}
                  requiredKey={anchor.requiredKey}
                  shieldActive={anchor.shieldActive}
                />
              ))}
            </>
          )}
        </Suspense>
      </Canvas>
      {mirrorWorldActive && <MirrorWorldEnvironment />}
      {isMobile && !hideMobileControls && (
        <MobileControls
          onJoystickMove={handleJoystickMove}
          onCameraMove={handleCameraMove}
          onJump={handleJump}
        />
      )}
      {!isMobile && (
        <div
          className="pointer-events-none absolute bottom-4 right-4 flex flex-col items-end"
          style={{ zIndex: 55 }}
        >
          <button
            type="button"
            onClick={handleJump}
            className="pointer-events-auto rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-black/70"
          >
            Jump <span className="text-xs text-white/70">(Space)</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ============ COMPONENTS ============

// Gradient Sky
function GradientSky({ isNight }: { isNight: boolean }) {
  const skyMaterial = useMemo(() => {
    const topColor = isNight ? "#0A1428" : "#5AB8E8";
    const bottomColor = isNight ? "#1A2A40" : "#B8E8F8";
    return new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(topColor) },
        bottomColor: { value: new THREE.Color(bottomColor) },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
    });
  }, [isNight]);

  return (
    <mesh>
      <sphereGeometry args={[300, 16, 16]} />
      <primitive object={skyMaterial} attach="material" />
    </mesh>
  );
}

// Cloud
function Cloud({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh><dodecahedronGeometry args={[2.5, 0]} /><meshLambertMaterial color="#ffffff" /></mesh>
      <mesh position={[2.5, -0.3, 0]}><dodecahedronGeometry args={[2, 0]} /><meshLambertMaterial color="#ffffff" /></mesh>
      <mesh position={[-2.2, -0.2, 0]}><dodecahedronGeometry args={[1.8, 0]} /><meshLambertMaterial color="#ffffff" /></mesh>
      <mesh position={[1, 0.5, 1]}><dodecahedronGeometry args={[1.5, 0]} /><meshLambertMaterial color="#ffffff" /></mesh>
    </group>
  );
}

// Tree
function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 3, 6]} />
        <meshLambertMaterial color="#5A3A1A" />
      </mesh>
      <mesh position={[0, 4, 0]}>
        <icosahedronGeometry args={[1.8, 0]} />
        <meshLambertMaterial color="#3A7A3A" />
      </mesh>
      <mesh position={[0.5, 5, 0.3]}>
        <icosahedronGeometry args={[1.3, 0]} />
        <meshLambertMaterial color="#4A8A4A" />
      </mesh>
    </group>
  );
}

// Shop Building - FRONT FACES THE ROAD
function Shop({ position, color, rotation = 0, isNight }: { 
  position: [number, number, number]; 
  color: string; 
  rotation?: number;
  isNight: boolean;
}) {
  const darker = useMemo(() => {
    const c = new THREE.Color(color);
    c.multiplyScalar(0.7);
    return `#${c.getHexString()}`;
  }, [color]);
  
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main body */}
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[8, 6, 8]} />
        <meshLambertMaterial color={isNight ? "#3A3A4A" : color} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 6.2, 0]}>
        <boxGeometry args={[8.4, 0.4, 8.4]} />
        <meshLambertMaterial color={isNight ? "#2A2A3A" : darker} />
      </mesh>
      {/* FRONT FACE (z+) - Windows */}
      {[-2, 2].map((wx, i) => (
        <mesh key={`win-${i}`} position={[wx, 4.2, 4.05]}>
          <boxGeometry args={[1.5, 1.5, 0.1]} />
          <meshLambertMaterial color="#5A6A7A" emissive={isNight ? "#4488AA" : "#000000"} emissiveIntensity={isNight ? 0.6 : 0} />
        </mesh>
      ))}
      {/* FRONT FACE - Storefront window */}
      <mesh position={[0.8, 1.8, 4.05]}>
        <boxGeometry args={[4, 2.8, 0.1]} />
        <meshLambertMaterial color={isNight ? "#6A9ACC" : "#87CEEB"} emissive={isNight ? "#5588BB" : "#000000"} emissiveIntensity={isNight ? 0.5 : 0} />
      </mesh>
      {/* FRONT FACE - Door */}
      <mesh position={[-2.8, 1.5, 4.05]}>
        <boxGeometry args={[1.5, 3, 0.1]} />
        <meshLambertMaterial color="#4A3A2A" />
      </mesh>
      {/* Awning */}
      <mesh position={[0, 3.5, 4.8]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[7, 0.1, 1.5]} />
        <meshLambertMaterial color={darker} />
      </mesh>
      {/* FOR RENT Signboard - OPTIMIZED for performance */}
      <group position={[0, 5.2, 4.3]}>
        {/* Sign board background */}
        <mesh>
          <boxGeometry args={[4.5, 1.3, 0.2]} />
          <meshBasicMaterial color={isNight ? "#1A0015" : "#1A1A2A"} />
        </mesh>
        {/* Neon border - uses meshBasicMaterial for performance + glow look */}
        <mesh position={[0, 0, 0.11]}>
          <boxGeometry args={[4.6, 1.4, 0.02]} />
          <meshBasicMaterial color={isNight ? "#FF1493" : "#882244"} />
        </mesh>
        {/* Inner cyan border */}
        <mesh position={[0, 0, 0.12]}>
          <boxGeometry args={[4.0, 0.9, 0.02]} />
          <meshBasicMaterial color={isNight ? "#00FFFF" : "#006666"} />
        </mesh>
        {/* FOR RENT text */}
        <Text 
          position={[0, 0, 0.15]} 
          fontSize={0.4} 
          color={isNight ? "#FFFF00" : "#FFDD00"} 
          anchorX="center" 
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor={isNight ? "#FF1493" : "#886600"}
        >
          FOR RENT
        </Text>
        {/* Removed individual point lights for performance */}
      </group>
    </group>
  );
}

// Tall Building
function TallBuilding({ position, height, color, isNight }: { 
  position: [number, number, number]; 
  height: number;
  color: string;
  isNight: boolean;
}) {
  const rows = Math.floor(height / 3.5);
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[10, height, 10]} />
        <meshLambertMaterial color={isNight ? "#3A3A4A" : color} />
      </mesh>
      {/* Windows on all sides */}
      {Array.from({ length: rows }).map((_, row) => (
        <React.Fragment key={row}>
          {[-3, 0, 3].map((wx, col) => (
            <mesh key={`f-${row}-${col}`} position={[wx, 3 + row * 3.5, 5.05]}>
              <boxGeometry args={[1.5, 2, 0.1]} />
              <meshLambertMaterial color={isNight ? "#5A7A9A" : "#6A8A9A"} emissive={isNight ? "#3366AA" : "#000000"} emissiveIntensity={isNight ? 0.35 : 0} />
            </mesh>
          ))}
          {[-3, 0, 3].map((wz, col) => (
            <mesh key={`s-${row}-${col}`} position={[5.05, 3 + row * 3.5, wz]}>
              <boxGeometry args={[0.1, 2, 1.5]} />
              <meshLambertMaterial color={isNight ? "#5A7A9A" : "#6A8A9A"} emissive={isNight ? "#3366AA" : "#000000"} emissiveIntensity={isNight ? 0.35 : 0} />
            </mesh>
          ))}
        </React.Fragment>
      ))}
    </group>
  );
}

// Street Lamp - OPTIMIZED (no individual point lights)
function Lamp({ position, isNight }: { position: [number, number, number]; isNight: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 6, 6]} />
        <meshBasicMaterial color="#2A2A2A" />
      </mesh>
      <mesh position={[0, 6.2, 0]}>
        <sphereGeometry args={[0.4, 6, 6]} />
        <meshBasicMaterial color={isNight ? "#FFD080" : "#E8E8E8"} />
      </mesh>
      {/* Removed individual lamp lights for performance - using global ambient instead */}
    </group>
  );
}

// Bench
function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.5, 0]}><boxGeometry args={[1.5, 0.1, 0.5]} /><meshLambertMaterial color="#5A3A1A" /></mesh>
      <mesh position={[0, 0.8, -0.2]}><boxGeometry args={[1.5, 0.5, 0.1]} /><meshLambertMaterial color="#5A3A1A" /></mesh>
      {[-0.6, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 0.25, 0]}><boxGeometry args={[0.1, 0.5, 0.4]} /><meshLambertMaterial color="#3A3A3A" /></mesh>
      ))}
    </group>
  );
}

// Lake
function Lake({ position, scaleX, scaleZ }: { position: [number, number, number]; scaleX: number; scaleZ: number }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} scale={[scaleX, scaleZ, 1]}>
        <circleGeometry args={[1, 20]} />
        <meshLambertMaterial color={COLORS.water} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={[scaleX + 0.8, scaleZ + 0.8, 1]}>
        <ringGeometry args={[0.88, 1, 20]} />
        <meshLambertMaterial color="#6A9A6A" />
      </mesh>
    </group>
  );
}

// District Gate - proper arch at street end
function DistrictGate({ position, rotation, name, color }: { 
  position: [number, number, number]; 
  rotation: number; 
  name: string;
  color: string;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Pillars */}
      <mesh position={[-5, 4, 0]}><boxGeometry args={[1.5, 8, 1.5]} /><meshLambertMaterial color={color} /></mesh>
      <mesh position={[5, 4, 0]}><boxGeometry args={[1.5, 8, 1.5]} /><meshLambertMaterial color={color} /></mesh>
      {/* Arch */}
      <mesh position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5, 0.8, 6, 16, Math.PI]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Sign board */}
      <mesh position={[0, 10.5, 0.5]}><boxGeometry args={[7, 1.5, 0.3]} /><meshLambertMaterial color={color} /></mesh>
      <Text position={[0, 10.5, 0.7]} fontSize={0.6} color="#FFFFFF" anchorX="center" anchorY="middle">{name}</Text>
      {/* Coming Soon */}
      <mesh position={[0, 1.5, 0]}><boxGeometry args={[6, 1.2, 0.2]} /><meshLambertMaterial color="#2A4A6A" /></mesh>
      <Text position={[0, 1.5, 0.15]} fontSize={0.4} color="#FFCC00" anchorX="center" anchorY="middle">COMING SOON</Text>
    </group>
  );
}

// Billboard
function Billboard({ position, rotation, isNight }: { position: [number, number, number]; rotation: number; isNight: boolean }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 4.5, 0]}><cylinderGeometry args={[0.25, 0.3, 9, 6]} /><meshLambertMaterial color="#5A5A5A" /></mesh>
      <mesh position={[0, 9.5, 0]}><boxGeometry args={[6, 4, 0.25]} /><meshLambertMaterial color={isNight ? "#3A4A5A" : "#E8E8E8"} emissive={isNight ? "#2A3A4A" : "#000000"} emissiveIntensity={isNight ? 0.25 : 0} /></mesh>
      <mesh position={[0, 9.5, 0.15]}><boxGeometry args={[5.4, 3.4, 0.08]} /><meshLambertMaterial color="#D45A5A" /></mesh>
    </group>
  );
}

// Animated fountain water stream component
function FountainWater({ isNight }: { isNight: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Animate water streams
  useEffect(() => {
    let animationId: number;
    let time = 0;
    
    const animate = () => {
      time += 0.03;
      if (groupRef.current) {
        // Gentle pulsing animation for water height
        const pulse = Math.sin(time * 2) * 0.1 + 1;
        groupRef.current.scale.y = pulse;
      }
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);
  
  const waterColor = isNight ? "#4A8ABB" : "#6BC8E8";
  const waterEmissive = isNight ? "#3A6A9A" : "#4AA8C8";
  
  return (
    <group ref={groupRef}>
      {/* Central water jet - main upward stream */}
      <mesh position={[0, 4.8, 0]}>
        <coneGeometry args={[0.15, 1.8, 8]} />
        <meshLambertMaterial 
          color={waterColor} 
          transparent 
          opacity={0.7}
          emissive={waterEmissive}
          emissiveIntensity={isNight ? 0.4 : 0.1}
        />
      </mesh>
      
      {/* Water spray at top - splashing effect */}
      <mesh position={[0, 5.6, 0]}>
        <sphereGeometry args={[0.25, 8, 6]} />
        <meshLambertMaterial 
          color={waterColor} 
          transparent 
          opacity={0.5}
          emissive={waterEmissive}
          emissiveIntensity={isNight ? 0.3 : 0.05}
        />
      </mesh>
      
      {/* Falling water curtain - cascading down */}
      <mesh position={[0, 4.2, 0]}>
        <cylinderGeometry args={[0.6, 0.2, 0.8, 12, 1, true]} />
        <meshLambertMaterial 
          color={waterColor} 
          transparent 
          opacity={0.4}
          side={THREE.DoubleSide}
          emissive={waterEmissive}
          emissiveIntensity={isNight ? 0.2 : 0}
        />
      </mesh>
      
      {/* Secondary falling streams into lower basin */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <mesh 
          key={`stream-${i}`} 
          position={[
            Math.cos(angle) * 1.2, 
            2.8, 
            Math.sin(angle) * 1.2
          ]}
          rotation={[0.3 * Math.cos(angle), 0, 0.3 * Math.sin(angle)]}
        >
          <coneGeometry args={[0.08, 1.2, 6]} />
          <meshLambertMaterial 
            color={waterColor} 
            transparent 
            opacity={0.5}
            emissive={waterEmissive}
            emissiveIntensity={isNight ? 0.25 : 0.05}
          />
        </mesh>
      ))}
      
      {/* Ripple rings on water surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.65, 0]}>
        <ringGeometry args={[0.5, 0.7, 16]} />
        <meshLambertMaterial 
          color="#8AD8F8" 
          transparent 
          opacity={0.3}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.64, 0]}>
        <ringGeometry args={[1.2, 1.4, 16]} />
        <meshLambertMaterial 
          color="#8AD8F8" 
          transparent 
          opacity={0.2}
        />
      </mesh>
    </group>
  );
}

// ROUNDABOUT with Fountain in center
function Roundabout({ isNight }: { isNight: boolean }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Circular road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[8, 16, 32]} />
        <meshLambertMaterial color={COLORS.road} />
      </mesh>
      {/* Inner grass circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[8, 32]} />
        <meshLambertMaterial color="#5A9A5A" />
      </mesh>
      {/* Stone edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[7.5, 8, 32]} />
        <meshLambertMaterial color={COLORS.stone} />
      </mesh>
      {/* Fountain base */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[4.5, 5, 0.8, 16]} />
        <meshLambertMaterial color={COLORS.stone} />
      </mesh>
      {/* Fountain water pool */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[4, 4, 0.4, 16]} />
        <meshLambertMaterial color={COLORS.water} emissive={isNight ? "#2A5A8A" : "#000000"} emissiveIntensity={isNight ? 0.3 : 0} />
      </mesh>
      {/* Fountain pillar */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.7, 0.9, 3.2, 10]} />
        <meshLambertMaterial color={COLORS.stone} />
      </mesh>
      {/* Fountain top basin */}
      <mesh position={[0, 3.8, 0]}>
        <cylinderGeometry args={[1.5, 1, 0.6, 10]} />
        <meshLambertMaterial color={COLORS.stone} />
      </mesh>
      {/* Top water */}
      <mesh position={[0, 3.9, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.3, 10]} />
        <meshLambertMaterial color={COLORS.water} />
      </mesh>
      
      {/* Animated water streams */}
      <FountainWater isNight={isNight} />
    </group>
  );
}

// Lane Marking
function LaneMarking({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, rotation, 0]} position={position}>
      <planeGeometry args={[0.4, 3.5]} />
      <meshBasicMaterial color="#FFFFFF" />
    </mesh>
  );
}

// Ghost Hunt Ghosts Component
function GhostHuntGhosts({ isNight }: { isNight: boolean }) {
  const { ghosts, phase, isActive } = useGhostHuntStore();
  
  if (!isActive || phase === 'inactive' || phase === 'briefing') return null;
  
  return (
    <>
      {ghosts.map((ghost) => (
        <GhostCharacter
          key={ghost.id}
          id={ghost.id}
          position={ghost.position}
          type={ghost.type}
          isRevealed={ghost.isRevealed}
          isCaptured={ghost.isCaptured}
          isNight={isNight}
        />
      ))}
    </>
  );
}

function MirrorWorldStairs() {
  const stairSets = [
    { position: [12, 0, 30] as [number, number, number], rotation: Math.PI / 2 },
    { position: [-12, 0, 18] as [number, number, number], rotation: -Math.PI / 2 },
    { position: [39, 0, 8] as [number, number, number], rotation: Math.PI / 2 },
    { position: [-28, 0, -16] as [number, number, number], rotation: -Math.PI / 2 },
    { position: [4, 0, -44] as [number, number, number], rotation: Math.PI / 2 },
  ];
  const stepCount = 32;
  const stepHeight = 0.25;
  const stepDepth = 0.9;
  const stepWidth = 4.2;
  const beaconHeight = stepCount * stepHeight + 1.2;

  return (
    <group>
      {stairSets.map((stair, stairIndex) => (
        <group key={`mirror-stair-${stairIndex}`} position={stair.position} rotation={[0, stair.rotation, 0]}>
          {Array.from({ length: stepCount }).map((_, stepIndex) => (
            <mesh
              key={`mirror-step-${stairIndex}-${stepIndex}`}
              position={[0, stepHeight / 2 + stepIndex * stepHeight, stepIndex * stepDepth]}
            >
              <boxGeometry args={[stepWidth, stepHeight, stepDepth]} />
              <meshStandardMaterial color="#4B2B7F" emissive="#2A1244" emissiveIntensity={0.6} />
            </mesh>
          ))}
          <mesh position={[0, beaconHeight / 2, stepDepth * (stepCount - 1)]}>
            <cylinderGeometry args={[0.25, 0.35, beaconHeight, 8]} />
            <meshStandardMaterial color="#B992FF" emissive="#8B5CF6" emissiveIntensity={1.2} />
          </mesh>
          <pointLight
            position={[0, beaconHeight, stepDepth * (stepCount - 1)]}
            intensity={1.4}
            distance={12}
            color="#C4B5FD"
          />
        </group>
      ))}
    </group>
  );
}

function SceneInner({ timeOfDay, cameraView, joystickInput, cameraRotation, shopBrandings, onShopClick, onZombieTouchPlayer, onTrapHitPlayer, mirrorWorldActive }: InnerProps) {
  const { scene } = useThree();
  const isNight = timeOfDay === "night";
  const collectCoin = useGameStore((state) => state.collectCoin);
  const { zombies, zombiesPaused, traps, isActive: missionActive, slowedZombieIds, frozenZombieIds, freezeZombie, targetShop, phase: missionPhase } = useMissionStore();
  const ghostHuntActive = useGhostHuntStore((state) => state.isActive);
  const allowMissionEntities = missionActive && !ghostHuntActive && !mirrorWorldActive;
  const allowGhosts = ghostHuntActive && !missionActive && !mirrorWorldActive;

  useEffect(() => {
    scene.background = null;
  }, [scene]);

  // Create a map for quick lookup of shop brandings by position
  const brandingsByPosition = useMemo(() => {
    const map = new Map<string, ShopBranding>();
    shopBrandings.forEach(b => {
      const key = `${b.position.x},${b.position.z}`;
      map.set(key, b);
    });
    return map;
  }, [shopBrandings]);

  // Helper to check if there's branding data at a position
  const getBrandingAtPosition = (x: number, z: number): ShopBranding | undefined => {
    return brandingsByPosition.get(`${x},${z}`);
  };

  const handleCollectItem = useCallback((id: string, type: 'coin' | 'gem' | 'star') => {
    collectCoin(id);
  }, [collectCoin]);

  return (
    <>
      <GradientSky isNight={isNight} />
      {!isNight && cloudPositions.map((c, i) => <Cloud key={i} position={[c.x, c.y, c.z]} scale={c.scale} />)}

      {/* Lighting */}
      <ambientLight intensity={isNight ? 1.3 : 1.0} />
      <hemisphereLight color={isNight ? "#8090B0" : "#ffffff"} groundColor={isNight ? "#4A5A6A" : "#88AA88"} intensity={isNight ? 1.2 : 0.7} />
      <directionalLight position={[50, 70, 40]} intensity={isNight ? 0.8 : 1.6} color={isNight ? "#8090B0" : "#FFF8E8"} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -10]}>
        <planeGeometry args={[250, 250]} />
        <meshLambertMaterial color={isNight ? "#2A4A2A" : COLORS.grass} />
      </mesh>

      {/* === MAIN BOULEVARD (North-South) === */}
      {/* North section */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 32]}>
        <planeGeometry args={[14, 50]} />
        <meshLambertMaterial color={COLORS.road} />
      </mesh>
      {/* South section */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -38]}>
        <planeGeometry args={[14, 55]} />
        <meshLambertMaterial color={COLORS.road} />
      </mesh>
      {/* Lane markings - north */}
      {Array.from({ length: 10 }).map((_, i) => <LaneMarking key={`n-${i}`} position={[0, 0.02, 52 - i * 5]} />)}
      {/* Lane markings - south */}
      {Array.from({ length: 12 }).map((_, i) => <LaneMarking key={`s-${i}`} position={[0, 0.02, -18 - i * 5]} />)}
      {/* Sidewalks */}
      <mesh position={[-10, 0.12, 32]}><boxGeometry args={[6, 0.24, 50]} /><meshLambertMaterial color={COLORS.sidewalk} /></mesh>
      <mesh position={[10, 0.12, 32]}><boxGeometry args={[6, 0.24, 50]} /><meshLambertMaterial color={COLORS.sidewalk} /></mesh>
      <mesh position={[-10, 0.12, -38]}><boxGeometry args={[6, 0.24, 55]} /><meshLambertMaterial color={COLORS.sidewalk} /></mesh>
      <mesh position={[10, 0.12, -38]}><boxGeometry args={[6, 0.24, 55]} /><meshLambertMaterial color={COLORS.sidewalk} /></mesh>

      {/* === CROSS STREET (East-West) === */}
      {/* East section */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[48, 0.01, 0]}>
        <planeGeometry args={[60, 14]} />
        <meshLambertMaterial color={COLORS.road} />
      </mesh>
      {/* West section */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-48, 0.01, 0]}>
        <planeGeometry args={[60, 14]} />
        <meshLambertMaterial color={COLORS.road} />
      </mesh>
      {/* Lane markings */}
      {Array.from({ length: 12 }).map((_, i) => <LaneMarking key={`e-${i}`} position={[20 + i * 5, 0.02, 0]} rotation={Math.PI / 2} />)}
      {Array.from({ length: 12 }).map((_, i) => <LaneMarking key={`w-${i}`} position={[-20 - i * 5, 0.02, 0]} rotation={Math.PI / 2} />)}
      {/* Sidewalks */}
      <mesh position={[48, 0.12, 10]}><boxGeometry args={[60, 0.24, 6]} /><meshLambertMaterial color={COLORS.sidewalk} /></mesh>
      <mesh position={[48, 0.12, -10]}><boxGeometry args={[60, 0.24, 6]} /><meshLambertMaterial color={COLORS.sidewalk} /></mesh>
      <mesh position={[-48, 0.12, 10]}><boxGeometry args={[60, 0.24, 6]} /><meshLambertMaterial color={COLORS.sidewalk} /></mesh>
      <mesh position={[-48, 0.12, -10]}><boxGeometry args={[60, 0.24, 6]} /><meshLambertMaterial color={COLORS.sidewalk} /></mesh>

      {/* === ROUNDABOUT === */}
      <Roundabout isNight={isNight} />

      {mirrorWorldActive && <MirrorWorldStairs />}

      {/* === SHOPS - Render BrandedShop if branding data exists, otherwise regular Shop === */}
      {mainBoulevardShops.map((shop, i) => {
        const branding = getBrandingAtPosition(shop.x, shop.z);
        if (branding) {
          // During active mission (escape phase only), only target shop is clickable
          // During inactive or completed mission, ALL shops are clickable
          const isEscapePhase = allowMissionEntities && missionPhase === 'escape';
          const isClickable = !isEscapePhase || branding.shopId === targetShop?.shopId;
          return (
            <BrandedShop 
              key={`main-${i}`} 
              branding={branding} 
              isNight={isNight} 
              onClick={isClickable ? () => onShopClick?.(branding) : undefined}
            />
          );
        }
        return <Shop key={`main-${i}`} position={[shop.x, 0, shop.z]} color={shop.color} rotation={shop.rotation} isNight={isNight} />;
      })}
      {crossStreetShops.map((shop, i) => {
        const branding = getBrandingAtPosition(shop.x, shop.z);
        if (branding) {
          // During active mission (escape phase only), only target shop is clickable
          // During inactive or completed mission, ALL shops are clickable
          const isEscapePhase = allowMissionEntities && missionPhase === 'escape';
          const isClickable = !isEscapePhase || branding.shopId === targetShop?.shopId;
          return (
            <BrandedShop 
              key={`cross-${i}`} 
              branding={branding} 
              isNight={isNight} 
              onClick={isClickable ? () => onShopClick?.(branding) : undefined}
            />
          );
        }
        return <Shop key={`cross-${i}`} position={[shop.x, 0, shop.z]} color={shop.color} rotation={shop.rotation} isNight={isNight} />;
      })}

      {/* === TALL BUILDINGS === */}
      {tallBuildings.map((b, i) => <TallBuilding key={`tall-${i}`} position={[b.x, 0, b.z]} height={b.height} color={b.color} isNight={isNight} />)}

      {/* === TREES === */}
      {treePositions.map((t, i) => <Tree key={`tree-${i}`} position={[t.x, 0, t.z]} />)}

      {/* === LAMPS === */}
      {lampPositions.map((l, i) => <Lamp key={`lamp-${i}`} position={[l.x, 0, l.z]} isNight={isNight} />)}

      {/* === BENCHES === */}
      {benchPositions.map((b, i) => <Bench key={`bench-${i}`} position={[b.x, 0, b.z]} rotation={b.rotation} />)}

      {/* === LAKES === */}
      {lakes.map((lake, i) => <Lake key={`lake-${i}`} position={[lake.x, 0, lake.z]} scaleX={lake.scaleX} scaleZ={lake.scaleZ} />)}

      {/* === DISTRICT GATES (at street ends) === */}
      {districtGates.map((gate, i) => <DistrictGate key={`gate-${i}`} position={[gate.x, 0, gate.z]} rotation={gate.rotation} name={gate.name} color={gate.color} />)}

      {/* === BILLBOARDS === */}
      {billboards.map((bb, i) => <Billboard key={`bb-${i}`} position={[bb.x, 0, bb.z]} rotation={bb.rotation} isNight={isNight} />)}

      {/* === PARKS === */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[45, 0.02, 42]}><planeGeometry args={[16, 16]} /><meshLambertMaterial color="#6ABF6A" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-45, 0.02, 42]}><planeGeometry args={[16, 16]} /><meshLambertMaterial color="#6ABF6A" /></mesh>

      {/* === COLLECTIBLES === */}
      {coinPositions.map((coin) => (
        <CollectibleItem
          key={coin.id}
          id={coin.id}
          position={[coin.x, 0.5, coin.z]}
          type={coin.type}
          isNight={isNight}
          onCollect={handleCollectItem}
        />
      ))}

      {/* === ZOMBIES (Mission) === */}
      {allowMissionEntities && zombies.map((zombie) => (
        <ZombieCharacter
          key={zombie.id}
          id={zombie.id}
          position={zombie.position}
          isNight={isNight}
          isPaused={zombiesPaused}
          isSlowed={slowedZombieIds.has(zombie.id)}
          isFrozen={frozenZombieIds.has(zombie.id)}
          behaviorType={zombie.behaviorType}
          onTouchPlayer={(id) => onZombieTouchPlayer?.()}
        />
      ))}

      {/* === FIRE PIT TRAPS (Mission) === */}
      {allowMissionEntities && traps.filter(t => t.type === 'firepit').map((trap) => (
        <FirePitTrap
          key={trap.id}
          id={trap.id}
          position={trap.position}
          isActive={trap.isActive}
          onPlayerHit={(id) => onTrapHitPlayer?.()}
        />
      ))}
      
      {/* === SWINGING AXE TRAPS (Mission) === */}
      {allowMissionEntities && traps.filter(t => t.type === 'axe').map((trap) => (
        <SwingingAxeTrap
          key={trap.id}
          id={trap.id}
          position={trap.position}
          rotation={trap.rotation}
          isActive={trap.isActive}
          onPlayerHit={(id) => onTrapHitPlayer?.()}
        />
      ))}
      
      {/* === THORNS TRAPS (Mission) === */}
      {allowMissionEntities && traps.filter(t => t.type === 'thorns').map((trap) => (
        <ThornsTrap
          key={trap.id}
          id={trap.id}
          position={trap.position}
          isActive={trap.isActive}
          onPlayerHit={(id) => onTrapHitPlayer?.()}
        />
      ))}

      {/* === GHOSTS (Ghost Hunt Mission) === */}
      {allowGhosts && <GhostHuntGhosts isNight={isNight} />}

      {/* === PLAYER CHARACTER === */}
      <PlayerController 
        isNight={isNight} 
        speed={0.2} 
        joystickInput={joystickInput} 
        viewMode={cameraView}
        cameraRotation={cameraRotation}
      />
    </>
  );
}
