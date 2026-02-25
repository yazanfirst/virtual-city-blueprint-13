import React, { useMemo, useState, useRef } from "react";
import { Html, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ShopBranding } from "@/hooks/use3DShops";
import { useShopRating } from "@/hooks/useShopRatings";

interface BrandedShopProps {
  branding: ShopBranding;
  isNight: boolean;
  onClick?: () => void;
}

// Template-specific colors
const templateColors = {
  modern_neon: { bg: "#1A1A2A", roof: "#0A0A1A", window: "#6A9ACC", accent: "#FF00FF", glow: "#FF00FF" },
  minimal_white: { bg: "#F5F5F5", roof: "#E8E8E8", window: "#87CEEB", accent: "#333333", glow: "#FFFFFF" },
  classic_brick: { bg: "#8B4513", roof: "#654321", window: "#87CEEB", accent: "#D4A574", glow: "#FFD700" },
  cyber_tech: { bg: "#1A0030", roof: "#0A0020", window: "#9966FF", accent: "#00FFFF", glow: "#00FFFF" },
  luxury_gold: { bg: "#1A1A1A", roof: "#0D0D0D", window: "#D4AF37", accent: "#FFD700", glow: "#FFD700" },
  urban_industrial: { bg: "#3D3D3D", roof: "#2A2A2A", window: "#708090", accent: "#FF6B35", glow: "#FF6B35" },
  retro_vintage: { bg: "#F4E4C1", roof: "#C9B896", window: "#87CEEB", accent: "#E85D04", glow: "#E85D04" },
  nature_organic: { bg: "#2D5016", roof: "#1E3A0F", window: "#90EE90", accent: "#FFB347", glow: "#90EE90" },
  led_display: { bg: "#0A0A0A", roof: "#050505", window: "#00FF00", accent: "#FF0080", glow: "#00FF00" },
  pharaoh_gold: { bg: "#2A1810", roof: "#1A0F0A", window: "#C9A227", accent: "#FFD700", glow: "#FFD700" },
  greek_marble: { bg: "#E8E4DC", roof: "#D4CFC4", window: "#87CEEB", accent: "#1E3A5F", glow: "#FFFFFF" },
  art_deco: { bg: "#1A1A2E", roof: "#0F0F1A", window: "#C9A227", accent: "#E8B923", glow: "#E8B923" },
  japanese_zen: { bg: "#2D2A26", roof: "#1E1C18", window: "#C41E3A", accent: "#FF6B6B", glow: "#FF6B6B" },
  neon_cyberpunk: { bg: "#0D0221", roof: "#070116", window: "#FF00FF", accent: "#00FFFF", glow: "#FF00FF" },
};

const fontStyles = {
  classic: { fontFamily: "'Times New Roman', Georgia, serif", fontWeight: 400, letterSpacing: '1px' },
  bold: { fontFamily: "'Impact', 'Arial Black', sans-serif", fontWeight: 700, letterSpacing: '2px' },
  elegant: { fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 400, letterSpacing: '3px' },
  modern: { fontFamily: "'Orbitron', 'Courier New', monospace", fontWeight: 500, letterSpacing: '2px' },
  playful: { fontFamily: "'Pacifico', cursive, sans-serif", fontWeight: 400, letterSpacing: '0px' },
};

const textureColors: Record<string, string> = {
  wood: "#8B6914",
  marble: "#E8E4DC",
  brick: "#8B4513",
  metal: "#708090",
  concrete: "#808080",
  fabric: "#6B5B95",
  leather: "#654321",
};

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

// Distance-based Html culling wrapper
function ShopHtmlContent({ 
  shopX, shopZ, children 
}: { 
  shopX: number; shopZ: number; children: React.ReactNode 
}) {
  const [showHtml, setShowHtml] = useState(true);
  const frameCount = useRef(0);

  useFrame(({ camera }) => {
    if (++frameCount.current % 10 !== 0) return;
    const dx = camera.position.x - shopX;
    const dz = camera.position.z - shopZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    setShowHtml(dist < 50);
  });

  if (!showHtml) return null;
  return <>{children}</>;
}

