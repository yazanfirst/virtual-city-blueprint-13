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

    ctx.fillStyle = "#6b2f21";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const brickWidth = 80;
    const brickHeight = 40;
    const mortar = 6;

    for (let y = 0; y < canvas.height; y += brickHeight) {
      for (let x = 0; x < canvas.width + brickWidth; x += brickWidth) {
        const offset = (y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
        ctx.fillStyle = `rgba(255, 255, 255, 0.08)`;
        ctx.fillRect(x + offset, y, brickWidth - mortar, brickHeight - mortar);
        ctx.strokeStyle = "#4e2117";
        ctx.lineWidth = mortar / 2;
        ctx.strokeRect(x + offset, y, brickWidth - mortar, brickHeight - mortar);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2.5);
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
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 4, 0]} intensity={1.6} color={primary} />
      <pointLight position={[3, 3, 3]} intensity={1.2} color={accent} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#1a1a1f" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, 2.5, -6]} receiveShadow>
        <boxGeometry args={[12, 5, 0.2]} />
        <meshStandardMaterial map={brickTexture || undefined} color="#7a3b2f" />
      </mesh>

      {/* Side Walls */}
      <mesh position={[-6, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[12, 5, 0.2]} />
        <meshStandardMaterial map={brickTexture || undefined} color="#7a3b2f" />
      </mesh>
      <mesh position={[6, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[12, 5, 0.2]} />
        <meshStandardMaterial map={brickTexture || undefined} color="#7a3b2f" />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#13131a" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Product pedestals */}
      <Pedestal position={[-3, 0.2, -1.5]} color={primary} />
      <Pedestal position={[0, 0.2, -2.5]} color={accent} />
      <Pedestal position={[3, 0.2, -1.5]} color={primary} />

      {/* Floating brand title */}
      <Text
        position={[0, 3.5, -2]}
        fontSize={0.6}
        color={primary}
        anchorX="center"
        anchorY="middle"
      >
        {shop.shopName || "Virtual Shop"}
      </Text>

      {/* Instruction label */}
      <Html position={[0, 1.5, 2]} center distanceFactor={8} transform>
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(0,0,0,0.6)",
            borderRadius: "12px",
            border: `1px solid ${accent}33`,
            color: "white",
            fontSize: "12px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
          }}
        >
          Explore the brick gallery and showcase products in 3D.
        </div>
      </Html>
    </group>
  );
};

const ShopInteriorRoom = ({ shop, onExit }: ShopInteriorRoomProps) => {
  return (
    <div className="fixed inset-0 z-[140] bg-background/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/80 to-background/90" />
      <div className="relative w-full max-w-6xl h-[70vh] cyber-card overflow-hidden border border-primary/30">
        <div className="absolute top-3 left-4 z-10">
          <div className="rounded-full bg-primary/20 px-4 py-2 text-primary text-xs font-semibold uppercase tracking-wide">
            {shop.shopName || "Shop Interior"}
          </div>
        </div>
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <Button size="sm" variant="outline" onClick={onExit}>
            Exit Shop
          </Button>
        </div>
        <Canvas shadows camera={{ position: [0, 3, 8], fov: 50 }}>
          <color attach="background" args={["#0d0d12"]} />
          <fog attach="fog" args={["#0d0d12", 12, 25]} />
          <React.Suspense fallback={null}>
            <InteriorScene shop={shop} />
          </React.Suspense>
          <OrbitControls enablePan={false} maxDistance={14} minDistance={5} target={[0, 1.5, -2]} />
        </Canvas>
        <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Drag or swipe to look around
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Pinch or scroll to zoom
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopInteriorRoom;
