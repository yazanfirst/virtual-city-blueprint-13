import React, { useMemo, useState } from "react";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { ShopBranding } from "@/hooks/use3DShops";

interface BrandedShopProps {
  branding: ShopBranding;
  isNight: boolean;
  onClick?: () => void;
}

// Template-specific colors - now with more professional options
const templateColors = {
  modern_neon: { bg: "#1A1A2A", roof: "#0A0A1A", window: "#6A9ACC", accent: "#FF00FF" },
  minimal_white: { bg: "#F5F5F5", roof: "#E8E8E8", window: "#87CEEB", accent: "#333333" },
  classic_brick: { bg: "#8B4513", roof: "#654321", window: "#87CEEB", accent: "#D4A574" },
  cyber_tech: { bg: "#1A0030", roof: "#0A0020", window: "#9966FF", accent: "#00FFFF" },
  luxury_gold: { bg: "#1A1A1A", roof: "#0D0D0D", window: "#D4AF37", accent: "#FFD700" },
  urban_industrial: { bg: "#3D3D3D", roof: "#2A2A2A", window: "#708090", accent: "#FF6B35" },
  retro_vintage: { bg: "#F4E4C1", roof: "#C9B896", window: "#87CEEB", accent: "#E85D04" },
  nature_organic: { bg: "#2D5016", roof: "#1E3A0F", window: "#90EE90", accent: "#FFB347" },
};

// Font styles for signage
const fontStyles = {
  classic: { letterSpacing: 0.02, fontWeight: 400 },
  bold: { letterSpacing: 0.01, fontWeight: 700 },
  elegant: { letterSpacing: 0.05, fontWeight: 300 },
  modern: { letterSpacing: 0, fontWeight: 500 },
  playful: { letterSpacing: 0.03, fontWeight: 600 },
};

const BrandedShop = ({ branding, isNight, onClick }: BrandedShopProps) => {
  const { position, hasShop, shopName, primaryColor, accentColor, facadeTemplate, logoUrl, signageFont } = branding;
  const [hovered, setHovered] = useState(false);
  
  const template = (facadeTemplate as keyof typeof templateColors) || 'modern_neon';
  const colors = templateColors[template] || templateColors.modern_neon;
  const font = fontStyles[(signageFont as keyof typeof fontStyles) || 'classic'];
  
  const primaryHex = primaryColor || '#3B82F6';
  const accentHex = accentColor || '#10B981';

  const darker = useMemo(() => {
    const c = new THREE.Color(hasShop ? primaryHex : colors.bg);
    c.multiplyScalar(0.7);
    return `#${c.getHexString()}`;
  }, [primaryHex, colors.bg, hasShop]);

  const buildingColor = hasShop ? primaryHex : colors.bg;
  const roofColor = hasShop ? darker : colors.roof;

  // Calculate text size based on name length
  const textSize = useMemo(() => {
    if (!shopName) return 0.4;
    if (shopName.length > 15) return 0.25;
    if (shopName.length > 10) return 0.3;
    return 0.35;
  }, [shopName]);

  return (
    <group 
      position={[position.x, 0, position.z]} 
      rotation={[0, position.rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
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
        
        {/* Logo if available - positioned on the left of the sign */}
        {hasShop && logoUrl && (
          <Html
            position={[-1.5, 0, 0.16]}
            transform
            occlude
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <img 
              src={logoUrl} 
              alt="Shop logo"
              style={{
                maxWidth: '40px',
                maxHeight: '40px',
                objectFit: 'contain',
                borderRadius: '4px',
              }}
            />
          </Html>
        )}
        
        {/* Text - shifted right if logo exists */}
        <Text 
          position={[hasShop && logoUrl ? 0.4 : 0, 0, 0.15]} 
          fontSize={hasShop ? textSize : 0.4}
          letterSpacing={font.letterSpacing}
          color={hasShop ? "#FFFFFF" : (isNight ? "#FFFF00" : "#FFDD00")}
          anchorX="center" 
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor={hasShop ? primaryHex : (isNight ? "#FF1493" : "#886600")}
          maxWidth={hasShop && logoUrl ? 2.5 : 4}
        >
          {hasShop ? (shopName || "SHOP") : "FOR RENT"}
        </Text>
      </group>

      {/* Hover effect - glow outline */}
      {hovered && hasShop && (
        <mesh position={[0, 3, 4.1]}>
          <boxGeometry args={[8.2, 6.2, 0.1]} />
          <meshBasicMaterial color={primaryHex} transparent opacity={0.3} />
        </mesh>
      )}
      
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

      {hasShop && template === 'luxury_gold' && (
        <>
          {/* Gold trim */}
          <mesh position={[0, 6.0, 4.1]}>
            <boxGeometry args={[7.5, 0.15, 0.15]} />
            <meshBasicMaterial color="#D4AF37" />
          </mesh>
          <mesh position={[0, 0.2, 4.1]}>
            <boxGeometry args={[7.5, 0.15, 0.15]} />
            <meshBasicMaterial color="#D4AF37" />
          </mesh>
        </>
      )}

      {hasShop && template === 'urban_industrial' && (
        <>
          {/* Industrial pipes */}
          <mesh position={[3.9, 2, 4.05]}>
            <cylinderGeometry args={[0.1, 0.1, 4, 6]} />
            <meshLambertMaterial color="#555555" />
          </mesh>
          <mesh position={[-3.9, 2, 4.05]}>
            <cylinderGeometry args={[0.1, 0.1, 4, 6]} />
            <meshLambertMaterial color="#555555" />
          </mesh>
        </>
      )}
    </group>
  );
};

export default BrandedShop;