const BrandedShop = ({ branding, isNight, onClick }: BrandedShopProps) => {
  const { position, hasShop, isSuspended, shopName, primaryColor, accentColor, facadeTemplate, logoUrl, signageFont, textureTemplate, textureUrl } = branding;
  const [hovered, setHovered] = useState(false);
  const [textureError, setTextureError] = useState(false);
  const { data: ratingData } = useShopRating(hasShop && !isSuspended ? branding.shopId : undefined);
  
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

  const hasTexture = hasShop && textureUrl && !textureError;
  const hasPresetTexture = hasShop && textureTemplate && textureTemplate !== 'none';
  const buildingColor = hasPresetTexture 
    ? (textureColors[textureTemplate] || primaryHex) 
    : (hasShop ? primaryHex : colors.bg);
  const roofColor = hasShop ? darker : colors.roof;
  const showDecorations = hasShop && !isSuspended;

  // ===== MERGED GEOMETRIES =====
  
  // Group 1: darker color — window frames (8), storefront frames (4), window sills (3), accent lines (2) = 17 → 1
  const darkerMergedGeo = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    
    // Window frames for 2 upper windows at wx = -2 and 2
    [-2, 2].forEach(wx => {
      // Top frame
      const t = new THREE.BoxGeometry(1.66, 0.08, 0.08); t.translate(wx, 5.0, 4.08); geos.push(t);
      // Bottom frame
      const b = new THREE.BoxGeometry(1.66, 0.08, 0.08); b.translate(wx, 3.4, 4.08); geos.push(b);
      // Left frame
      const l = new THREE.BoxGeometry(0.08, 1.5, 0.08); l.translate(wx - 0.79, 4.2, 4.08); geos.push(l);
      // Right frame
      const r = new THREE.BoxGeometry(0.08, 1.5, 0.08); r.translate(wx + 0.79, 4.2, 4.08); geos.push(r);
      // Window sill
      const s = new THREE.BoxGeometry(1.7, 0.1, 0.15); s.translate(wx, 3.35, 4.15); geos.push(s);
    });
    
    // Storefront frames
    const sf1 = new THREE.BoxGeometry(4.16, 0.08, 0.08); sf1.translate(0.8, 3.25, 4.08); geos.push(sf1);
    const sf2 = new THREE.BoxGeometry(4.16, 0.08, 0.08); sf2.translate(0.8, 0.35, 4.08); geos.push(sf2);
    const sf3 = new THREE.BoxGeometry(0.08, 2.8, 0.08); sf3.translate(-1.24, 1.8, 4.08); geos.push(sf3);
    const sf4 = new THREE.BoxGeometry(0.08, 2.8, 0.08); sf4.translate(2.84, 1.8, 4.08); geos.push(sf4);
    
    // Storefront sill
    const ss = new THREE.BoxGeometry(4.2, 0.1, 0.15); ss.translate(0.8, 0.3, 4.15); geos.push(ss);
    
    // Side wall accent lines
    const al1 = new THREE.BoxGeometry(0.05, 0.1, 8); al1.translate(4.05, 3.5, 0); geos.push(al1);
    const al2 = new THREE.BoxGeometry(0.05, 0.1, 8); al2.translate(-4.05, 3.5, 0); geos.push(al2);
    
    // Ridge cap
    const rc = new THREE.BoxGeometry(0.3, 0.1, 8.4); rc.translate(0, 6.95, 0); geos.push(rc);
    
    return mergeGeometries(geos);
  }, []);

  // Group 2: door frame #3A2A1A — 3 meshes → 1
  const doorFrameGeo = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    const df1 = new THREE.BoxGeometry(0.08, 3.1, 0.12); df1.translate(-2.05, 1.5, 4.05); geos.push(df1);
    const df2 = new THREE.BoxGeometry(0.08, 3.1, 0.12); df2.translate(-3.55, 1.5, 4.05); geos.push(df2);
    const df3 = new THREE.BoxGeometry(1.58, 0.08, 0.12); df3.translate(-2.8, 3.05, 4.05); geos.push(df3);
    return mergeGeometries(geos);
  }, []);

  // Group 3: roof color — base slab + 2 slopes + 2 pillars = 4 → 1
  // Note: slopes have rotation so we use applyMatrix4
  const roofMergedGeo = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    
    // Base slab
    const base = new THREE.BoxGeometry(8.6, 0.15, 8.6); base.translate(0, 6.1, 0); geos.push(base);
    
    // Left slope
    const leftSlope = new THREE.BoxGeometry(4.5, 0.12, 8.2);
    const leftMat = new THREE.Matrix4();
    leftMat.makeRotationZ(0.38);
    leftMat.setPosition(-2.1, 6.55, 0);
    leftSlope.applyMatrix4(leftMat);
    geos.push(leftSlope);
    
    // Right slope
    const rightSlope = new THREE.BoxGeometry(4.5, 0.12, 8.2);
    const rightMat = new THREE.Matrix4();
    rightMat.makeRotationZ(-0.38);
    rightMat.setPosition(2.1, 6.55, 0);
    rightSlope.applyMatrix4(rightMat);
    geos.push(rightSlope);
    
    // Pillars (cylinders)
    const pillar1 = new THREE.CylinderGeometry(0.12, 0.12, 6, 8);
    pillar1.translate(3.8, 3, 4.2);
    geos.push(pillar1);
    
    const pillar2 = new THREE.CylinderGeometry(0.12, 0.12, 6, 8);
    pillar2.translate(-3.8, 3, 4.2);
    geos.push(pillar2);
    
    return mergeGeometries(geos);
  }, []);

  // Group 4: awning — 2 meshes → 1 (awning body + fascia)
  // The awning has rotation, so we use applyMatrix4
  const awningGeo = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    
    const awning = new THREE.BoxGeometry(7, 0.25, 1.5);
    const awningMat = new THREE.Matrix4();
    awningMat.makeRotationX(-0.2);
    awningMat.setPosition(0, 3.5, 4.8);
    awning.applyMatrix4(awningMat);
    geos.push(awning);
    
    return mergeGeometries(geos);
  }, []);

  const fasciaGeo = useMemo(() => {
    const fascia = new THREE.BoxGeometry(7, 0.3, 0.06);
    const fasciaMat = new THREE.Matrix4();
    fasciaMat.makeRotationX(-0.2);
    fasciaMat.setPosition(0, 3.35, 5.5);
    fascia.applyMatrix4(fasciaMat);
    return fascia;
  }, []);

  const pointerDownRef = React.useRef<{ x: number; y: number; time: number } | null>(null);

  return (
    <group 
      position={[position.x, 0, position.z]} 
      rotation={[0, position.rotation, 0]}
      onPointerDown={(e) => {
        e.stopPropagation();
        pointerDownRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        if (!pointerDownRef.current) return;
        const dx = e.clientX - pointerDownRef.current.x;
        const dy = e.clientY - pointerDownRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const elapsed = Date.now() - pointerDownRef.current.time;
        if (dist < 10 && elapsed < 300) onClick?.();
        pointerDownRef.current = null;
      }}
      onClick={(e) => { e.stopPropagation(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      {/* Main body */}
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
      
      {/* Sidewalk */}
      <mesh position={[0, 0.075, 5]}>
        <boxGeometry args={[9, 0.15, 2.5]} />
        <meshLambertMaterial color={isNight ? "#666666" : "#888888"} />
      </mesh>

      {/* Merged roof geometry (base + slopes + pillars) */}
      <mesh geometry={roofMergedGeo}>
        <meshLambertMaterial color={isNight ? "#2A2A3A" : roofColor} />
      </mesh>
      
      {/* Windows (emissive, can't merge easily due to night emissive) */}
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

      {/* Merged darker geometry (frames + sills + accent lines + ridge cap) */}
      <mesh geometry={darkerMergedGeo}>
        <meshLambertMaterial color={darker} />
      </mesh>
      
      {/* Storefront window (emissive) */}
      <mesh position={[0.8, 1.8, 4.05]}>
        <boxGeometry args={[4, 2.8, 0.1]} />
        <meshLambertMaterial 
          color={isNight ? colors.window : "#87CEEB"} 
          emissive={isNight ? accentHex : "#000000"} 
          emissiveIntensity={isNight ? 0.5 : 0} 
        />
      </mesh>
      
      {/* Door (recessed) */}
      <mesh position={[-2.8, 1.5, 3.85]}>
        <boxGeometry args={[1.5, 3, 0.1]} />
        <meshLambertMaterial color="#4A3A2A" />
      </mesh>
      
      {/* Merged door frame */}
      <mesh geometry={doorFrameGeo}>
        <meshLambertMaterial color="#3A2A1A" />
      </mesh>
      
      {/* Door handle */}
      <mesh position={[-2.25, 1.5, 3.95]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshLambertMaterial color="#C0C0C0" />
      </mesh>
      
      {/* Merged awning */}
      <mesh geometry={awningGeo}>
        <meshLambertMaterial color={hasShop ? accentHex : darker} />
      </mesh>
      <mesh geometry={fasciaGeo}>
        <meshLambertMaterial color={hasShop ? darker : "#555555"} />
      </mesh>

      {/* Signboard - always render 3D meshes */}
      <group position={[0, 5.2, 4.3]}>
        <mesh>
          <boxGeometry args={[5.5, 1.8, 0.2]} />
          <meshBasicMaterial color={hasShop ? (isSuspended ? '#3A3A3A' : primaryHex) : '#F5F0E8'} />
        </mesh>
        <mesh position={[0, 0, 0.1]}>
          <boxGeometry args={[5.6, 1.9, 0.02]} />
          <meshBasicMaterial color={hasShop ? darker : '#D4CBC0'} />
        </mesh>
        
        {/* Html overlays — distance-culled */}
        <ShopHtmlContent shopX={position.x} shopZ={position.z}>
          {hasShop ? (
            <Html
              position={[0, 0, 0.16]}
              transform
              occlude
              center
              scale={1.2}
              zIndexRange={[0, 0]}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                width: '180px',
                pointerEvents: 'none',
              }}
            >
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Shop logo"
                  style={{
                    width: '44px',
                    height: '44px',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    flexShrink: 0,
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                  }}
                />
              )}
              <div
                style={{
                  fontFamily: font.fontFamily,
                  fontWeight: font.fontWeight,
                  letterSpacing: font.letterSpacing,
                  fontSize:
                    shopName && shopName.length > 14
                      ? '10px'
                      : shopName && shopName.length > 10
                        ? '12px'
                        : '14px',
                  color: isSuspended ? '#999999' : '#FFFFFF',
                  textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textTransform: signageFont === 'elegant' ? 'uppercase' : 'none',
                  textAlign: 'center',
                  maxWidth: '170px',
                  lineHeight: '1.2',
                }}
              >
                {shopName || "SHOP"}
              </div>
            </Html>
          ) : (
            <Html
              position={[0, 0, 0.16]}
              transform
              occlude
              center
              scale={1.2}
              zIndexRange={[0, 0]}
              style={{ pointerEvents: 'none' }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
                  color: '#2A2A2A',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                }}
              >
                FOR RENT
              </div>
            </Html>
          )}
          
          {hasShop && isSuspended && (
            <Html
              position={[0, -1.1, 0.18]}
              transform
              occlude
              center
              zIndexRange={[0, 0]}
              style={{ pointerEvents: 'none' }}
            >
              <div
                style={{
                  backgroundColor: '#1A1A1A',
                  color: '#FFFFFF',
                  padding: '3px 14px',
                  borderRadius: '2px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  fontFamily: 'Arial, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '3px',
                }}
              >
                CLOSED
              </div>
            </Html>
          )}
        </ShopHtmlContent>
      </group>

      {/* Star Rating — distance-culled */}
      {hasShop && !isSuspended && ratingData && ratingData.totalRatings > 0 && (
        <ShopHtmlContent shopX={position.x} shopZ={position.z}>
          <Html
            position={[0, 3.2, 4.35]}
            transform
            occlude
            center
            zIndexRange={[0, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: '2px 8px',
              borderRadius: '10px',
              whiteSpace: 'nowrap',
            }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} style={{
                  color: ratingData.averageRating >= star ? '#fbbf24' : '#555',
                  fontSize: '12px',
                }}>★</span>
              ))}
              <span style={{ color: '#ccc', fontSize: '10px', marginLeft: '3px' }}>
                {ratingData.averageRating.toFixed(1)}
              </span>
            </div>
          </Html>
        </ShopHtmlContent>
      )}

      {hovered && hasShop && (
        <mesh position={[0, 3, 4.1]}>
          <boxGeometry args={[8.2, 6.2, 0.1]} />
          <meshBasicMaterial color={primaryHex} transparent opacity={0.3} />
        </mesh>
      )}
      
      {/* ========== TEMPLATE-SPECIFIC DECORATIONS ========== */}
      
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

      {showDecorations && template === 'led_display' && (
        <>
          <mesh position={[0, 6.3, 4.15]}>
            <boxGeometry args={[8.2, 0.1, 0.1]} />
            <meshBasicMaterial color={isNight ? "#00FF00" : "#00AA00"} />
          </mesh>
          <mesh position={[0, 0.05, 4.15]}>
            <boxGeometry args={[8.2, 0.1, 0.1]} />
            <meshBasicMaterial color={isNight ? "#FF0080" : "#AA0055"} />
          </mesh>
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

      {showDecorations && template === 'pharaoh_gold' && (
        <>
          <mesh position={[3.5, 2.5, 4.2]}>
            <cylinderGeometry args={[0.2, 0.25, 5, 8]} />
            <meshBasicMaterial color="#C9A227" />
          </mesh>
          <mesh position={[-3.5, 2.5, 4.2]}>
            <cylinderGeometry args={[0.2, 0.25, 5, 8]} />
            <meshBasicMaterial color="#C9A227" />
          </mesh>
          <mesh position={[0, 6.1, 4.2]}>
            <boxGeometry args={[7.5, 0.2, 0.2]} />
            <meshBasicMaterial color="#FFD700" />
          </mesh>
          <mesh position={[0, 6.8, 0]} rotation={[0, Math.PI/4, 0]}>
            <coneGeometry args={[0.8, 1, 4]} />
            <meshBasicMaterial color="#FFD700" />
          </mesh>
        </>
      )}

      {showDecorations && template === 'greek_marble' && (
        <>
          <mesh position={[3.3, 2.5, 4.3]}>
            <cylinderGeometry args={[0.25, 0.3, 5, 12]} />
            <meshLambertMaterial color="#E8E4DC" />
          </mesh>
          <mesh position={[-3.3, 2.5, 4.3]}>
            <cylinderGeometry args={[0.25, 0.3, 5, 12]} />
            <meshLambertMaterial color="#E8E4DC" />
          </mesh>
          <mesh position={[3.3, 5.2, 4.3]}>
            <boxGeometry args={[0.7, 0.3, 0.7]} />
            <meshLambertMaterial color="#D4CFC4" />
          </mesh>
          <mesh position={[-3.3, 5.2, 4.3]}>
            <boxGeometry args={[0.7, 0.3, 0.7]} />
            <meshLambertMaterial color="#D4CFC4" />
          </mesh>
          <mesh position={[0, 6.8, 4]} rotation={[Math.PI/2, 0, 0]}>
            <coneGeometry args={[4, 1, 3]} />
            <meshLambertMaterial color="#E8E4DC" />
          </mesh>
        </>
      )}

      {showDecorations && template === 'art_deco' && (
        <>
          {[...Array(5)].map((_, i) => (
            <mesh key={`ray-${i}`} position={[0, 6.5, 4.1]} rotation={[0, 0, (i - 2) * 0.3]}>
              <boxGeometry args={[0.08, 0.8, 0.05]} />
              <meshBasicMaterial color={isNight ? "#E8B923" : "#C9A227"} />
            </mesh>
          ))}
          <mesh position={[2.5, 3, 4.08]}>
            <boxGeometry args={[0.1, 5.5, 0.05]} />
            <meshBasicMaterial color="#E8B923" />
          </mesh>
          <mesh position={[-2.5, 3, 4.08]}>
            <boxGeometry args={[0.1, 5.5, 0.05]} />
            <meshBasicMaterial color="#E8B923" />
          </mesh>
          <mesh position={[0, 0.15, 4.1]}>
            <boxGeometry args={[8, 0.2, 0.1]} />
            <meshBasicMaterial color="#E8B923" />
          </mesh>
        </>
      )}

      {showDecorations && template === 'japanese_zen' && (
        <>
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
          <mesh position={[0, 6.8, 4.5]}>
            <sphereGeometry args={[0.4, 8, 8]} />
            <meshBasicMaterial color={isNight ? "#FFDDDD" : "#FFE4E4"} />
          </mesh>
        </>
      )}

      {showDecorations && template === 'neon_cyberpunk' && (
        <>
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
          <mesh position={[3.95, 3, 4.15]}>
            <boxGeometry args={[0.08, 6, 0.08]} />
            <meshBasicMaterial color={isNight ? "#FF00FF" : "#AA00AA"} />
          </mesh>
          <mesh position={[-3.95, 3, 4.15]}>
            <boxGeometry args={[0.08, 6, 0.08]} />
            <meshBasicMaterial color={isNight ? "#FF00FF" : "#AA00AA"} />
          </mesh>
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
