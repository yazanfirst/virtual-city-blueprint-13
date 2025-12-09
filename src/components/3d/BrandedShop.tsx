import React, { useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { ShopBranding } from "@/hooks/use3DShops";

interface BrandedShopProps {
  branding: ShopBranding;
  isNight: boolean;
}

// Template-specific colors
const templateColors = {
  modern_neon: { bg: "#1A1A2A", roof: "#0A0A1A", window: "#6A9ACC" },
  minimal_white: { bg: "#F5F5F5", roof: "#E8E8E8", window: "#87CEEB" },
  classic_brick: { bg: "#8B4513", roof: "#654321", window: "#87CEEB" },
  cyber_tech: { bg: "#1A0030", roof: "#0A0020", window: "#9966FF" },
};

const BrandedShop = ({ branding, isNight }: BrandedShopProps) => {
  const { position, hasShop, shopName, primaryColor, accentColor, facadeTemplate } = branding;
  
  const template = (facadeTemplate as keyof typeof templateColors) || 'modern_neon';
  const colors = templateColors[template];
  
  const primaryHex = primaryColor || '#3B82F6';
  const accentHex = accentColor || '#10B981';

  const darker = useMemo(() => {
    const c = new THREE.Color(hasShop ? primaryHex : colors.bg);
    c.multiplyScalar(0.7);
    return `#${c.getHexString()}`;
  }, [primaryHex, colors.bg, hasShop]);

  const buildingColor = hasShop ? primaryHex : colors.bg;
  const roofColor = hasShop ? darker : colors.roof;

  return (
    <group position={[position.x, 0, position.z]} rotation={[0, position.rotation, 0]}>
      {/* Main body */}
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[8, 6, 8]} />
        <meshLambertMaterial color={isNight ? "#3A3A4A" : buildingColor} />
      </mesh>
      
      {/* Roof */}
      <mesh position={[0, 6.2, 0]}>
        <boxGeometry args={[8.4, 0.4, 8.4]} />
        <meshLambertMaterial color={isNight ? "#2A2A3A" : roofColor} />
      </mesh>
      
      {/* FRONT FACE - Windows */}
      {[-2, 2].map((wx, i) => (
        <mesh key={`win-${i}`} position={[wx, 4.2, 4.05]}>
          <boxGeometry args={[1.5, 1.5, 0.1]} />
          <meshLambertMaterial 
            color="#5A6A7A" 
            emissive={isNight ? accentHex : "#000000"} 
            emissiveIntensity={isNight ? 0.6 : 0} 
          />
        </mesh>
      ))}
      
      {/* FRONT FACE - Storefront window */}
      <mesh position={[0.8, 1.8, 4.05]}>
        <boxGeometry args={[4, 2.8, 0.1]} />
        <meshLambertMaterial 
          color={isNight ? colors.window : "#87CEEB"} 
          emissive={isNight ? accentHex : "#000000"} 
          emissiveIntensity={isNight ? 0.5 : 0} 
        />
      </mesh>
      
      {/* FRONT FACE - Door */}
      <mesh position={[-2.8, 1.5, 4.05]}>
        <boxGeometry args={[1.5, 3, 0.1]} />
        <meshLambertMaterial color="#4A3A2A" />
      </mesh>
      
      {/* Awning */}
      <mesh position={[0, 3.5, 4.8]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[7, 0.1, 1.5]} />
        <meshLambertMaterial color={hasShop ? accentHex : darker} />
      </mesh>
      
      {/* Signboard */}
      <group position={[0, 5.2, 4.3]}>
        {/* Sign board background */}
        <mesh>
          <boxGeometry args={[4.5, 1.3, 0.2]} />
          <meshBasicMaterial color={hasShop ? "#1A1A2A" : (isNight ? "#1A0015" : "#1A1A2A")} />
        </mesh>
        
        {/* Border - uses accent color for branded shops */}
        <mesh position={[0, 0, 0.11]}>
          <boxGeometry args={[4.6, 1.4, 0.02]} />
          <meshBasicMaterial color={hasShop ? primaryHex : (isNight ? "#FF1493" : "#882244")} />
        </mesh>
        
        {/* Inner border */}
        <mesh position={[0, 0, 0.12]}>
          <boxGeometry args={[4.0, 0.9, 0.02]} />
          <meshBasicMaterial color={hasShop ? accentHex : (isNight ? "#00FFFF" : "#006666")} />
        </mesh>
        
        {/* Text */}
        <Text 
          position={[0, 0, 0.15]} 
          fontSize={hasShop ? 0.32 : 0.4} 
          color={hasShop ? "#FFFFFF" : (isNight ? "#FFFF00" : "#FFDD00")}
          anchorX="center" 
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor={hasShop ? primaryHex : (isNight ? "#FF1493" : "#886600")}
          maxWidth={4}
        >
          {hasShop ? (shopName || "SHOP") : "FOR RENT"}
        </Text>
      </group>
      
      {/* Template-specific decorations */}
      {hasShop && template === 'cyber_tech' && (
        <>
          {/* Geometric patterns */}
          <mesh position={[3.8, 3, 4.05]}>
            <boxGeometry args={[0.1, 4, 0.1]} />
            <meshBasicMaterial color={accentHex} />
          </mesh>
          <mesh position={[-3.8, 3, 4.05]}>
            <boxGeometry args={[0.1, 4, 0.1]} />
            <meshBasicMaterial color={accentHex} />
          </mesh>
        </>
      )}
      
      {hasShop && template === 'modern_neon' && isNight && (
        <>
          {/* Neon strips */}
          <mesh position={[0, 6.3, 4.2]}>
            <boxGeometry args={[8, 0.1, 0.1]} />
            <meshBasicMaterial color={primaryHex} />
          </mesh>
          <mesh position={[0, 0.1, 4.2]}>
            <boxGeometry args={[8, 0.1, 0.1]} />
            <meshBasicMaterial color={accentHex} />
          </mesh>
        </>
      )}
    </group>
  );
};

export default BrandedShop;
