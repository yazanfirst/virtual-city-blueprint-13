import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { ShopBranding } from "@/hooks/use3DShops";
import { Button } from "@/components/ui/button";
import { ShopItem, useShopItems } from "@/hooks/useShopItems";
import { X, ExternalLink, ChevronLeft, ChevronRight, Package, ShoppingBag } from "lucide-react";
import { useGhostHuntStore } from "@/stores/ghostHuntStore";
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
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(config.slot);
          }}
          className="group transition-transform duration-200 hover:scale-[1.02] focus:outline-none touch-manipulation select-none"
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
  showRechargePickup,
  onCollectRecharge,
}: {
  shop: ShopBranding;
  items: (ShopItem | undefined)[];
  selectedSlot: number | null;
  onSelectItem: (slot: number) => void;
  isMissionMode?: boolean;
  showRechargePickup: boolean;
  onCollectRecharge: () => void;
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
          WHITE CANVAS BOARD - Leaning against wall like reference image
          Simple, clean, white background with bold black text
          ═══════════════════════════════════════════════════════════════ */}
      <group 
        position={[-5.2, 1.4, -5.3]} 
        rotation={[-0.08, 0.15, 0]}
      >
        {/* White canvas board */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.8, 2.4, 0.06]} />
          <meshStandardMaterial color="#ffffff" roughness={0.15} />
        </mesh>
        
        {/* Thin shadow/edge effect */}
        <mesh position={[0.03, -0.03, -0.02]}>
          <boxGeometry args={[1.82, 2.42, 0.04]} />
          <meshStandardMaterial color="#888888" roughness={0.8} />
        </mesh>

        {/* Text content using Html */}
        <Html
          transform
          position={[0, 0, 0.04]}
          distanceFactor={4.5}
          className="pointer-events-none select-none"
        >
          <div
            className="w-[180px] text-left px-4 py-5"
            style={{ 
              fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
              backgroundColor: 'white',
              borderRadius: '2px',
            }}
          >
            {isMissionMode ? (
              <div className="space-y-2">
                <p className="text-black font-black text-lg leading-tight tracking-tight uppercase">
                  TARGET
                </p>
                <p className="text-black font-black text-lg leading-tight tracking-tight uppercase">
                  SHOP!
                </p>
                <p className="text-black font-black text-base leading-tight tracking-tight uppercase mt-3">
                  PRESS
                </p>
                <p className="text-black font-black text-base leading-tight tracking-tight uppercase">
                  EXIT
                </p>
                <p className="text-black font-black text-base leading-tight tracking-tight uppercase">
                  TO ANSWER
                </p>
                <p className="text-black font-black text-base leading-tight tracking-tight uppercase">
                  QUESTIONS.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-black font-black text-sm leading-tight tracking-tight uppercase">
                  DRAG TO LOOK AROUND
                </p>
                <p className="text-black font-black text-sm leading-tight tracking-tight uppercase">
                  TAP FRAMES TO VIEW PRODUCTS
                </p>
                <p className="text-black font-black text-sm leading-tight tracking-tight uppercase">
                  PRESS VISIT (TOP RIGHT) TO GO TO THE WEBSITE OF THIS SHOP OR
                </p>
                <p className="text-black font-black text-sm leading-tight tracking-tight uppercase">
                  PRESS EXIT TO LEAVE THE SHOP
                </p>
              </div>
            )}
          </div>
        </Html>

        {/* Subtle light on the canvas */}
        <pointLight
          position={[0, 0.5, 1.5]}
          intensity={0.6}
          color="#ffffff"
          distance={4}
          decay={2}
        />
      </group>

      {showRechargePickup && (
        <group position={[3.6, 0.6, 2.8]}>
          <mesh
            onPointerDown={(event) => {
              event.stopPropagation();
              onCollectRecharge();
            }}
          >
            <cylinderGeometry args={[0.25, 0.25, 0.5, 16]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
          </mesh>
          <Html
            transform
            position={[0, 0.9, 0]}
            distanceFactor={6}
            className="pointer-events-auto"
          >
            <button
              type="button"
              onPointerDown={(event) => {
                event.stopPropagation();
                onCollectRecharge();
              }}
              className="px-2 py-1 rounded-md bg-black/70 text-white text-[10px] uppercase tracking-wide border border-white/30"
            >
              Recharge Kit
            </button>
          </Html>
          <pointLight position={[0, 0.4, 0]} intensity={0.8} distance={3} color={accent} />
        </group>
      )}
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
  const {
    isActive: ghostHuntActive,
    rechargeShopId,
    rechargeCollected,
    collectRechargePickup,
  } = useGhostHuntStore();
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

  const showRechargePickup =
    ghostHuntActive && !rechargeCollected && Boolean(shop.shopId && shop.shopId === rechargeShopId);

  const handleCollectRecharge = () => {
    if (!showRechargePickup) return;
    collectRechargePickup();
    console.debug('[GhostHunt] Recharge pickup collected in shop:', shop.shopId);
  };
  
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
            <a 
              href={shop.externalLink} 
              target="_blank" 
              rel="noopener noreferrer"
              onPointerDown={(e) => e.stopPropagation()}
              className="h-10 px-3 sm:px-4 rounded-md flex items-center justify-center gap-1.5 bg-transparent border border-border text-foreground font-medium touch-manipulation select-none active:scale-95 transition-all hover:bg-accent"
              data-control-ignore="true"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Visit</span>
            </a>
          )}
          <button 
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onExit();
            }}
            className="h-10 px-3 sm:px-4 rounded-md flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground font-medium touch-manipulation select-none active:scale-95 transition-all hover:bg-secondary/80"
            data-control-ignore="true"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Exit</span>
          </button>
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
            showRechargePickup={showRechargePickup}
            onCollectRecharge={handleCollectRecharge}
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
                      <button 
                        type="button"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          navigateItem('prev');
                        }}
                        className="h-10 w-10 rounded-md flex items-center justify-center bg-transparent border border-border text-foreground touch-manipulation select-none active:scale-95 transition-all hover:bg-accent"
                        data-control-ignore="true"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button 
                        type="button"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          navigateItem('next');
                        }}
                        className="h-10 w-10 rounded-md flex items-center justify-center bg-transparent border border-border text-foreground touch-manipulation select-none active:scale-95 transition-all hover:bg-accent"
                        data-control-ignore="true"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  {shop.externalLink && (
                    <a 
                      href={shop.externalLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onPointerDown={(e) => e.stopPropagation()}
                      className="flex-1 h-11 rounded-md flex items-center justify-center gap-2 text-white font-medium touch-manipulation select-none active:scale-[0.98] transition-all"
                      style={{ backgroundColor: accent }}
                      data-control-ignore="true"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Buy Now
                    </a>
                  )}
                  <button 
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setIsModalOpen(false);
                    }}
                    className={`h-11 rounded-md flex items-center justify-center px-4 bg-transparent border border-border text-foreground font-medium touch-manipulation select-none active:scale-[0.98] transition-all hover:bg-accent ${shop.externalLink ? "" : "flex-1"}`}
                    data-control-ignore="true"
                  >
                    Close
                  </button>
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
