import React, { useMemo, useState } from "react";
import { Text, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { ShopBranding } from "@/hooks/use3DShops";

interface BrandedShopProps {
  branding: ShopBranding;
  isNight: boolean;
  onClick?: () => void;
}

// Template-specific colors - expanded with new beautiful templates
const templateColors = {
  modern_neon: { bg: "#1A1A2A", roof: "#0A0A1A", window: "#6A9ACC", accent: "#FF00FF", glow: "#FF00FF" },
  minimal_white: { bg: "#F5F5F5", roof: "#E8E8E8", window: "#87CEEB", accent: "#333333", glow: "#FFFFFF" },
  classic_brick: { bg: "#8B4513", roof: "#654321", window: "#87CEEB", accent: "#D4A574", glow: "#FFD700" },
  cyber_tech: { bg: "#1A0030", roof: "#0A0020", window: "#9966FF", accent: "#00FFFF", glow: "#00FFFF" },
  luxury_gold: { bg: "#1A1A1A", roof: "#0D0D0D", window: "#D4AF37", accent: "#FFD700", glow: "#FFD700" },
  urban_industrial: { bg: "#3D3D3D", roof: "#2A2A2A", window: "#708090", accent: "#FF6B35", glow: "#FF6B35" },
  retro_vintage: { bg: "#F4E4C1", roof: "#C9B896", window: "#87CEEB", accent: "#E85D04", glow: "#E85D04" },
  nature_organic: { bg: "#2D5016", roof: "#1E3A0F", window: "#90EE90", accent: "#FFB347", glow: "#90EE90" },
  // New beautiful templates
  led_display: { bg: "#0A0A0A", roof: "#050505", window: "#00FF00", accent: "#FF0080", glow: "#00FF00" },
  pharaoh_gold: { bg: "#2A1810", roof: "#1A0F0A", window: "#C9A227", accent: "#FFD700", glow: "#FFD700" },
  greek_marble: { bg: "#E8E4DC", roof: "#D4CFC4", window: "#87CEEB", accent: "#1E3A5F", glow: "#FFFFFF" },
  art_deco: { bg: "#1A1A2E", roof: "#0F0F1A", window: "#C9A227", accent: "#E8B923", glow: "#E8B923" },
  japanese_zen: { bg: "#2D2A26", roof: "#1E1C18", window: "#C41E3A", accent: "#FF6B6B", glow: "#FF6B6B" },
  neon_cyberpunk: { bg: "#0D0221", roof: "#070116", window: "#FF00FF", accent: "#00FFFF", glow: "#FF00FF" },
};

// Font styles for signage - using actual font families
const fontStyles = {
  classic: { fontFamily: "'Times New Roman', Georgia, serif", fontWeight: 400, letterSpacing: '1px' },
  bold: { fontFamily: "'Impact', 'Arial Black', sans-serif", fontWeight: 700, letterSpacing: '2px' },
  elegant: { fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 400, letterSpacing: '3px' },
  modern: { fontFamily: "'Orbitron', 'Courier New', monospace", fontWeight: 500, letterSpacing: '2px' },
  playful: { fontFamily: "'Pacifico', cursive, sans-serif", fontWeight: 400, letterSpacing: '0px' },
};

const defaultFontStyle = { fontFamily: 'Arial, sans-serif', fontWeight: 400, letterSpacing: '1px' };

// Texture tint colors to apply over textures
const textureColors: Record<string, string> = {
  wood: "#8B6914",
  marble: "#E8E4DC",
  brick: "#8B4513",
  metal: "#708090",
  concrete: "#808080",
  fabric: "#6B5B95",
  leather: "#654321",
};

// Texture loading component
const TexturedMesh = ({ textureUrl, isNight, buildingColor }: { textureUrl: string; isNight: boolean; buildingColor: string }) => {
  const texture = useTexture(textureUrl);
  
  useMemo(() => {
    if (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 2);
    }
  }, [texture]);

  return (
    <mesh position={[0, 3, 0]}>
      <boxGeometry args={[8, 6, 8]} />
      <meshLambertMaterial map={texture} color={isNight ? "#5A5A6A" : "#FFFFFF"} />
    </mesh>
  );
};

