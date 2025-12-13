import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ShopBranding } from "@/hooks/use3DShops";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const FRAME_DIMENSIONS = {
  outer: { width: 2, height: 2.5, depth: 0.12 },
  inner: { width: 1.78, height: 2.28, depth: 0.08 },
  mat: { width: 1.6, height: 2.05, depth: 0.02 },
  content: { width: 180, height: 225 },
};

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

  // Dark brick base
  ctx.fillStyle = "#2a1810";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const brickWidth = 64;
  const brickHeight = 28;
  const mortar = 3;

  for (let y = 0; y < canvas.height + brickHeight; y += brickHeight) {
    for (let x = -brickWidth; x < canvas.width + brickWidth; x += brickWidth) {
      const offset = Math.floor(y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
      
      // Brick variations
      const shade = 0.85 + Math.random() * 0.3;
      const r = Math.floor(58 * shade);
      const g = Math.floor(32 * shade);
      const b = Math.floor(22 * shade);
      
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x + offset + mortar, y + mortar, brickWidth - mortar * 2, brickHeight - mortar * 2);
      
      // Subtle highlight
      ctx.fillStyle = `rgba(255, 200, 150, 0.05)`;
      ctx.fillRect(x + offset + mortar, y + mortar, brickWidth - mortar * 2, 2);
    }
  }

  // Mortar color
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = "#1a0f0a";
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

const ROOM_PIVOT = new THREE.Vector3(0, 2, -1.5);
const ROOM_BOUNDS = {
  minX: -5.6,
  maxX: 5.6,
  minY: 1.2,
  maxY: 3.6,
  minZ: -4.8,
  maxZ: 4.2,
};

