import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { ShopBranding } from "@/hooks/use3DShops";
import { Button } from "@/components/ui/button";
import { ShopItem, useShopItems } from "@/hooks/useShopItems";

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
  { slot: 0, position: [-4.2, 2.3, -5.9] },
  { slot: 1, position: [-1.4, 2.3, -5.9] },
  { slot: 2, position: [1.4, 2.3, -5.9] },
  { slot: 3, position: [4.2, 2.3, -5.9] },
  { slot: 4, position: [5.9, 2.2, -2.2], rotation: [0, -Math.PI / 2, 0] },
];

const useBrickTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    ctx.fillStyle = "#9a523b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const brickWidth = 80;
    const brickHeight = 40;
    const mortar = 6;

    for (let y = 0; y < canvas.height; y += brickHeight) {
      for (let x = 0; x < canvas.width + brickWidth; x += brickWidth) {
        const offset = (y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
        ctx.fillStyle = `rgba(255, 255, 255, 0.12)`;
        ctx.fillRect(x + offset, y, brickWidth - mortar, brickHeight - mortar);
        ctx.strokeStyle = "#4e2117";
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

const Pedestal = ({ position, color }: { position: [number, number, number]; color: string }) => (
  <group position={position}>
    <mesh receiveShadow castShadow>
      <cylinderGeometry args={[0.6, 0.6, 0.4, 32]} />
      <meshStandardMaterial color="#1f1f24" metalness={0.2} roughness={0.6} />
    </mesh>
    <mesh position={[0, 0.5, 0]} castShadow>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color={color} emissive={`${color}40`} />
    </mesh>
  </group>
);

const FrameSpot = ({
  config,
  item,
  accent,
  primary,
  onSelect,
}: {
  config: FrameSpotConfig;
  item?: ShopItem;
  accent: string;
  primary: string;
  onSelect: (slot: number) => void;
}) => (
  <group position={config.position} rotation={config.rotation || [0, 0, 0]}>
    <mesh position={[0, 0, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.9, 1.4, 0.08]} />
      <meshStandardMaterial color="#0c111c" metalness={0.25} roughness={0.55} />
    </mesh>
    <mesh position={[0, 0, 0.06]} castShadow>
      <boxGeometry args={[2, 1.5, 0.04]} />
      <meshStandardMaterial color={accent} metalness={0.5} roughness={0.25} />
    </mesh>
    <mesh position={[0, 0, 0.1]} castShadow>
      <boxGeometry args={[1.7, 1.25, 0.02]} />
      <meshStandardMaterial color="#0f172a" metalness={0.2} roughness={0.55} />
    </mesh>
    <Html
      transform
      position={[0, 0, 0.12]}
      distanceFactor={12}
      occlude
      className="pointer-events-auto"
    >
      <button
        onClick={(event) => {
          event.stopPropagation();
          onSelect(config.slot);
        }}
        className="group flex flex-col rounded-xl border border-border/70 bg-background/90 shadow-lg backdrop-blur px-3 py-2 w-40"
        style={{ borderColor: `${accent}55` }}
      >
        <div className="relative h-24 w-full overflow-hidden rounded-md bg-muted">
          {item?.image_url ? (
            <img src={item.image_url} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-[11px] text-muted-foreground">
              Empty frame
            </div>
          )}
          <span
            className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow"
            style={{ backgroundColor: `${primary}20`, color: primary }}
          >
            Spot {config.slot + 1}
          </span>
        </div>
        <div className="mt-2 text-left space-y-1">
          <p className="text-sm font-semibold text-foreground truncate">{item?.title || "Add your product"}</p>
          {item?.price !== null && item?.price !== undefined ? (
            <p className="text-xs font-bold" style={{ color: accent }}>
              ${item.price.toFixed(2)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Tap to see details</p>
          )}
        </div>
      </button>
    </Html>
  </group>
);

const InteriorScene = ({
  shop,
  items,
  onSelectItem,
}: {
  shop: ShopBranding;
  items: (ShopItem | undefined)[];
  onSelectItem: (slot: number) => void;
}) => {
  const brickTexture = useBrickTexture();
  const accent = shop.accentColor || "#10B981";
  const primary = shop.primaryColor || "#3B82F6";

  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={1.55} color="#fff8ea" />
      <hemisphereLight args={["#ffffff", "#16161d", 1]} position={[0, 4.8, 0]} />
      <pointLight position={[0, 4.3, 0]} intensity={2.4} color={primary} decay={1.5} />
      <pointLight position={[2.5, 3.3, 2.5]} intensity={1.8} color={accent} decay={1.5} />
      <pointLight position={[-2.5, 3.3, 2.5]} intensity={1.8} color={accent} decay={1.5} />
      <spotLight
        position={[0, 4.5, -1]}
        intensity={2.2}
        angle={1}
        penumbra={0.6}
        color={primary}
        castShadow
        onUpdate={(self) => self.target.position.set(0, 1.8, -3)}
      />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#202330" roughness={0.72} metalness={0.08} />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, 2.5, -6]} receiveShadow>
        <boxGeometry args={[12, 5, 0.2]} />
        <meshStandardMaterial map={brickTexture || undefined} color="#a25c43" />
      </mesh>

      {/* Side Walls */}
      <mesh position={[-6, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[12, 5, 0.2]} />
        <meshStandardMaterial map={brickTexture || undefined} color="#a25c43" />
      </mesh>
      <mesh position={[6, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[12, 5, 0.2]} />
        <meshStandardMaterial map={brickTexture || undefined} color="#a25c43" />
      </mesh>

      {/* Front wall keeps the view enclosed */}
      <mesh position={[0, 2.5, 6]} rotation={[0, Math.PI, 0]} receiveShadow>
        <boxGeometry args={[12, 5, 0.2]} />
        <meshStandardMaterial map={brickTexture || undefined} color="#a25c43" />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#1f2233" roughness={0.45} metalness={0.16} />
      </mesh>

      {/* Product pedestals */}
      <Pedestal position={[-3, 0.2, -1.5]} color={primary} />
      <Pedestal position={[0, 0.2, -2.5]} color={accent} />
      <Pedestal position={[3, 0.2, -1.5]} color={primary} />

      {/* Framed showcase items */}
      {FRAME_SPOTS.map(config => (
        <FrameSpot
          key={config.slot}
          config={config}
          item={items[config.slot]}
          accent={accent}
          primary={primary}
          onSelect={onSelectItem}
        />
      ))}

      {/* Floating brand title */}
      <Text
        position={[0, 3.6, -2]}
        fontSize={0.7}
        color={accent}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#0b0d14"
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

  return (
    <div className="fixed inset-0 z-[250] bg-background/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/80 to-background/90" />
      <div className="relative w-full max-w-6xl h-[75vh] sm:h-[80vh] max-h-[calc(100vh-2rem)] cyber-card overflow-hidden border border-primary/30">
        <div className="absolute top-3 left-4 z-10 hidden sm:block">
          <div className="rounded-full bg-primary/15 px-4 py-2 text-primary text-xs font-semibold uppercase tracking-wide shadow-lg backdrop-blur-sm">
            {shop.shopName || "Shop Interior"}
          </div>
        </div>
        <div className="absolute top-3 inset-x-0 flex justify-center z-10 hidden sm:flex">
          <div className="rounded-full bg-background/70 px-5 py-2 text-sm font-semibold text-foreground shadow-lg border border-primary/20 backdrop-blur">
            {shop.shopName || "Virtual Shop"}
          </div>
        </div>
        <Canvas shadows camera={{ position: [0, 2.6, 2.2], fov: 55 }}>
          <color attach="background" args={["#0f172a"]} />
          <fog attach="fog" args={["#0f172a", 12, 22]} />
          <React.Suspense fallback={null}>
            <InteriorScene shop={shop} items={wallItems} onSelectItem={setSelectedSlot} />
          </React.Suspense>
          <OrbitControls
            enablePan={false}
            enableDamping
            dampingFactor={0.12}
            maxDistance={3.2}
            minDistance={2}
            target={[0, 1.6, -2]}
            maxPolarAngle={Math.PI / 2.4}
            minPolarAngle={Math.PI / 4.3}
          />
        </Canvas>
        <div className="absolute bottom-3 left-3 right-3 z-20 space-y-2">
          {(hasItems || selectedItem || isLoading) && (
            <div className="rounded-lg border border-border/60 bg-background/92 backdrop-blur-sm px-3 py-2 shadow-lg">
              {isLoading ? (
                <p className="text-xs text-muted-foreground">Loading showcase items...</p>
              ) : selectedItem ? (
                <div className="flex items-start gap-3">
                  {selectedItem.image_url && (
                    <img
                      src={selectedItem.image_url}
                      alt={selectedItem.title}
                      className="h-14 w-14 rounded-md object-cover border"
                    />
                  )}
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{selectedItem.title}</p>
                    {selectedItem.description && (
                      <p className="text-xs text-muted-foreground leading-snug break-words">
                        {selectedItem.description}
                      </p>
                    )}
                  </div>
                  {selectedItem.price !== null && selectedItem.price !== undefined && (
                    <div className="text-sm font-bold" style={{ color: accent }}>
                      ${selectedItem.price.toFixed(2)}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {hasItems
                    ? "Tap any framed item on the wall to read its details."
                    : "The shop owner hasn’t added showcase items yet."}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground bg-background/85 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/50">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Drag or swipe to look around
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Pinch or scroll to zoom
            </div>
            <Button size="sm" variant="secondary" className="ml-auto" onClick={onExit}>
              Exit Shop
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopInteriorRoom;
