type FacadeTemplate = "modern_neon" | "minimal_white" | "classic_brick" | "cyber_tech";

interface ShopPreviewProps {
  name: string;
  primaryColor: string;
  accentColor: string;
  facadeTemplate: FacadeTemplate;
  logoUrl?: string;
}

const templateStyles: Record<FacadeTemplate, {
  bg: string;
  border: string;
  text: string;
  signBg: string;
}> = {
  modern_neon: {
    bg: "bg-slate-900",
    border: "border-slate-700",
    text: "text-white",
    signBg: "bg-slate-800",
  },
  minimal_white: {
    bg: "bg-white",
    border: "border-gray-200",
    text: "text-gray-900",
    signBg: "bg-gray-100",
  },
  classic_brick: {
    bg: "bg-amber-800",
    border: "border-amber-900",
    text: "text-amber-50",
    signBg: "bg-amber-900",
  },
  cyber_tech: {
    bg: "bg-purple-950",
    border: "border-purple-700",
    text: "text-purple-100",
    signBg: "bg-purple-900",
  },
};

const ShopPreview = ({
  name,
  primaryColor,
  accentColor,
  facadeTemplate,
  logoUrl,
}: ShopPreviewProps) => {
  const styles = templateStyles[facadeTemplate];

  return (
    <div className={`relative w-full aspect-[4/3] rounded-lg overflow-hidden ${styles.bg} ${styles.border} border-2`}>
      {/* Building facade */}
      <div className="absolute inset-0 p-4 flex flex-col">
        {/* Top section with accent stripe */}
        <div 
          className="h-2 w-full rounded-t"
          style={{ backgroundColor: accentColor }}
        />
        
        {/* Sign area */}
        <div 
          className={`flex-1 flex flex-col items-center justify-center ${styles.signBg} rounded-lg mt-2 p-4 relative overflow-hidden`}
        >
          {/* Neon glow effect for modern_neon */}
          {facadeTemplate === 'modern_neon' && (
            <div 
              className="absolute inset-0 opacity-30"
              style={{ 
                background: `radial-gradient(ellipse at center, ${primaryColor}40 0%, transparent 70%)` 
              }}
            />
          )}
          
          {/* Logo */}
          {logoUrl && (
            <div className="mb-2 w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
              <img 
                src={logoUrl} 
                alt="Shop logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Shop name */}
          <h3 
            className={`font-display text-xl font-bold text-center ${styles.text} relative z-10`}
            style={{ 
              textShadow: facadeTemplate === 'modern_neon' ? `0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}` : 'none',
              color: facadeTemplate === 'modern_neon' ? primaryColor : undefined,
            }}
          >
            {name || "Shop Name"}
          </h3>
          
          {/* Cyber tech pattern */}
          {facadeTemplate === 'cyber_tech' && (
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <pattern id="cyber-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M0 10 L10 0 L20 10 L10 20 Z" fill="none" stroke={primaryColor} strokeWidth="0.5" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#cyber-pattern)" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Storefront window */}
        <div className="h-20 mt-2 rounded-lg bg-sky-200/30 border border-sky-300/50 flex items-center justify-center">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Storefront</span>
        </div>
        
        {/* Awning */}
        <div 
          className="h-4 mt-2 rounded"
          style={{ 
            backgroundColor: primaryColor,
            boxShadow: `0 4px 10px ${primaryColor}40`
          }}
        />
      </div>
    </div>
  );
};

export default ShopPreview;
