import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { ShopBranding } from "@/hooks/use3DShops";
import { Button } from "@/components/ui/button";
import { ShopItem, useShopItems } from "@/hooks/useShopItems";
import { X, ExternalLink, ChevronLeft, ChevronRight, Package, ShoppingBag, Star } from "lucide-react";
import ShopOffersSection from "@/components/3d/ShopOffersSection";
import { useGhostHuntStore } from "@/stores/ghostHuntStore";
import { trackLinkClick } from "@/hooks/useTrackLinkClick";
import { useShopRating, useRateShop } from "@/hooks/useShopRatings";
import { useAuth } from "@/hooks/useAuth";
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

interface RechargeTypesInShop {
  emf: boolean;
  flashlight: boolean;
  trap: boolean;
}

interface RechargePickupsProps {
  rechargeTypesInShop: RechargeTypesInShop;
  rechargeCollected: { emf: boolean; flashlight: boolean; trap: boolean };
  onCollectRecharge: (type: 'emf' | 'flashlight' | 'trap') => void;
}

// Recharge pickup devices rendered inside shops
const RechargePickups = ({ rechargeTypesInShop, rechargeCollected, onCollectRecharge }: RechargePickupsProps) => {
  const devices = [
    { type: 'emf' as const, label: 'EMF Cell', position: [3.2, 0.6, 2.8] as [number, number, number], color: '#10b981' },
    { type: 'flashlight' as const, label: 'Flash Battery', position: [3.9, 0.6, 2.55] as [number, number, number], color: '#fbbf24' },
    { type: 'trap' as const, label: 'Trap Charge', position: [3.5, 0.6, 2.25] as [number, number, number], color: '#8b5cf6' },
  ];

  return (
    <group>
      {devices.map((device) => {
        // Only show if this shop has this type AND not already collected
        if (!rechargeTypesInShop[device.type]) return null;
        if (rechargeCollected[device.type]) return null;
        return (
          <group key={device.type} position={device.position}>
            <mesh
              onPointerDown={(event) => {
                event.stopPropagation();
                onCollectRecharge(device.type);
              }}
            >
              <cylinderGeometry args={[0.22, 0.22, 0.45, 16]} />
              <meshStandardMaterial color={device.color} emissive={device.color} emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[0, 0.35, 0]}>
              <sphereGeometry args={[0.16, 12, 12]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
            </mesh>
            <Html
              transform
              position={[0, 0.85, 0]}
              distanceFactor={6}
              className="pointer-events-auto"
            >
              <button
                type="button"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  onCollectRecharge(device.type);
                }}
                className="px-2 py-1 rounded-md bg-black/70 text-white text-[10px] uppercase tracking-wide border border-white/30"
              >
                {device.label}
              </button>
            </Html>
            <pointLight position={[0, 0.35, 0]} intensity={0.8} distance={3} color={device.color} />
          </group>
        );
      })}
    </group>
  );
};

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
  rechargeTypesInShop,
  rechargeCollected,
  onCollectRecharge,
  onSceneReady,
}: {
  shop: ShopBranding;
  items: (ShopItem | undefined)[];
  selectedSlot: number | null;
  onSelectItem: (slot: number) => void;
  isMissionMode?: boolean;
  showRechargePickup: boolean;
  rechargeTypesInShop: RechargeTypesInShop;
  rechargeCollected: { emf: boolean; flashlight: boolean; trap: boolean };
  onCollectRecharge: (type: 'emf' | 'flashlight' | 'trap') => void;
  onSceneReady: () => void;
}) => {
  const brickTexture = useBrickTexture();
  const accent = shop.accentColor || "#10B981";
  const primary = shop.primaryColor || "#3B82F6";

  const hasRenderedRef = useRef(false);

  useFrame(() => {
    if (!hasRenderedRef.current) {
      hasRenderedRef.current = true;
      onSceneReady();
    }
  });

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
        <RechargePickups
          rechargeTypesInShop={rechargeTypesInShop}
          rechargeCollected={rechargeCollected}
          onCollectRecharge={onCollectRecharge}
        />
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
  const { user } = useAuth();
  const { data: ratingData } = useShopRating(shop.shopId);
  const rateShop = useRateShop();
  const {
    isActive: ghostHuntActive,
    rechargeShopIds,
    rechargeCollected,
    collectRechargePickup,
  } = useGhostHuntStore();
  const controlsRef = useRef<any>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [forceFallback, setForceFallback] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [retryNonce, setRetryNonce] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

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

  // Check which recharge types are available in THIS shop
  const rechargeTypesInShop = {
    emf: ghostHuntActive && shop.shopId === rechargeShopIds.emf,
    flashlight: ghostHuntActive && shop.shopId === rechargeShopIds.flashlight,
    trap: ghostHuntActive && shop.shopId === rechargeShopIds.trap,
  };
  const showRechargePickup = rechargeTypesInShop.emf || rechargeTypesInShop.flashlight || rechargeTypesInShop.trap;

  useEffect(() => {
    setCanvasReady(false);
    setSceneReady(false);
    setShowFallback(false);
    setForceFallback(false);
    setRetryNonce(0);
  }, [shop.shopId]);

  useEffect(() => {
    if (showRechargePickup) {
      setForceFallback(true);
    }
  }, [showRechargePickup]);

  useEffect(() => {
    const testCanvas = document.createElement('canvas');
    const gl =
      testCanvas.getContext('webgl2') ||
      testCanvas.getContext('webgl') ||
      testCanvas.getContext('experimental-webgl');
    const supported = Boolean(gl);
    setWebglSupported(supported);
    if (!supported) {
      setShowFallback(true);
    }
  }, []);

  useEffect(() => {
    if (showFallback || !webglSupported) return;
    const timeout = setTimeout(() => {
      if (!sceneReady) {
        setShowFallback(true);
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [sceneReady, showFallback, webglSupported]);

  const isFallbackActive = showFallback || forceFallback;
  const canRetry3d = showFallback && webglSupported;

  const handleCollectRecharge = (type: 'emf' | 'flashlight' | 'trap') => {
    if (!showRechargePickup || rechargeCollected[type]) return;
    collectRechargePickup(type);
    console.debug('[GhostHunt] Recharge pickup collected in shop:', shop.shopId, type);
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
      {/* Header - ultra compact for mobile landscape */}
      <div className="absolute top-0 left-0 right-0 z-20 px-2 py-1 sm:px-3 sm:py-1.5 lg:p-4 flex items-center justify-between bg-gradient-to-b from-background via-background/90 to-transparent safe-area-top">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {shop.logoUrl && (
            <img 
              src={shop.logoUrl} 
              alt={shop.shopName}
              className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 rounded-lg object-contain bg-muted/50 p-0.5 shrink-0"
            />
          )}
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xs sm:text-sm lg:text-lg text-foreground truncate max-w-[120px] sm:max-w-[200px] lg:max-w-none">
              {shop.shopName || "Gallery"}
            </h1>
            {shop.category && (
              <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground truncate hidden sm:block">{shop.category}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0">
          <button
            type="button"
            onPointerDown={(event) => {
              event.stopPropagation();
              if (canRetry3d) {
                setCanvasReady(false);
                setSceneReady(false);
                setShowFallback(false);
                setForceFallback(false);
                setRetryNonce((prev) => prev + 1);
                return;
              }
              if (!showFallback) {
                setForceFallback((prev) => !prev);
              }
            }}
            className="h-8 sm:h-9 lg:h-10 px-2 sm:px-3 lg:px-4 rounded-md flex items-center justify-center gap-1 text-xs bg-transparent border border-border text-foreground font-medium touch-manipulation select-none active:scale-95 transition-all hover:bg-accent"
            data-control-ignore="true"
          >
            {canRetry3d ? 'Retry 3D' : isFallbackActive ? '3D View' : '2D View'}
          </button>
          {shop.externalLink && (
            <a 
              href={shop.externalLink} 
              target="_blank" 
              rel="noopener noreferrer"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => trackLinkClick(shop.shopId)}
              className="h-8 sm:h-9 lg:h-10 px-2 sm:px-3 lg:px-4 rounded-md flex items-center justify-center gap-1 text-xs bg-transparent border border-border text-foreground font-medium touch-manipulation select-none active:scale-95 transition-all hover:bg-accent"
              data-control-ignore="true"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Visit</span>
            </a>
          )}
          <button 
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onExit();
            }}
            className="h-8 sm:h-9 lg:h-10 px-2 sm:px-3 lg:px-4 rounded-md flex items-center justify-center gap-1 text-xs bg-secondary text-secondary-foreground font-medium touch-manipulation select-none active:scale-95 transition-all hover:bg-secondary/80"
            data-control-ignore="true"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      {!isFallbackActive ? (
        <Canvas 
          key={`${shop.shopId}-${retryNonce}`}
          camera={{ position: [0, 2.2, 4.2], fov: 65 }} 
          className="flex-1 touch-none"
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={() => {
            requestAnimationFrame(() => setCanvasReady(true));
          }}
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
              rechargeTypesInShop={rechargeTypesInShop}
              rechargeCollected={rechargeCollected}
              onCollectRecharge={handleCollectRecharge}
              onSceneReady={() => setSceneReady(true)}
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
      ) : (
        <div className="flex-1 overflow-auto bg-background px-3 sm:px-4 pt-14 sm:pt-20 pb-6">
          <div className="mx-auto max-w-xl">
            <div className="mb-3 rounded-lg border border-border/60 bg-card/90 px-3 py-2 text-xs text-muted-foreground shadow-lg">
              3D view isn't available right now. Browse the shop items below.
            </div>

            {/* Rating inline for 2D view */}
            {user && !isMissionMode && (
              <div className="flex items-center justify-center gap-1.5 mb-3 py-2 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50">
                <span className="text-[10px] sm:text-xs text-muted-foreground">Rate:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => rateShop.mutate({ shopId: shop.shopId, rating: star })}
                    className="touch-manipulation transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      fill={(hoverRating || ratingData?.userRating || 0) >= star ? '#fbbf24' : 'transparent'}
                      stroke={(hoverRating || ratingData?.userRating || 0) >= star ? '#fbbf24' : '#888'}
                    />
                  </button>
                ))}
                {ratingData && ratingData.totalRatings > 0 && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">
                    {ratingData.averageRating.toFixed(1)} ({ratingData.totalRatings})
                  </span>
                )}
              </div>
            )}

            {filledSlots.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filledSlots.map((item) => (
                  <button
                    key={item?.id ?? item?.title}
                    type="button"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      if (!item) return;
                      const slotIndex = wallItems.findIndex((slot) => slot?.id === item.id);
                      if (slotIndex >= 0) {
                        handleFrameClick(slotIndex);
                      }
                    }}
                    className="rounded-lg border border-border/60 bg-card/80 p-2 text-left text-[10px] text-muted-foreground shadow-sm hover:bg-card"
                  >
                    <div className="mb-2 aspect-[4/3] w-full overflow-hidden rounded-md bg-muted/40 flex items-center justify-center">
                      {item?.image_url ? (
                        <img src={item.image_url} alt={item.title} className="h-full w-full object-contain" />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="font-medium text-foreground truncate">{item?.title ?? 'Item'}</div>
                    {item?.price != null && (
                      <div className="text-[10px] text-primary">${Number(item.price).toFixed(2)}</div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border/60 bg-card/80 p-6 text-center text-xs text-muted-foreground">
                No items on display yet.
              </div>
            )}

            {/* Offers section in 2D fallback */}
            <div className="mt-4">
              <ShopOffersSection shopId={shop.shopId} externalLink={shop.externalLink} />
            </div>

            {/* Exit button inline */}
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  onExit();
                }}
                className="h-10 px-4 rounded-md flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-medium touch-manipulation select-none active:scale-95 transition-all hover:bg-secondary/80"
                data-control-ignore="true"
              >
                <X className="h-4 w-4" />
                Exit Shop
              </button>
            </div>
          </div>
        </div>
      )}

      {(!isFallbackActive && (!canvasReady || !sceneReady)) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90">
          <div className="rounded-lg border border-border/60 bg-card/90 px-4 py-3 text-center text-xs text-muted-foreground shadow-lg">
            Loading shop interior...
          </div>
        </div>
      )}

      {/* Floating exit button - only for 3D fallback when NOT already inline */}

      {/* Bottom hint panel with rating - only for 3D view, hidden in 2D fallback */}
      {!isFallbackActive && (
      <div className="absolute bottom-0 left-0 right-0 z-20 p-1.5 sm:p-2 lg:p-4 bg-gradient-to-t from-background via-background/95 to-transparent safe-area-bottom">
        <div className="max-w-xl mx-auto">
          {/* Star Rating - inline on landscape */}
          {user && !isMissionMode && (
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 py-1 sm:py-2 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50">
              <span className="text-[10px] sm:text-xs text-muted-foreground">Rate:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => rateShop.mutate({ shopId: shop.shopId, rating: star })}
                  className="touch-manipulation transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    fill={(hoverRating || ratingData?.userRating || 0) >= star ? '#fbbf24' : 'transparent'}
                    stroke={(hoverRating || ratingData?.userRating || 0) >= star ? '#fbbf24' : '#888'}
                  />
                </button>
              ))}
              {ratingData && ratingData.totalRatings > 0 && (
                <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">
                  {ratingData.averageRating.toFixed(1)} ({ratingData.totalRatings})
                </span>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Loading...</p>
            </div>
          ) : filledSlots.length > 0 ? (
            <div className="text-center py-1.5 sm:py-3 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50">
              <p className="text-[10px] sm:text-xs text-foreground font-medium">
                Tap any frame to see details · {filledSlots.length} item{filledSlots.length !== 1 ? 's' : ''}
              </p>
            </div>
          ) : (
            <div className="text-center py-1.5 sm:py-3 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50">
              <p className="text-[10px] sm:text-xs text-muted-foreground">No items on display yet</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Product Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden max-h-[85vh] sm:max-h-[90vh] landscape:max-h-[95vh] landscape:max-w-sm landscape:flex landscape:flex-row">
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
                  {(selectedItem.product_url || shop.externalLink) && (
                    <a 
                      href={selectedItem.product_url || shop.externalLink || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => trackLinkClick(shop.shopId)}
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
                    className={`h-11 rounded-md flex items-center justify-center px-4 bg-transparent border border-border text-foreground font-medium touch-manipulation select-none active:scale-[0.98] transition-all hover:bg-accent ${(selectedItem?.product_url || shop.externalLink) ? "" : "flex-1"}`}
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
