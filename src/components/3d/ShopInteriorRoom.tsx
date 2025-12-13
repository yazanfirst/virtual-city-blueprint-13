import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, Text, useTexture, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { ShopBranding } from "@/hooks/use3DShops";
import { Button } from "@/components/ui/button";
import { ShopItem, useShopItems } from "@/hooks/useShopItems";
import { X, ExternalLink, ShoppingBag, ChevronLeft, ChevronRight, Package } from "lucide-react";

interface ShopInteriorRoomProps {
  shop: ShopBranding;
  onExit: () => void;
}

interface FrameSpotConfig {
  slot: number;
  position: [number, number, number];
  rotation?: [number, number, number];
}

const FRAME_SPOTS: FrameSpotConfig[] = [
  { slot: 0, position: [-4.5, 2.4, -5.85] },
  { slot: 1, position: [-2.25, 2.4, -5.85] },
  { slot: 2, position: [0, 2.4, -5.85] },
  { slot: 3, position: [2.25, 2.4, -5.85] },
  { slot: 4, position: [4.5, 2.4, -5.85] },
];

const useBrickTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const brickWidth = 80;
    const brickHeight = 40;
    const mortar = 4;

    for (let y = 0; y < canvas.height; y += brickHeight) {
      for (let x = 0; x < canvas.width + brickWidth; x += brickWidth) {
        const offset = (y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
        ctx.fillStyle = `rgba(255, 255, 255, 0.03)`;
        ctx.fillRect(x + offset, y, brickWidth - mortar, brickHeight - mortar);
        ctx.strokeStyle = "#0f0f1a";
        ctx.lineWidth = mortar / 2;
        ctx.strokeRect(x + offset, y, brickWidth - mortar, brickHeight - mortar);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3.5, 2);
    texture.anisotropy = 8;
    return texture;
  }, []);
};