const BrandedShop = ({ branding, isNight, onClick }: BrandedShopProps) => {
  const { position, hasShop, isSuspended, shopName, primaryColor, accentColor, facadeTemplate, logoUrl, signageFont, textureTemplate, textureUrl } = branding;
  const [hovered, setHovered] = useState(false);
  const [textureError, setTextureError] = useState(false);

  const template = (facadeTemplate as keyof typeof templateColors) || 'modern_neon';
  const colors = templateColors[template] || templateColors.modern_neon;
  const signageKey = (signageFont as keyof typeof fontStyles) || 'classic';
  const font = fontStyles[signageKey] || defaultFontStyle;
  
  const primaryHex = primaryColor || '#3B82F6';
  const accentHex = accentColor || '#10B981';

  const darker = useMemo(() => {
    const c = new THREE.Color(hasShop ? primaryHex : colors.bg);
    c.multiplyScalar(0.7);
    return `#${c.getHexString()}`;
  }, [primaryHex, colors.bg, hasShop]);

  // Determine building color based on texture or primary color
  const hasTexture = hasShop && textureUrl && !textureError;
  const hasPresetTexture = hasShop && textureTemplate && textureTemplate !== 'none';
  const buildingColor = hasPresetTexture 
    ? (textureColors[textureTemplate] || primaryHex) 
    : (hasShop ? primaryHex : colors.bg);
  const roofColor = hasShop ? darker : colors.roof;

  // Decoration visibility - always show for shops at night
  const showDecorations = hasShop && !isSuspended;

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
      {/* Main body - with texture support */}
      {hasTexture ? (
        <React.Suspense fallback={
          <mesh position={[0, 3, 0]}>
            <boxGeometry args={[8, 6, 8]} />
            <meshLambertMaterial color={isNight ? "#3A3A4A" : buildingColor} />
          </mesh>
        }>
          <TexturedMesh textureUrl={textureUrl!} isNight={isNight} buildingColor={buildingColor} />
        </React.Suspense>
      ) : (
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[8, 6, 8]} />
          <meshLambertMaterial color={isNight ? "#3A3A4A" : buildingColor} />
        </mesh>
      )}
      
      {/* Roof */}
      <mesh position={[0, 6.2, 0]}>
        <boxGeometry args={[8.4, 0.4, 8.4]} />
        <meshLambertMaterial color={isNight ? "#2A2A3A" : roofColor} />
      </mesh>
      
      {/* FRONT FACE - Windows with glow at night */}
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
        
        {/* Centered content container - Logo + Text centered together */}
        {hasShop ? (
          <Html
            position={[0, 0.09, 0.16]}
            transform
            occlude
            center
            scale={1.1}
            style={{
              display: 'grid',
              gridAutoFlow: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              maxWidth: '180px',
              minWidth: '120px',
              margin: '0 auto',
              pointerEvents: 'none',
            }}
          >
            {/* Logo - if available */}
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Shop logo"
                style={{
                  width: '26px',
                  height: '26px',
                  objectFit: 'contain',
                  borderRadius: '4px',
                  flexShrink: 0,
                  justifySelf: 'center',
                }}
              />
            )}
            {/* Shop Name */}
            <div
              style={{
                fontFamily: font?.fontFamily ?? defaultFontStyle.fontFamily,
                fontWeight: font?.fontWeight ?? defaultFontStyle.fontWeight,
                letterSpacing: font?.letterSpacing ?? defaultFontStyle.letterSpacing,
                fontSize:
                  shopName && shopName.length > 12
                    ? '10px'
                    : shopName && shopName.length > 8
                      ? '12px'
                      : '14px',
                color: isSuspended ? '#888888' : '#FFFFFF',
                textShadow: isSuspended
                  ? '1px 1px 2px rgba(0,0,0,0.9)'
                  : `0 0 6px ${colors.glow}, 0 0 12px ${colors.glow}, 1px 1px 2px rgba(0,0,0,0.9)`,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textTransform: signageKey === 'elegant' ? 'uppercase' : 'none',
                textAlign: 'center',
                maxWidth: logoUrl ? '130px' : '160px',
                justifySelf: 'center',
                minWidth: 0,
              }}
            >
              {shopName || "SHOP"}
            </div>
          </Html>
        ) : (
          <Text 
            position={[0, 0, 0.15]} 
            fontSize={0.4}
            color={isNight ? "#FFFF00" : "#FFDD00"}
            anchorX="center" 
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor={isNight ? "#FF1493" : "#886600"}
          >
            FOR RENT
          </Text>
        )}
        
        {/* CLOSED sign for suspended shops */}
        {hasShop && isSuspended && (
          <Html
            position={[0, -0.8, 0.18]}
            transform
            occlude
            center
            style={{
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
            >
              CLOSED
            </div>
          </Html>
        )}
      </group>

      {/* Hover effect - glow outline */}
      {hovered && hasShop && (
        <mesh position={[0, 3, 4.1]}>
          <boxGeometry args={[8.2, 6.2, 0.1]} />
          <meshBasicMaterial color={primaryHex} transparent opacity={0.3} />
        </mesh>
      )}
      
      {/* ========== TEMPLATE-SPECIFIC DECORATIONS - VISIBLE AT NIGHT ========== */}
      
      {/* Cyber Tech - Geometric patterns */}
      {showDecorations && template === 'cyber_tech' && (
        <>
          <mesh position={[3.8, 3, 4.05]}>
            <boxGeometry args={[0.1, 4, 0.1]} />
            <meshBasicMaterial color={accentHex} />
          </mesh>
          <mesh position={[-3.8, 3, 4.05]}>
            <boxGeometry args={[0.1, 4, 0.1]} />
            <meshBasicMaterial color={accentHex} />
          </mesh>
          {isNight && (
            <>
              <mesh position={[0, 0.05, 4.2]}>
                <boxGeometry args={[8, 0.05, 0.05]} />
                <meshBasicMaterial color="#00FFFF" />
              </mesh>
              <mesh position={[0, 6.0, 4.2]}>
                <boxGeometry args={[8, 0.05, 0.05]} />
                <meshBasicMaterial color="#00FFFF" />
              </mesh>
            </>
          )}
        </>
      )}
      
      {/* Modern Neon - Neon strips at night */}
      {showDecorations && template === 'modern_neon' && (
        <>
          <mesh position={[0, 6.3, 4.2]}>
            <boxGeometry args={[8, 0.08, 0.08]} />
            <meshBasicMaterial color={isNight ? primaryHex : darker} />
          </mesh>
          <mesh position={[0, 0.1, 4.2]}>
            <boxGeometry args={[8, 0.08, 0.08]} />
            <meshBasicMaterial color={isNight ? accentHex : darker} />
          </mesh>
        </>
      )}

      {/* Luxury Gold - Gold trim always visible */}
      {showDecorations && template === 'luxury_gold' && (
        <>
          <mesh position={[0, 6.0, 4.1]}>
            <boxGeometry args={[7.5, 0.15, 0.15]} />
            <meshBasicMaterial color="#D4AF37" />
          </mesh>
          <mesh position={[0, 0.2, 4.1]}>
            <boxGeometry args={[7.5, 0.15, 0.15]} />
            <meshBasicMaterial color="#D4AF37" />
          </mesh>
          {/* Corner accents */}
          <mesh position={[3.7, 3, 4.1]}>
            <boxGeometry args={[0.15, 5.6, 0.15]} />
            <meshBasicMaterial color="#D4AF37" />
          </mesh>
          <mesh position={[-3.7, 3, 4.1]}>
            <boxGeometry args={[0.15, 5.6, 0.15]} />
            <meshBasicMaterial color="#D4AF37" />
          </mesh>
        </>
      )}

      {/* Urban Industrial - Industrial pipes */}
      {showDecorations && template === 'urban_industrial' && (
        <>
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

      {/* LED Display - LED strips around the facade */}
      {showDecorations && template === 'led_display' && (
        <>
          {/* Top LED strip */}
          <mesh position={[0, 6.3, 4.15]}>
            <boxGeometry args={[8.2, 0.1, 0.1]} />
            <meshBasicMaterial color={isNight ? "#00FF00" : "#00AA00"} />
          </mesh>
          {/* Bottom LED strip */}
          <mesh position={[0, 0.05, 4.15]}>
            <boxGeometry args={[8.2, 0.1, 0.1]} />
            <meshBasicMaterial color={isNight ? "#FF0080" : "#AA0055"} />
          </mesh>
          {/* Side LED strips */}
          <mesh position={[3.95, 3, 4.15]}>
            <boxGeometry args={[0.1, 6.2, 0.1]} />
            <meshBasicMaterial color={isNight ? "#00FFFF" : "#00AAAA"} />
          </mesh>
          <mesh position={[-3.95, 3, 4.15]}>
            <boxGeometry args={[0.1, 6.2, 0.1]} />
            <meshBasicMaterial color={isNight ? "#FF00FF" : "#AA00AA"} />
          </mesh>
        </>
      )}

      {/* Pharaoh Gold - Egyptian inspired decorations */}
      {showDecorations && template === 'pharaoh_gold' && (
        <>
          {/* Golden columns */}
          <mesh position={[3.5, 2.5, 4.2]}>
            <cylinderGeometry args={[0.2, 0.25, 5, 8]} />
            <meshBasicMaterial color="#C9A227" />
          </mesh>
          <mesh position={[-3.5, 2.5, 4.2]}>
            <cylinderGeometry args={[0.2, 0.25, 5, 8]} />
            <meshBasicMaterial color="#C9A227" />
          </mesh>
          {/* Top golden trim */}
          <mesh position={[0, 6.1, 4.2]}>
            <boxGeometry args={[7.5, 0.2, 0.2]} />
            <meshBasicMaterial color="#FFD700" />
          </mesh>
          {/* Pyramid accent on roof */}
          <mesh position={[0, 6.8, 0]} rotation={[0, Math.PI/4, 0]}>
            <coneGeometry args={[0.8, 1, 4]} />
            <meshBasicMaterial color="#FFD700" />
          </mesh>
        </>
      )}

      {/* Greek Marble - Classical columns and decorations */}
      {showDecorations && template === 'greek_marble' && (
        <>
          {/* Ionic columns */}
          <mesh position={[3.3, 2.5, 4.3]}>
            <cylinderGeometry args={[0.25, 0.3, 5, 12]} />
            <meshLambertMaterial color="#E8E4DC" />
          </mesh>
          <mesh position={[-3.3, 2.5, 4.3]}>
            <cylinderGeometry args={[0.25, 0.3, 5, 12]} />
            <meshLambertMaterial color="#E8E4DC" />
          </mesh>
          {/* Column capitals */}
          <mesh position={[3.3, 5.2, 4.3]}>
            <boxGeometry args={[0.7, 0.3, 0.7]} />
            <meshLambertMaterial color="#D4CFC4" />
          </mesh>
          <mesh position={[-3.3, 5.2, 4.3]}>
            <boxGeometry args={[0.7, 0.3, 0.7]} />
            <meshLambertMaterial color="#D4CFC4" />
          </mesh>
          {/* Pediment */}
          <mesh position={[0, 6.8, 4]} rotation={[Math.PI/2, 0, 0]}>
            <coneGeometry args={[4, 1, 3]} />
            <meshLambertMaterial color="#E8E4DC" />
          </mesh>
        </>
      )}

      {/* Art Deco - Geometric art deco patterns */}
      {showDecorations && template === 'art_deco' && (
        <>
          {/* Sunburst pattern top */}
          {[...Array(5)].map((_, i) => (
            <mesh key={`ray-${i}`} position={[0, 6.5, 4.1]} rotation={[0, 0, (i - 2) * 0.3]}>
              <boxGeometry args={[0.08, 0.8, 0.05]} />
              <meshBasicMaterial color={isNight ? "#E8B923" : "#C9A227"} />
            </mesh>
          ))}
          {/* Vertical gold strips */}
          <mesh position={[2.5, 3, 4.08]}>
            <boxGeometry args={[0.1, 5.5, 0.05]} />
            <meshBasicMaterial color="#E8B923" />
          </mesh>
          <mesh position={[-2.5, 3, 4.08]}>
            <boxGeometry args={[0.1, 5.5, 0.05]} />
            <meshBasicMaterial color="#E8B923" />
          </mesh>
          {/* Bottom gold band */}
          <mesh position={[0, 0.15, 4.1]}>
            <boxGeometry args={[8, 0.2, 0.1]} />
            <meshBasicMaterial color="#E8B923" />
          </mesh>
        </>
      )}

      {/* Japanese Zen - Minimalist Japanese decorations */}
      {showDecorations && template === 'japanese_zen' && (
        <>
          {/* Red torii-style top */}
          <mesh position={[0, 6.4, 4.2]}>
            <boxGeometry args={[8.5, 0.2, 0.3]} />
            <meshBasicMaterial color="#C41E3A" />
          </mesh>
          <mesh position={[3.8, 5.5, 4.2]}>
            <boxGeometry args={[0.25, 2, 0.25]} />
            <meshBasicMaterial color="#C41E3A" />
          </mesh>
          <mesh position={[-3.8, 5.5, 4.2]}>
            <boxGeometry args={[0.25, 2, 0.25]} />
            <meshBasicMaterial color="#C41E3A" />
          </mesh>
          {/* Paper lantern */}
          <mesh position={[0, 6.8, 4.5]}>
            <sphereGeometry args={[0.4, 8, 8]} />
            <meshBasicMaterial color={isNight ? "#FFDDDD" : "#FFE4E4"} />
          </mesh>
        </>
      )}

      {/* Neon Cyberpunk - Heavy neon decorations */}
      {showDecorations && template === 'neon_cyberpunk' && (
        <>
          {/* Multiple neon strips */}
          <mesh position={[0, 6.3, 4.15]}>
            <boxGeometry args={[8.2, 0.08, 0.08]} />
            <meshBasicMaterial color={isNight ? "#FF00FF" : "#AA00AA"} />
          </mesh>
          <mesh position={[0, 5.8, 4.15]}>
            <boxGeometry args={[7.5, 0.05, 0.05]} />
            <meshBasicMaterial color={isNight ? "#00FFFF" : "#00AAAA"} />
          </mesh>
          <mesh position={[0, 0.1, 4.15]}>
            <boxGeometry args={[8.2, 0.08, 0.08]} />
            <meshBasicMaterial color={isNight ? "#00FFFF" : "#00AAAA"} />
          </mesh>
          {/* Side neon strips */}
          <mesh position={[3.95, 3, 4.15]}>
            <boxGeometry args={[0.08, 6, 0.08]} />
            <meshBasicMaterial color={isNight ? "#FF00FF" : "#AA00AA"} />
          </mesh>
          <mesh position={[-3.95, 3, 4.15]}>
            <boxGeometry args={[0.08, 6, 0.08]} />
            <meshBasicMaterial color={isNight ? "#FF00FF" : "#AA00AA"} />
          </mesh>
          {/* Cross pattern */}
          <mesh position={[3.5, 1, 4.1]}>
            <boxGeometry args={[0.05, 1.5, 0.05]} />
            <meshBasicMaterial color="#FF0080" />
          </mesh>
          <mesh position={[-3.5, 1, 4.1]}>
            <boxGeometry args={[0.05, 1.5, 0.05]} />
            <meshBasicMaterial color="#FF0080" />
          </mesh>
        </>
      )}
    </group>
  );
};

export default BrandedShop;
