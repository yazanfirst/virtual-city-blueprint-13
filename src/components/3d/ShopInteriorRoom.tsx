import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { ShopBranding } from "@/hooks/use3DShops";
import { Button } from "@/components/ui/button";

interface ShopInteriorRoomProps {
  shop: ShopBranding;
  onExit: () => void;
}

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

const InteriorScene = ({ shop }: { shop: ShopBranding }) => {
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
        <div className="absolute top-3 right-3 z-10 hidden sm:flex gap-2">
          <Button size="sm" variant="outline" onClick={onExit}>
            Exit Shop
          </Button>
        </div>
        <Canvas shadows camera={{ position: [0, 2.6, 2.2], fov: 55 }}>
          <color attach="background" args={["#0f172a"]} />
          <fog attach="fog" args={["#0f172a", 12, 22]} />
          <React.Suspense fallback={null}>
            <InteriorScene shop={shop} />
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
        <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground bg-background/85 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/50">
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
  );
};

export default ShopInteriorRoom;