const GlowingFrame = ({
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
  
  return (
    <group position={config.position} rotation={config.rotation || [0, 0, 0]}>
      {/* Outer glow effect */}
      {hasItem && (
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[2.3, 1.8]} />
          <meshBasicMaterial 
            color={isSelected ? accent : primary} 
            transparent 
            opacity={isSelected ? 0.15 : 0.08} 
          />
        </mesh>
      )}
      
      {/* Frame border */}
      <mesh position={[0, 0, 0.02]} castShadow>
        <boxGeometry args={[2.1, 1.6, 0.06]} />
        <meshStandardMaterial 
          color={hasItem ? (isSelected ? accent : "#1f1f2e") : "#15151f"} 
          metalness={0.7} 
          roughness={0.3} 
        />
      </mesh>
      
      {/* Inner frame */}
      <mesh position={[0, 0, 0.05]} castShadow>
        <boxGeometry args={[1.9, 1.4, 0.04]} />
        <meshStandardMaterial 
          color={hasItem ? primary : "#0a0a12"} 
          metalness={0.5} 
          roughness={0.4}
          emissive={hasItem ? primary : "#000000"}
          emissiveIntensity={isSelected ? 0.15 : 0.05}
        />
      </mesh>
      
      {/* Content area */}
      <mesh position={[0, 0, 0.08]}>
        <planeGeometry args={[1.7, 1.2]} />
        <meshStandardMaterial color="#0c0c14" roughness={0.8} />
      </mesh>
      
      {/* Interactive HTML overlay */}
      <Html
        transform
        position={[0, 0, 0.1]}
        distanceFactor={10}
        occlude
        className="pointer-events-auto"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(config.slot);
          }}
          className={`
            group flex flex-col rounded-lg overflow-hidden transition-all duration-300
            hover:scale-[1.02] focus:outline-none
          `}
          style={{ 
            width: '160px',
            outline: isSelected ? `2px solid ${accent}` : 'none',
            outlineOffset: '2px',
          }}
        >
          {hasItem && item ? (
            <div className="relative bg-background/95 backdrop-blur-sm shadow-xl border border-border/50">
              {/* Product image */}
              <div className="relative h-24 w-full overflow-hidden bg-muted">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.title} 
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" 
                  />
                ) : (
                  <div 
                    className="h-full w-full flex items-center justify-center"
                    style={{ backgroundColor: `${primary}20` }}
                  >
                    <Package className="h-8 w-8" style={{ color: primary, opacity: 0.5 }} />
                  </div>
                )}
                
                {/* Price tag */}
                {item.price !== null && item.price !== undefined && (
                  <div 
                    className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[11px] font-bold text-white shadow-lg"
                    style={{ backgroundColor: accent }}
                  >
                    ${Number(item.price).toFixed(2)}
                  </div>
                )}
              </div>
              
              {/* Product info */}
              <div className="p-2.5 space-y-0.5">
                <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                <p className="text-[10px] text-muted-foreground">Tap for details</p>
              </div>
            </div>
          ) : (
            <div className="bg-background/60 backdrop-blur-sm border border-dashed border-muted-foreground/30 rounded-lg p-4 h-32 flex flex-col items-center justify-center gap-2">
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primary}15` }}
              >
                <Package className="h-5 w-5" style={{ color: primary, opacity: 0.4 }} />
              </div>
              <span className="text-[10px] text-muted-foreground/60">Empty Frame</span>
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
      {/* Ambient lighting */}
      <ambientLight intensity={0.4} color="#ffffff" />
      <hemisphereLight args={["#ffffff", "#1a1a2e", 0.6]} position={[0, 5, 0]} />
      
      {/* Main spotlight on showcase wall */}
      <spotLight
        position={[0, 4.5, 2]}
        intensity={2}
        angle={0.8}
        penumbra={0.5}
        color="#ffffff"
        castShadow
        target-position={[0, 2, -6]}
      />
      
      {/* Accent spotlights */}
      {FRAME_SPOTS.map((spot, i) => (
        <spotLight
          key={i}
          position={[spot.position[0], 4, spot.position[2] + 3]}
          intensity={items[spot.slot] ? 0.8 : 0.3}
          angle={0.4}
          penumbra={0.6}
          color={items[spot.slot] ? primary : "#ffffff"}
          castShadow={false}
        />
      ))}
      
      {/* Brand colored accent lights */}
      <pointLight position={[-5, 1, -4]} intensity={0.6} color={accent} decay={2} />
      <pointLight position={[5, 1, -4]} intensity={0.6} color={accent} decay={2} />
      
      {/* Sparkles effect */}
      <Sparkles
        count={30}
        scale={10}
        size={2}
        speed={0.3}
        opacity={0.3}
        color={primary}
      />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial 
          color="#0a0a12" 
          roughness={0.3} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Floor grid lines */}
      <gridHelper args={[14, 14, primary, `${primary}30`]} position={[0, 0.01, 0]} />

      {/* Back Wall - Showcase wall */}
      <mesh position={[0, 2.5, -6]} receiveShadow>
        <boxGeometry args={[14, 5, 0.2]} />
        <meshStandardMaterial map={brickTexture || undefined} color="#1a1a2e" />
      </mesh>

      {/* Side Walls */}
      <mesh position={[-7, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[12, 5, 0.2]} />
        <meshStandardMaterial map={brickTexture || undefined} color="#151520" />
      </mesh>
      <mesh position={[7, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[12, 5, 0.2]} />
        <meshStandardMaterial map={brickTexture || undefined} color="#151520" />
      </mesh>

      {/* Front wall */}
      <mesh position={[0, 2.5, 6]} rotation={[0, Math.PI, 0]} receiveShadow>
        <boxGeometry args={[14, 5, 0.2]} />
        <meshStandardMaterial map={brickTexture || undefined} color="#151520" />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#0a0a12" roughness={0.9} />
      </mesh>

      {/* Product Frames */}
      {FRAME_SPOTS.map(config => (
        <GlowingFrame
          key={config.slot}
          config={config}
          item={items[config.slot]}
          accent={accent}
          primary={primary}
          isSelected={selectedSlot === config.slot}
          onSelect={onSelectItem}
        />
      ))}

      {/* Shop name on wall */}
      <Text
        position={[0, 4.2, -5.7]}
        fontSize={0.5}
        color={primary}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {shop.shopName || "Virtual Shop"}
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
  const hasItems = wallItems.some(Boolean);
  const filledSlots = wallItems.filter(Boolean);
  
  const navigateItem = (direction: 'prev' | 'next') => {
    if (!hasItems) return;
    
    const filledIndices = wallItems.map((item, i) => item ? i : -1).filter(i => i !== -1);
    if (filledIndices.length === 0) return;
    
    if (selectedSlot === null) {
      setSelectedSlot(filledIndices[0]);
      return;
    }
    
    const currentIndex = filledIndices.indexOf(selectedSlot);
    if (direction === 'next') {
      const nextIndex = (currentIndex + 1) % filledIndices.length;
      setSelectedSlot(filledIndices[nextIndex]);
    } else {
      const prevIndex = (currentIndex - 1 + filledIndices.length) % filledIndices.length;
      setSelectedSlot(filledIndices[prevIndex]);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-background flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-background via-background/80 to-transparent">
        <div className="flex items-center gap-3">
          {shop.logoUrl && (
            <img 
              src={shop.logoUrl} 
              alt={shop.shopName}
              className="h-10 w-10 rounded-lg object-contain bg-background/50 p-1"
            />
          )}
          <div>
            <h1 className="font-display font-bold text-lg text-foreground">
              {shop.shopName || "Virtual Shop"}
            </h1>
            {shop.category && (
              <p className="text-xs text-muted-foreground">{shop.category}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {shop.externalLink && (
            <Button 
              size="sm" 
              variant="outline"
              asChild
              className="hidden sm:flex"
            >
              <a href={shop.externalLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Store
              </a>
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onExit}>
            <X className="h-4 w-4 mr-2" />
            Exit
          </Button>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas shadows camera={{ position: [0, 2, 4], fov: 60 }} className="flex-1">
        <color attach="background" args={["#0a0a12"]} />
        <fog attach="fog" args={["#0a0a12", 10, 25]} />
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
          dampingFactor={0.1}
          maxDistance={6}
          minDistance={2}
          target={[0, 2, -3]}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 4}
        />
      </Canvas>

      {/* Bottom Panel - Product Details */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-2xl mx-auto">
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Loading showcase...</p>
            </div>
          ) : selectedItem ? (
            <div 
              className="rounded-2xl border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
              style={{ borderColor: `${accent}40` }}
            >
              <div className="flex items-stretch">
                {/* Product Image */}
                {selectedItem.image_url && (
                  <div className="w-28 sm:w-36 shrink-0 bg-muted">
                    <img 
                      src={selectedItem.image_url} 
                      alt={selectedItem.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                
                {/* Product Info */}
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-bold text-lg text-foreground truncate">
                        {selectedItem.title}
                      </h3>
                      {selectedItem.price !== null && selectedItem.price !== undefined && (
                        <span 
                          className="shrink-0 px-3 py-1 rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: accent }}
                        >
                          ${Number(selectedItem.price).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {selectedItem.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {selectedItem.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Navigation */}
                  {filledSlots.length > 1 && (
                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border/50">
                      <span className="text-xs text-muted-foreground mr-auto">
                        {filledSlots.indexOf(selectedItem) + 1} of {filledSlots.length} products
                      </span>
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
                  )}
                </div>
              </div>
            </div>
          ) : hasItems ? (
            <div className="text-center py-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50">
              <ShoppingBag className="h-6 w-6 mx-auto mb-2" style={{ color: primary }} />
              <p className="text-sm text-foreground font-medium">Tap any product frame to see details</p>
              <p className="text-xs text-muted-foreground mt-1">
                {filledSlots.length} product{filledSlots.length !== 1 ? 's' : ''} on display
              </p>
            </div>
          ) : (
            <div className="text-center py-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50">
              <Package className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                This shop hasn't added any showcase items yet.
              </p>
            </div>
          )}
          
          {/* Controls hint */}
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
            <span>🖱️ Drag to look around</span>
            <span>🔍 Scroll to zoom</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopInteriorRoom;
