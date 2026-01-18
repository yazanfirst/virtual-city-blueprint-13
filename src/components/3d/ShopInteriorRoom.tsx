import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { ShopBranding } from "@/hooks/use3DShops";
import { Button } from "@/components/ui/button";
import { ShopItem, useShopItems } from "@/hooks/useShopItems";
import { X, ExternalLink, ChevronLeft, ChevronRight, Package, ShoppingBag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ShopInteriorRoomProps {
  shop: ShopBranding;
  onExit: () => void;
  isMissionMode?: boolean; // When true, show mission-specific wall instructions
}

interface FrameSpotConfig {
  slot: number;
  position: [number, number, number];
  rotation: [number, number, number];
  wall: 'front' | 'left' | 'right' | 'back';
}

// 5 frames: 2 front wall, 1 left, 1 right, 1 back
const FRAME_SPOTS: FrameSpotConfig[] = [
  // Front wall - 2 frames
  { slot: 0, position: [-2, 2.2, -5.85], rotation: [0, 0, 0], wall: 'front' },
  { slot: 1, position: [2, 2.2, -5.85], rotation: [0, 0, 0], wall: 'front' },
  // Left wall - 1 frame
  { slot: 2, position: [-6.85, 2.2, 0], rotation: [0, Math.PI / 2, 0], wall: 'left' },
  // Right wall - 1 frame
  { slot: 3, position: [6.85, 2.2, 0], rotation: [0, -Math.PI / 2, 0], wall: 'right' },
  // Back wall (behind player) - 1 frame
  { slot: 4, position: [0, 2.2, 5.85], rotation: [0, Math.PI, 0], wall: 'back' },
];

// Optimized brick texture - created once
const createBrickTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  // Light cream mortar base
  ctx.fillStyle = "#d4c4a8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const brickWidth = 64;
  const brickHeight = 28;
  const mortar = 3;

  for (let y = 0; y < canvas.height + brickHeight; y += brickHeight) {
    for (let x = -brickWidth; x < canvas.width + brickWidth; x += brickWidth) {
      const offset = Math.floor(y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
      
      // Bright terracotta bricks
      const shade = 0.9 + Math.random() * 0.2;
      const r = Math.floor(180 * shade);
      const g = Math.floor(110 * shade);
      const b = Math.floor(80 * shade);
      
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x + offset + mortar, y + mortar, brickWidth - mortar * 2, brickHeight - mortar * 2);
      
      // Highlight
      ctx.fillStyle = `rgba(255, 240, 220, 0.15)`;
      ctx.fillRect(x + offset + mortar, y + mortar, brickWidth - mortar * 2, 3);
    }
  }

  // Mortar already set as background
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = "#c4b49a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  return texture;
};

// Memoized brick texture hook
const useBrickTexture = () => {
  return useMemo(() => createBrickTexture(), []);
};

