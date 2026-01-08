import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { ShopBranding } from "@/hooks/use3DShops";
import { Button } from "@/components/ui/button";
import { ShopItem, useShopItems } from "@/hooks/useShopItems";
import { X, ExternalLink, ChevronLeft, ChevronRight, Package } from "lucide-react";

interface ShopInteriorRoomProps {
  shop: ShopBranding;
  onExit: () => void;
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

  // Warm brick base - brighter
  ctx.fillStyle = "#4a3025";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const brickWidth = 64;
  const brickHeight = 28;
  const mortar = 3;

  for (let y = 0; y < canvas.height + brickHeight; y += brickHeight) {
    for (let x = -brickWidth; x < canvas.width + brickWidth; x += brickWidth) {
      const offset = Math.floor(y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
      
      // Brick variations - brighter reds
      const shade = 0.85 + Math.random() * 0.3;
      const r = Math.floor(90 * shade);
      const g = Math.floor(55 * shade);
      const b = Math.floor(40 * shade);
      
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x + offset + mortar, y + mortar, brickWidth - mortar * 2, brickHeight - mortar * 2);
      
      // Subtle highlight
      ctx.fillStyle = `rgba(255, 220, 180, 0.08)`;
      ctx.fillRect(x + offset + mortar, y + mortar, brickWidth - mortar * 2, 2);
    }
  }

  // Mortar color - warmer
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = "#2a1f18";
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
            width: '170px',
            height: '115px',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: isSelected ? `0 0 20px ${accent}50` : 'none',
          }}
        >
          {hasItem && item ? (
            <div className="relative h-full w-full bg-card/95 backdrop-blur-sm border border-border/30 overflow-hidden">
              {/* Product image */}
              <div className="relative h-[70px] w-full overflow-hidden bg-muted">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.title} 
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
                  />
                ) : (
                  <div 
                    className="h-full w-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${primary}30, ${accent}20)` }}
                  >
                    <Package className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                )}
                
                {/* Price badge */}
                {item.price != null && (
                  <div 
                    className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow"
                    style={{ backgroundColor: accent }}
                  >
                    ${Number(item.price).toFixed(2)}
                  </div>
                )}
              </div>
              
              {/* Product title */}
              <div className="p-1.5 bg-background/80">
                <p className="text-[11px] font-medium text-foreground truncate">{item.title}</p>
                <p className="text-[9px] text-muted-foreground">Tap to view</p>
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
}: {
  shop: ShopBranding;
  items: (ShopItem | undefined)[];
  selectedSlot: number | null;
  onSelectItem: (slot: number) => void;
}) => {
  const brickTexture = useBrickTexture();
  const accent = shop.accentColor || "#10B981";
  const primary = shop.primaryColor || "#3B82F6";

  return (
    <group>
      {/* Brighter ambient lighting */}
      <ambientLight intensity={0.6} color="#fff8f0" />
      <hemisphereLight args={["#fffaf5", "#8b7355", 0.7]} position={[0, 5, 0]} />
      
      {/* Main ceiling light - brighter */}
      <pointLight 
        position={[0, 4.5, 0]} 
        intensity={1.8} 
        color="#fff5e6" 
        distance={20}
        decay={1.5}
      />
      
      {/* Corner accent lights for depth */}
      <pointLight position={[-5, 4, -4]} intensity={0.4} color="#ffd7a8" distance={8} />
      <pointLight position={[5, 4, -4]} intensity={0.4} color="#ffd7a8" distance={8} />

      {/* Floor - warmer wood tone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial 
          color="#3a3530" 
          roughness={0.4} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Subtle floor reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[13.5, 13.5]} />
        <meshStandardMaterial 
          color="#4a4540" 
          roughness={0.6}
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Walls with brick texture - brighter colors */}
      {/* Front Wall */}
      <mesh position={[0, 2.5, -6]}>
        <boxGeometry args={[14, 5, 0.3]} />
        <meshStandardMaterial map={brickTexture} color="#5a4035" />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, 2.5, 6]}>
        <boxGeometry args={[14, 5, 0.3]} />
        <meshStandardMaterial map={brickTexture} color="#4a3830" />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-7, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[12, 5, 0.3]} />
        <meshStandardMaterial map={brickTexture} color="#5a4035" />
      </mesh>

      {/* Right Wall */}
      <mesh position={[7, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[12, 5, 0.3]} />
        <meshStandardMaterial map={brickTexture} color="#5a4035" />
      </mesh>

      {/* Ceiling - visible dark wood */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#2a2520" roughness={0.95} />
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
    </group>
  );
};

const ShopInteriorRoom = ({ shop, onExit }: ShopInteriorRoomProps) => {
  const { data: items = [], isLoading } = useShopItems(shop.shopId);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

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
        camera={{ position: [0, 2.2, 3.5], fov: 65 }} 
        className="flex-1 touch-none"
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#1a1512"]} />
        <fog attach="fog" args={["#1a1512", 12, 25]} />
        <React.Suspense fallback={null}>
          <InteriorScene 
            shop={shop} 
            items={wallItems} 
            selectedSlot={selectedSlot}
            onSelectItem={setSelectedSlot} 
          />
        </React.Suspense>
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          maxDistance={5}
          minDistance={1.5}
          target={[0, 2, -2]}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 5}
          rotateSpeed={0.5}
        />
      </Canvas>

      {/* Bottom Panel - Mobile landscape friendly */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-2 sm:p-4 landscape:p-1.5 max-h-[35vh] landscape:max-h-[40vh] bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-xl mx-auto">
          {isLoading ? (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground">Loading...</p>
            </div>
          ) : selectedItem ? (
            <div 
              className="rounded-xl border bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden"
              style={{ borderColor: `${accent}30` }}
            >
              <div className="flex items-stretch">
                {/* Image */}
                {selectedItem.image_url && (
                  <div className="w-20 sm:w-28 shrink-0 bg-muted">
                    <img 
                      src={selectedItem.image_url} 
                      alt={selectedItem.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                
                {/* Info */}
                <div className="flex-1 p-2 sm:p-3 flex flex-col justify-between min-w-0">
                  <div className="space-y-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                        {selectedItem.title}
                      </h3>
                      {selectedItem.price != null && (
                        <span 
                          className="shrink-0 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: accent }}
                        >
                          ${Number(selectedItem.price).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {selectedItem.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {selectedItem.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Navigation */}
                  {filledSlots.length > 1 && (
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/30">
                      <span className="text-[10px] text-muted-foreground">
                        {filledSlots.indexOf(selectedItem) + 1}/{filledSlots.length}
                      </span>
                      <div className="flex gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7"
                          onClick={() => navigateItem('prev')}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7"
                          onClick={() => navigateItem('next')}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
          
          {/* Controls hint - compact for mobile */}
          <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-muted-foreground/70">
            <span>Drag to look</span>
            <span>•</span>
            <span>Pinch to zoom</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopInteriorRoom;
