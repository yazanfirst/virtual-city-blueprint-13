"use client";

import React, { Suspense, useMemo, useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import PlayerController from "./PlayerController";
import MobileControls from "./MobileControls";
import BrandedShop from "./BrandedShop";
import { useDeviceType } from "@/hooks/useDeviceType";
import { usePlayerStore } from "@/stores/playerStore";
import { ShopBranding } from "@/hooks/use3DShops";

export type CameraView = "thirdPerson" | "firstPerson";

type CitySceneProps = {
  streetId: string;
  timeOfDay?: "day" | "night";
  cameraView?: CameraView;
  shopBrandings?: ShopBranding[];
  onShopClick?: (branding: ShopBranding) => void;
};

type InnerProps = {
  timeOfDay: "day" | "night";
  cameraView: CameraView;
  joystickInput: { x: number; y: number };
  cameraRotation: { azimuth: number; polar: number };
  shopBrandings: ShopBranding[];
  onShopClick?: (branding: ShopBranding) => void;
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
}: CitySceneProps) {
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);
  
  // Use store for camera rotation to persist across game mode changes
  const { cameraRotation, setCameraRotation } = usePlayerStore();
  
  const isMouseDownRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Delay rendering to prevent immediate context loss
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleJoystickMove = useCallback((x: number, y: number) => {
    setJoystickInput({ x, y });
  }, []);

  const handleCameraMove = useCallback((deltaX: number, deltaY: number) => {
    setCameraRotation({
      azimuth: cameraRotation.azimuth + deltaX,
      // Polar range: 0.1 (looking up at sky) to 1.6 (looking down) - full vertical freedom
      polar: Math.max(0.1, Math.min(1.6, cameraRotation.polar + deltaY)),
    });
  }, [cameraRotation, setCameraRotation]);

  // Desktop mouse controls for camera rotation
  useEffect(() => {
    if (isMobile) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Right click or left click for camera control
      isMouseDownRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      const deltaX = (e.clientX - lastMousePosRef.current.x) * 0.005;
      const deltaY = (e.clientY - lastMousePosRef.current.y) * 0.005;
      handleCameraMove(-deltaX, deltaY);
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isMobile, handleCameraMove]);

  // Show loading until ready
  if (!isReady) {
    return (
      <div className="relative h-full w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing 3D scene...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Canvas
        className="h-full w-full"
        camera={{ position: [0, 10, 50], fov: 50 }}
        gl={{ 
          antialias: false, 
          powerPreference: "default",
          preserveDrawingBuffer: true,
        }}
      >
        <Suspense fallback={null}>
          <SceneInner 
            timeOfDay={timeOfDay} 
            cameraView={cameraView}
            joystickInput={joystickInput}
            cameraRotation={cameraRotation}
            shopBrandings={shopBrandings}
            onShopClick={onShopClick}
          />
        </Suspense>
      </Canvas>
      {isMobile && (
        <MobileControls 
          onJoystickMove={handleJoystickMove}
          onCameraMove={handleCameraMove}
        />
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

function SceneInner({ timeOfDay, cameraView, joystickInput, cameraRotation, shopBrandings, onShopClick }: InnerProps) {
  const { scene } = useThree();
  const isNight = timeOfDay === "night";

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

      {/* === SHOPS - Render BrandedShop if branding data exists, otherwise regular Shop === */}
      {mainBoulevardShops.map((shop, i) => {
        const branding = getBrandingAtPosition(shop.x, shop.z);
        if (branding) {
          return (
            <BrandedShop 
              key={`main-${i}`} 
              branding={branding} 
              isNight={isNight} 
              onClick={() => onShopClick?.(branding)}
            />
          );
        }
        return <Shop key={`main-${i}`} position={[shop.x, 0, shop.z]} color={shop.color} rotation={shop.rotation} isNight={isNight} />;
      })}
      {crossStreetShops.map((shop, i) => {
        const branding = getBrandingAtPosition(shop.x, shop.z);
        if (branding) {
          return (
            <BrandedShop 
              key={`cross-${i}`} 
              branding={branding} 
              isNight={isNight} 
              onClick={() => onShopClick?.(branding)}
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