// Beautiful ornate frame component
const OrnateFrame = ({
  config,
  item,
  accent,
  primary,
  isSelected,
  onSelect,
}: {
  config: FrameSpotConfig;
  item?: ShopItem;
  accent: string;
  primary: string;
  isSelected: boolean;
  onSelect: (slot: number) => void;
}) => {
  const hasItem = Boolean(item?.title);
  const frameColor = hasItem ? "#c9a227" : "#4a3f35";
  const innerColor = hasItem ? "#1a1510" : "#0f0d0a";
  
  return (
    <group position={config.position} rotation={config.rotation}>
      {/* Soft warm spotlight on frame - minimal performance impact */}
      {hasItem && (
        <pointLight 
          position={[0, 0.5, 1]} 
          intensity={0.4} 
          color="#ffeedd" 
          distance={3} 
          decay={2}
        />
      )}
      
      {/* Outer ornate frame */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[2.4, 1.8, 0.12]} />
        <meshStandardMaterial 
          color={frameColor}
          metalness={0.6}
          roughness={0.35}
          emissive={isSelected ? accent : "#000000"}
          emissiveIntensity={isSelected ? 0.2 : 0}
        />
      </mesh>
      
      {/* Frame inner border */}
      <mesh position={[0, 0, 0.06]}>
        <boxGeometry args={[2.1, 1.5, 0.08]} />
        <meshStandardMaterial 
          color={hasItem ? "#8b7355" : "#3a3028"}
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>
      
      {/* Frame mat/passepartout */}
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[1.9, 1.3, 0.02]} />
        <meshStandardMaterial color={innerColor} roughness={0.9} />
      </mesh>
      
      {/* Corner decorations */}
      {[[-0.95, 0.65], [0.95, 0.65], [-0.95, -0.65], [0.95, -0.65]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.08]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color={frameColor} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      
      {/* Content area with HTML */}
      <Html
        transform
        position={[0, 0, 0.15]}
        distanceFactor={8}
        occlude
        className="pointer-events-auto"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(config.slot);
          }}
          className="group transition-transform duration-200 hover:scale-[1.02] focus:outline-none"
          style={{ 
            width: '160px',
            height: '110px',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: isSelected ? `0 0 20px ${accent}50` : 'none',
          }}
        >
          {hasItem && item ? (
            <div className="relative h-full w-full overflow-hidden">
              {/* Full frame product image - covers entire frame */}
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.title} 
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
                />
              ) : (
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${primary}40, ${accent}30)` }}
                >
                  <Package className="h-8 w-8 text-white/60" />
                </div>
              )}
              
              {/* Overlay gradient for text readability */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              {/* Price badge */}
              {item.price != null && (
                <div 
                  className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-lg"
                  style={{ backgroundColor: accent }}
                >
                  ${Number(item.price).toFixed(2)}
                </div>
              )}
              
              {/* Product title overlay */}
              <div className="absolute inset-x-0 bottom-0 p-1.5">
                <p className="text-[11px] font-semibold text-white truncate drop-shadow-lg">{item.title}</p>
                <p className="text-[9px] text-white/70">Tap to view</p>
              </div>
            </div>
          ) : (
            <div 
              className="h-full w-full flex flex-col items-center justify-center gap-2 bg-background/40 backdrop-blur-sm border border-dashed border-muted-foreground/20 rounded"
            >
              <Package className="h-6 w-6 text-muted-foreground/30" />
              <span className="text-[10px] text-muted-foreground/50">Empty</span>
            </div>
          )}
        </button>
      </Html>
    </group>
  );
};

const InteriorScene = ({
  shop,
  items,
  selectedSlot,
  onSelectItem,
  isMissionMode = false,
}: {
  shop: ShopBranding;
  items: (ShopItem | undefined)[];
  selectedSlot: number | null;
  onSelectItem: (slot: number) => void;
  isMissionMode?: boolean;
}) => {
  const brickTexture = useBrickTexture();
  const accent = shop.accentColor || "#10B981";
  const primary = shop.primaryColor || "#3B82F6";

  return (
    <group>
      {/* Strong ambient lighting */}
      <ambientLight intensity={1.2} color="#ffffff" />
      <hemisphereLight args={["#ffffff", "#c4a882", 1.0]} position={[0, 5, 0]} />
      
      {/* Main ceiling lights - very bright */}
      <pointLight 
        position={[0, 4.5, 0]} 
        intensity={2.5} 
        color="#fffaf0" 
        distance={25}
        decay={1}
      />
      <pointLight position={[-3, 4, -3]} intensity={1.2} color="#fff5e6" distance={12} />
      <pointLight position={[3, 4, -3]} intensity={1.2} color="#fff5e6" distance={12} />
      <pointLight position={[0, 4, 3]} intensity={0.8} color="#fff5e6" distance={10} />

      {/* Floor - light wood */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial 
          color="#8b7355" 
          roughness={0.5} 
          metalness={0.05}
        />
      </mesh>

      {/* Walls - NO texture tint, full brightness */}
      {/* Front Wall */}
      <mesh position={[0, 2.5, -6]}>
        <boxGeometry args={[14, 5, 0.3]} />
        <meshStandardMaterial map={brickTexture} color="#ffffff" />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, 2.5, 6]}>
        <boxGeometry args={[14, 5, 0.3]} />
        <meshStandardMaterial map={brickTexture} color="#ffffff" />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-7, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[12, 5, 0.3]} />
        <meshStandardMaterial map={brickTexture} color="#ffffff" />
      </mesh>

      {/* Right Wall */}
      <mesh position={[7, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[12, 5, 0.3]} />
        <meshStandardMaterial map={brickTexture} color="#ffffff" />
      </mesh>

      {/* Ceiling - cream color */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#d4c4a8" roughness={0.9} />
      </mesh>
      
      {/* Ceiling light fixture */}
      <mesh position={[0, 4.9, 0]}>
        <cylinderGeometry args={[0.8, 1, 0.15, 16]} />
        <meshStandardMaterial color="#2a2015" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 4.75, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color="#fff5e6" 
          emissive="#fff5e6" 
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Product Frames on walls */}
      {FRAME_SPOTS.map(config => (
        <OrnateFrame
          key={config.slot}
          config={config}
          item={items[config.slot]}
          accent={accent}
          primary={primary}
          isSelected={selectedSlot === config.slot}
          onSelect={onSelectItem}
        />
      ))}

      {/* Shop name on front wall */}
      <Text
        position={[0, 4.2, -5.7]}
        fontSize={0.45}
        color="#c9a227"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#1a0f0a"
      >
        {shop.shopName || "Gallery"}
      </Text>

      {/* ═══════════════════════════════════════════════════════════════
          MUSTACHIO-STYLE WALL INSTRUCTION PANEL - Elegant ornate design
          ═══════════════════════════════════════════════════════════════ */}
      <group position={[-6.65, 2.5, -2.5]} rotation={[0, Math.PI / 2, 0]}>
        {/* Outer ornate gold frame */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3.2, 2.2, 0.08]} />
          <meshStandardMaterial 
            color="#d4af37" 
            metalness={0.8} 
            roughness={0.2}
          />
        </mesh>
        
        {/* Inner frame border - darker gold */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[2.9, 1.9, 0.06]} />
          <meshStandardMaterial 
            color="#8b6914" 
            metalness={0.7} 
            roughness={0.3}
          />
        </mesh>
        
        {/* Velvet background - deep burgundy/maroon */}
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[2.7, 1.7]} />
          <meshStandardMaterial 
            color={isMissionMode ? "#1a2a1a" : "#2a1515"} 
            roughness={0.95}
          />
        </mesh>
        
        {/* Corner flourishes - ornate gold spheres */}
        {[[-1.35, 0.85], [1.35, 0.85], [-1.35, -0.85], [1.35, -0.85]].map(([x, y], i) => (
          <group key={i} position={[x, y, 0.05]}>
            <mesh>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Small decorative dots around corner */}
            {[0, Math.PI/2, Math.PI, -Math.PI/2].map((angle, j) => (
              <mesh key={j} position={[Math.cos(angle) * 0.18, Math.sin(angle) * 0.18, 0]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.2} />
              </mesh>
            ))}
          </group>
        ))}
        
        {/* Top center crown decoration */}
        <mesh position={[0, 0.95, 0.06]}>
          <boxGeometry args={[0.6, 0.15, 0.04]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 1.05, 0.06]}>
          <coneGeometry args={[0.12, 0.2, 4]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Bottom center scroll decoration */}
        <mesh position={[0, -0.95, 0.06]}>
          <boxGeometry args={[0.8, 0.1, 0.04]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Side decorative bars */}
        <mesh position={[-1.4, 0, 0.05]}>
          <boxGeometry args={[0.06, 1.2, 0.04]} />
          <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[1.4, 0, 0.05]}>
          <boxGeometry args={[0.06, 1.2, 0.04]} />
          <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Beautiful HTML content */}
        <Html
          transform
          position={[0, 0, 0.08]}
          distanceFactor={5}
          className="pointer-events-none select-none"
        >
          <div 
            className="w-[280px] text-center px-5 py-4"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}
          >
            {isMissionMode ? (
              <>
                {/* Mission Mode - Target Shop Message */}
                <div className="text-amber-400 font-bold text-lg mb-3 tracking-wide" style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.5)' }}>
                  🎯 TARGET SHOP 🎯
                </div>
                <div className="text-emerald-400 text-base font-semibold mb-4" style={{ textShadow: '0 0 8px rgba(52, 211, 153, 0.4)' }}>
                  You made it!
                </div>
                <div className="bg-black/40 rounded-lg px-4 py-3 border border-amber-500/30">
                  <p className="text-white text-sm leading-relaxed">
                    Press <span className="text-amber-300 font-bold">EXIT</span> button
                  </p>
                  <p className="text-amber-200 text-sm mt-1">
                    to answer questions
                  </p>
                </div>
                <div className="mt-3 text-amber-400/80 text-xs animate-pulse">
                  ▲ Click EXIT at top right ▲
                </div>
              </>
            ) : (
              <>
                {/* Explore Mode Instructions */}
                <div className="text-amber-400 font-bold text-base mb-3 tracking-wide" style={{ textShadow: '0 0 8px rgba(251, 191, 36, 0.4)' }}>
                  ✨ WELCOME ✨
                </div>
                <div className="space-y-2.5 text-white/90">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <span className="text-xl">👀</span>
                    <span>Drag to look around</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <span className="text-xl">👆</span>
                    <span>Tap frames for products</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <span className="text-xl">🌐</span>
                    <span>Visit shop website</span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-amber-500/30">
                  <p className="text-amber-300 text-sm">
                    Click <span className="font-bold">EXIT</span> when done
                  </p>
                </div>
              </>
            )}
          </div>
        </Html>
        
        {/* Subtle spotlight on the panel */}
        <pointLight 
          position={[0, 0, 1]} 
          intensity={0.5} 
          color="#fff5e6" 
          distance={3}
          decay={2}
        />
      </group>
    </group>
  );
};

const ROOM_BOUNDS = {
  x: 6.2,
  z: 5.2,
  yMin: 1.1,
  yMax: 4.7,
} as const;

function RoomCameraClamp({
  controlsRef,
}: {
  controlsRef: React.MutableRefObject<any>;
}) {
  const { camera } = useThree();

  useFrame(() => {
    const p = camera.position;

    p.x = THREE.MathUtils.clamp(p.x, -ROOM_BOUNDS.x, ROOM_BOUNDS.x);
    p.z = THREE.MathUtils.clamp(p.z, -ROOM_BOUNDS.z, ROOM_BOUNDS.z);
    p.y = THREE.MathUtils.clamp(p.y, ROOM_BOUNDS.yMin, ROOM_BOUNDS.yMax);

    const controls = controlsRef.current;
    if (controls?.target) {
      controls.target.x = THREE.MathUtils.clamp(controls.target.x, -2, 2);
      controls.target.z = THREE.MathUtils.clamp(controls.target.z, -2, 2);
      controls.target.y = THREE.MathUtils.clamp(controls.target.y, 1.6, 2.6);
      controls.update?.();
    }
  });

  return null;
}

const ShopInteriorRoom = ({ shop, onExit, isMissionMode = false }: ShopInteriorRoomProps) => {
  const { data: items = [], isLoading } = useShopItems(shop.shopId);
  const controlsRef = useRef<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const wallItems = useMemo(() => {
    const filled = Array.from({ length: 5 }, () => undefined as ShopItem | undefined);
    items.forEach(item => {
      if (item.slot_index >= 0 && item.slot_index < filled.length) {
        filled[item.slot_index] = item;
      }
    });
    return filled;
  }, [items]);

  const accent = shop.accentColor || "#10B981";
  const primary = shop.primaryColor || "#3B82F6";
  const selectedItem = selectedSlot !== null ? wallItems[selectedSlot] : undefined;
  const filledSlots = wallItems.filter(Boolean);
  
  const handleFrameClick = (slot: number) => {
    const item = wallItems[slot];
    if (item) {
      setSelectedSlot(slot);
      setIsModalOpen(true);
    }
  };

  const navigateItem = (direction: 'prev' | 'next') => {
    const filledIndices = wallItems.map((item, i) => item ? i : -1).filter(i => i !== -1);
    if (filledIndices.length === 0) return;
    
    if (selectedSlot === null) {
      setSelectedSlot(filledIndices[0]);
      return;
    }
    
    const currentIndex = filledIndices.indexOf(selectedSlot);
    if (direction === 'next') {
      setSelectedSlot(filledIndices[(currentIndex + 1) % filledIndices.length]);
    } else {
      setSelectedSlot(filledIndices[(currentIndex - 1 + filledIndices.length) % filledIndices.length]);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-background flex flex-col">
      {/* Header - compact for mobile landscape */}
      <div className="absolute top-0 left-0 right-0 z-20 px-3 py-1.5 sm:p-4 landscape:py-1 flex items-center justify-between bg-gradient-to-b from-background via-background/90 to-transparent">
        <div className="flex items-center gap-2 min-w-0">
          {shop.logoUrl && (
            <img 
              src={shop.logoUrl} 
              alt={shop.shopName}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-contain bg-muted/50 p-0.5 shrink-0"
            />
          )}
          <div className="min-w-0">
            <h1 className="font-display font-bold text-sm sm:text-lg text-foreground truncate">
              {shop.shopName || "Gallery"}
            </h1>
            {shop.category && (
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{shop.category}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {shop.externalLink && (
            <Button size="sm" variant="outline" className="h-8 px-2 sm:px-3" asChild>
              <a href={shop.externalLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline text-xs">Visit</span>
              </a>
            </Button>
          )}
          <Button size="sm" variant="secondary" className="h-8 px-2 sm:px-3" onClick={onExit}>
            <X className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline text-xs">Exit</span>
          </Button>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas 
        camera={{ position: [0, 2.2, 4.2], fov: 65 }} 
        className="flex-1 touch-none"
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#e8dcc8"]} />
        <fog attach="fog" args={["#e8dcc8", 15, 30]} />
        <React.Suspense fallback={null}>
          <InteriorScene 
            shop={shop} 
            items={wallItems} 
            selectedSlot={selectedSlot}
            onSelectItem={handleFrameClick}
            isMissionMode={isMissionMode}
          />
        </React.Suspense>

        <RoomCameraClamp controlsRef={controlsRef} />

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          maxDistance={4.5}
          minDistance={1.6}
          target={[0, 2, 0]}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={Math.PI / 5}
          rotateSpeed={0.5}
        />
      </Canvas>

      {/* Bottom hint panel */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-2 sm:p-4 landscape:p-1.5 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-xl mx-auto">
          {isLoading ? (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground">Loading...</p>
            </div>
          ) : filledSlots.length > 0 ? (
            <div className="text-center py-3 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50">
              <Package className="h-5 w-5 mx-auto mb-1.5" style={{ color: primary }} />
              <p className="text-xs text-foreground font-medium">Tap any frame to see details</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {filledSlots.length} item{filledSlots.length !== 1 ? 's' : ''} on display
              </p>
            </div>
          ) : (
            <div className="text-center py-3 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50">
              <Package className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">No items on display yet</p>
            </div>
          )}
          
          {/* Controls hint */}
          <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-muted-foreground/70">
            <span>Drag to look</span>
            <span>•</span>
            <span>Pinch to zoom</span>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden max-h-[90vh]">
          {selectedItem && (
            <>
              {/* Large Product Image */}
              <div className="relative w-full aspect-[4/3] bg-muted">
                {selectedItem.image_url ? (
                  <img 
                    src={selectedItem.image_url} 
                    alt={selectedItem.title}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div 
                    className="h-full w-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${primary}30, ${accent}20)` }}
                  >
                    <Package className="h-16 w-16 text-muted-foreground/40" />
                  </div>
                )}
                
                {/* Price badge */}
                {selectedItem.price != null && (
                  <div 
                    className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-sm font-bold text-white shadow-lg"
                    style={{ backgroundColor: accent }}
                  >
                    ${Number(selectedItem.price).toFixed(2)}
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="p-4 space-y-3">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">
                    {selectedItem.title}
                  </DialogTitle>
                  {selectedItem.description && (
                    <DialogDescription className="text-sm text-muted-foreground pt-1">
                      {selectedItem.description}
                    </DialogDescription>
                  )}
                </DialogHeader>
                
                {/* Navigation between items */}
                {filledSlots.length > 1 && (
                  <div className="flex items-center justify-between py-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      Item {filledSlots.indexOf(selectedItem) + 1} of {filledSlots.length}
                    </span>
                    <div className="flex gap-1">
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-8 w-8"
                        onClick={() => navigateItem('prev')}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-8 w-8"
                        onClick={() => navigateItem('next')}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  {shop.externalLink && (
                    <Button 
                      className="flex-1 text-white" 
                      style={{ backgroundColor: accent }} 
                      asChild
                    >
                      <a href={shop.externalLink} target="_blank" rel="noopener noreferrer">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Buy Now
                      </a>
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className={shop.externalLink ? "" : "flex-1"}
                    onClick={() => setIsModalOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopInteriorRoom;