const RoomCameraController = () => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.8;
    controls.maxDistance = 4.6;
    controls.minPolarAngle = Math.PI / 5;
    controls.maxPolarAngle = Math.PI / 1.9;
    controls.rotateSpeed = 0.55;
    controls.target.copy(ROOM_PIVOT);

    const clampCamera = () => {
      const position = camera.position;

      position.x = THREE.MathUtils.clamp(position.x, ROOM_BOUNDS.minX, ROOM_BOUNDS.maxX);
      position.y = THREE.MathUtils.clamp(position.y, ROOM_BOUNDS.minY, ROOM_BOUNDS.maxY);
      position.z = THREE.MathUtils.clamp(position.z, ROOM_BOUNDS.minZ, ROOM_BOUNDS.maxZ);

      const offset = position.clone().sub(ROOM_PIVOT);
      const clampedRadius = THREE.MathUtils.clamp(offset.length(), controls.minDistance, controls.maxDistance);

      if (Math.abs(clampedRadius - offset.length()) > 1e-3) {
        offset.setLength(clampedRadius);
        position.copy(ROOM_PIVOT).add(offset);
      }

      camera.lookAt(ROOM_PIVOT);
      controls.target.copy(ROOM_PIVOT);
    };

    clampCamera();
    controls.addEventListener("change", clampCamera);

    return () => {
      controls.removeEventListener("change", clampCamera);
    };
  }, [camera]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    controls.target.copy(ROOM_PIVOT);
    controls.update();
  });

  return <OrbitControls ref={controlsRef} args={[camera, gl.domElement]} />;
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
  onSelect: (slot: number, item?: ShopItem) => void;
}) => {
  const hasItem = Boolean(item?.title);
  const frameColor = hasItem ? "#c9a227" : "#4a3f35";
  const innerColor = hasItem ? "#1a1510" : "#0f0d0a";
  const cornerOffsetX = FRAME_DIMENSIONS.outer.width / 2 - 0.1;
  const cornerOffsetY = FRAME_DIMENSIONS.outer.height / 2 - 0.15;
  
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
        <boxGeometry
          args={[FRAME_DIMENSIONS.outer.width, FRAME_DIMENSIONS.outer.height, FRAME_DIMENSIONS.outer.depth]}
        />
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
        <boxGeometry args={[FRAME_DIMENSIONS.inner.width, FRAME_DIMENSIONS.inner.height, FRAME_DIMENSIONS.inner.depth]} />
        <meshStandardMaterial
          color={hasItem ? "#8b7355" : "#3a3028"}
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>
      
      {/* Frame mat/passepartout */}
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[FRAME_DIMENSIONS.mat.width, FRAME_DIMENSIONS.mat.height, FRAME_DIMENSIONS.mat.depth]} />
        <meshStandardMaterial color={innerColor} roughness={0.9} />
      </mesh>
      
      {/* Corner decorations */}
      {[
        [-cornerOffsetX, cornerOffsetY],
        [cornerOffsetX, cornerOffsetY],
        [-cornerOffsetX, -cornerOffsetY],
        [cornerOffsetX, -cornerOffsetY],
      ].map(([x, y], i) => (
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
            onSelect(config.slot, item);
          }}
          className="group transition-transform duration-200 hover:scale-[1.02] focus:outline-none"
          style={{
            width: `${FRAME_DIMENSIONS.content.width}px`,
            height: `${FRAME_DIMENSIONS.content.height}px`,
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: isSelected ? `0 0 20px ${accent}50` : 'none',
          }}
        >
          {hasItem && item ? (
            <div className="relative h-full w-full bg-card/95 backdrop-blur-sm border border-border/30 overflow-hidden">
              {/* Product image */}
              <div className="relative h-[65%] w-full overflow-hidden bg-muted">
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
              <div className="p-1.5 bg-background/85">
                <p className="text-[12px] font-medium text-foreground truncate">{item.title}</p>
                <p className="text-[10px] text-muted-foreground">Tap to view</p>
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
  onSelectItem: (slot: number, item?: ShopItem) => void;
}) => {
  const brickTexture = useBrickTexture();
  const accent = shop.accentColor || "#10B981";
  const primary = shop.primaryColor || "#3B82F6";

  return (
    <group>
      {/* Optimized ambient lighting - no shadows */}
      <ambientLight intensity={1.15} color="#fffaf1" />
      <hemisphereLight args={["#fff7eb", "#3f2618", 1.45]} position={[0, 6, 0]} />

      {/* Directional fill for broad brightness without heavy cost */}
      <directionalLight
        position={[4, 6, 3]}
        intensity={1.6}
        color="#ffeede"
      >
        <object3D position={[0, 0, -2]} />
      </directionalLight>

      {/* Single main ceiling light - efficient */}
      <pointLight
        position={[0, 4.6, 0]}
        intensity={3.1}
        color="#fff8ef"
        distance={22}
        decay={2}
      />

      {/* Soft corner fills to reduce wall shadows */}
      {[[-5.2, 3.4, -5.2], [5.2, 3.4, -5.2], [-5.2, 3.4, 5.2], [5.2, 3.4, 5.2]].map((pos, i) => (
        <pointLight key={i} position={pos as [number, number, number]} intensity={1.2} color="#ffeedd" distance={15} decay={2.1} />
      ))}

      {/* Floor - polished concrete look */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial
          color="#4f4035"
          roughness={0.32}
          metalness={0.1}
        />
      </mesh>

      {/* Subtle floor reflection lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[13.5, 13.5]} />
        <meshStandardMaterial
          color="#5a4a3e"
          roughness={0.5}
          transparent
          opacity={0.36}
        />
      </mesh>

      {/* Walls with brick texture */}
      {/* Front Wall */}
      <mesh position={[0, 2.5, -6]}>
        <boxGeometry args={[14, 5, 0.3]} />
        <meshStandardMaterial map={brickTexture} color="#5a3d2f" />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, 2.5, 6]}>
        <boxGeometry args={[14, 5, 0.3]} />
        <meshStandardMaterial map={brickTexture} color="#583829" />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-7, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[12, 5, 0.3]} />
        <meshStandardMaterial map={brickTexture} color="#5a3d2f" />
      </mesh>

      {/* Right Wall */}
      <mesh position={[7, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[12, 5, 0.3]} />
        <meshStandardMaterial map={brickTexture} color="#5a3d2f" />
      </mesh>

      {/* Ceiling - dark wood beams look */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#2e1c12" roughness={0.9} />
      </mesh>
      
      {/* Ceiling light fixture */}
      <mesh position={[0, 4.9, 0]}>
        <cylinderGeometry args={[0.8, 1, 0.15, 16]} />
        <meshStandardMaterial color="#2a2015" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 4.75, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color="#fff9f0"
          emissive="#fff9f0"
          emissiveIntensity={1.5}
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
  const [showDetails, setShowDetails] = useState(false);

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

  const handleSelectFrame = (slot: number, item?: ShopItem) => {
    setSelectedSlot(slot);
    if (item) {
      setShowDetails(true);
    }
  };

  useEffect(() => {
    if (!selectedItem) {
      setShowDetails(false);
    }
  }, [selectedItem]);
  
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
      {/* Header - mobile optimized */}
      <div className="absolute top-0 left-0 right-0 z-20 px-3 py-2 sm:p-4 flex items-center justify-between bg-gradient-to-b from-background via-background/90 to-transparent">
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
        gl={{ antialias: true, powerPreference: "high-performance", toneMappingExposure: 1.25 }}
      >
        <color attach="background" args={["#291b14"]} />
        <fog attach="fog" args={["#291b14", 8, 18]} />
        <React.Suspense fallback={null}>
          <InteriorScene
            shop={shop}
            items={wallItems}
            selectedSlot={selectedSlot}
            onSelectItem={handleSelectFrame}
          />
        </React.Suspense>
        <RoomCameraController />
      </Canvas>

      <Dialog open={showDetails && Boolean(selectedItem)} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl w-[calc(100vw-2rem)]">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-start justify-between gap-3 text-foreground">
                  <span className="text-lg sm:text-xl font-semibold leading-tight">
                    {selectedItem.title}
                  </span>
                  {selectedItem.price != null && (
                    <span
                      className="shrink-0 px-3 py-1 rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: accent }}
                    >
                      ${Number(selectedItem.price).toFixed(2)}
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Full product details
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-[1.05fr_1fr] items-start">
                <div className="relative w-full overflow-hidden rounded-xl border border-border/50 bg-muted">
                  {selectedItem.image_url ? (
                    <img
                      src={selectedItem.image_url}
                      alt={selectedItem.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex aspect-[4/5] h-full w-full items-center justify-center text-muted-foreground/60"
                      style={{ background: `linear-gradient(135deg, ${primary}25, ${accent}20)` }}
                    >
                      <Package className="h-10 w-10" />
                    </div>
                  )}
                  {selectedItem.price != null && (
                    <div
                      className="absolute bottom-3 right-3 rounded-lg px-3 py-1 text-sm font-semibold text-white shadow-lg"
                      style={{ backgroundColor: accent }}
                    >
                      ${Number(selectedItem.price).toFixed(2)}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {selectedItem.description ? (
                    <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                      {selectedItem.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No description provided.</p>
                  )}

                  <div className="rounded-lg border border-border/60 bg-card/70 p-3 text-xs text-muted-foreground">
                    Displayed in slot {selectedSlot !== null ? selectedSlot + 1 : "-"}. Tap other frames to view their details.
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Bottom Panel - Mobile landscape friendly */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-2 sm:p-4 bg-gradient-to-t from-background via-background/95 to-transparent">
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
