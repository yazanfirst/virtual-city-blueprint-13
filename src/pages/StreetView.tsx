import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, Store, AlertCircle, Minimize2, Sun, Moon, UserCircle, Eye, ExternalLink, Map, Coins, Trophy, X, Maximize2, ZoomIn, Move, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStreetBySlug, useSpotsWithShops } from "@/hooks/useStreets";
import { useAllSpotsForStreet, transformToShopBranding, ShopBranding } from "@/hooks/use3DShops";
import CityScene, { CameraView } from "@/components/3d/CityScene";
import ShopDetailModal from "@/components/3d/ShopDetailModal";
import ShopInteriorRoom from "@/components/3d/ShopInteriorRoom";
import SpotSelectionMap from "@/components/merchant/SpotSelectionMap";
import { useGameStore } from "@/stores/gameStore";

const PanelBox = ({ 
  title,
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon: React.ComponentType<{ className?: string }>;
  children?: React.ReactNode;
}) => (
  <div className="cyber-card h-full">
    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
        {title}
      </h3>
    </div>
    <div className="text-muted-foreground text-sm">
      {children || "Content coming soon..."}
    </div>
  </div>
);

const StreetView = () => {
  const { streetId } = useParams<{ streetId: string }>();
  const { data: street, isLoading } = useStreetBySlug(streetId || "");
  const { data: spotsData } = useAllSpotsForStreet(streetId || "");
  const { data: spotsWithShops } = useSpotsWithShops(street?.id || "");
  const [isMaximized, setIsMaximized] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<"day" | "night">("day");
  const [cameraView, setCameraView] = useState<CameraView>("thirdPerson");
  const [selectedShop, setSelectedShop] = useState<ShopBranding | null>(null);
  const [showShopModal, setShowShopModal] = useState(false);
  const [show2DMap, setShow2DMap] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [isInsideShop, setIsInsideShop] = useState(false);
  const [interiorShop, setInteriorShop] = useState<ShopBranding | null>(null);

  // Game state
  const { coins, level, xp } = useGameStore();

  // Find the spot ID for the selected shop (to highlight in 2D map)
  const selectedSpotId = selectedShop?.spotId || "";

  const handleShopClick = (shop: ShopBranding) => {
    setSelectedShop(shop);
    setShowShopModal(true);
  };

  const handleEnterShop = (shop: ShopBranding) => {
    setInteriorShop(shop);
    setIsInsideShop(true);
    setShowShopModal(false);
  };

  const handleExitShop = () => {
    setIsInsideShop(false);
  };

  // Transform spots data to shop brandings
  const shopBrandings = spotsData ? transformToShopBranding(spotsData) : [];

  // Request fullscreen + landscape orientation when maximized on mobile
  useEffect(() => {
    const requestFullscreenLandscape = async () => {
      if (!isMaximized) return;

      try {
        // First request fullscreen (required for orientation lock on most browsers)
        const docEl = document.documentElement as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>;
        };
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        }

        // Then try to lock to landscape
        if ('screen' in window && 'orientation' in screen) {
          const orientation = screen.orientation as ScreenOrientation & {
            lock?: (orientation: string) => Promise<void>;
          };
          await orientation.lock?.('landscape');
        }
      } catch {
        // Silently fail if not supported
      }
    };

    const exitFullscreen = async () => {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else {
          const docWithWebkit = document as Document & {
            webkitExitFullscreen?: () => Promise<void>;
          };
          await docWithWebkit.webkitExitFullscreen?.();
        }

        if ('screen' in window && 'orientation' in screen) {
          const orientation = screen.orientation as ScreenOrientation & {
            unlock?: () => void;
          };
          orientation.unlock?.();
        }
      } catch {
        // Silently fail
      }
    };

    if (isMaximized) {
      requestFullscreenLandscape();
    } else {
      exitFullscreen();
    }

    return () => {
      exitFullscreen();
    };
  }, [isMaximized]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading street...</div>
      </div>
    );
  }

  if (!street || !street.is_active) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-secondary/10 border border-secondary/30 mb-6">
              <AlertCircle className="h-8 w-8 text-secondary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-3">
              This street is coming soon
            </h1>
            <p className="text-muted-foreground mb-8">
              We're working on bringing this street to life.
            </p>
            <Button variant="cyber" asChild>
              <Link to="/city-map">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to City Map
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Compact overlay panel for game mode
  const OverlayPanel = ({
    title, 
    icon: Icon, 
    children,
    className = ""
  }: { 
    title: string; 
    icon: React.ComponentType<{ className?: string }>;
    children?: React.ReactNode;
    className?: string;
  }) => (
    <div className={`bg-background/80 backdrop-blur-md border border-border/50 rounded-lg p-3 shadow-lg pointer-events-auto ${className}`}>
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/30">
        <Icon className="h-3 w-3 text-primary" />
        <span className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
          {title}
        </span>
      </div>
      <div className="text-muted-foreground text-xs">
        {children}
      </div>
    </div>
  );

  // Game Mode (Maximized) Layout
  if (isMaximized) {
    const interiorOverlay = isInsideShop && interiorShop ? (
      <ShopInteriorRoom shop={interiorShop} onExit={handleExitShop} />
    ) : null;

    return (
      <div className="fixed inset-0 z-50 bg-background">
        {/* Full-screen 3D Scene */}
        <div className="relative h-full w-full">
          <CityScene 
            streetId={street.id} 
            timeOfDay={timeOfDay} 
            cameraView={cameraView}
            shopBrandings={shopBrandings}
            onShopClick={handleShopClick}
          />
          
          {/* Shop Detail Modal */}
          {showShopModal && (
            <ShopDetailModal
              shop={selectedShop}
              onClose={() => setShowShopModal(false)}
              onEnterShop={handleEnterShop}
            />
          )}
          
          {/* Top Controls Bar - Compact for mobile */}
          <div className="absolute top-2 md:top-4 left-2 md:left-4 right-2 md:right-4 flex items-center justify-between pointer-events-none" style={{ zIndex: 150 }}>
            <div className="flex items-center gap-1 md:gap-3 pointer-events-auto">
              <Button variant="ghost" size="icon" asChild className="bg-background/80 backdrop-blur-md h-8 w-8 md:h-10 md:w-10">
                <Link to="/city-map">
                  <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                </Link>
              </Button>
              <div className="bg-background/80 backdrop-blur-md rounded-lg px-2 py-1 md:px-4 md:py-2 hidden sm:block">
                <h1 className="font-display text-sm md:text-lg font-bold text-foreground">
                  {street.name}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2 pointer-events-auto">
              {/* Camera View - Only desktop */}
              <div className="bg-background/80 backdrop-blur-md rounded-lg p-1 gap-1 hidden lg:flex">
                <Button
                  variant={cameraView === "thirdPerson" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCameraView("thirdPerson")}
                  className="h-8 px-3"
                >
                  <UserCircle className="h-4 w-4 mr-1" />
                  3rd Person
                </Button>
                <Button
                  variant={cameraView === "firstPerson" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCameraView("firstPerson")}
                  className="h-8 px-3"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  1st Person
                </Button>
              </div>

              {/* Day/Night Toggle - Compact on mobile */}
              <div className="bg-background/80 backdrop-blur-md rounded-lg p-0.5 md:p-1 flex gap-0.5 md:gap-1">
                <Button
                  variant={timeOfDay === "day" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeOfDay("day")}
                  className="h-6 w-6 md:h-8 md:w-8 p-0 md:px-3"
                >
                  <Sun className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
                <Button
                  variant={timeOfDay === "night" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeOfDay("night")}
                  className="h-6 w-6 md:h-8 md:w-8 p-0 md:px-3"
                >
                  <Moon className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </div>
              
              {/* Map Toggle - Mobile friendly */}
              <Button
                variant={show2DMap ? "default" : "outline"}
                size="sm"
                onClick={() => setShow2DMap(!show2DMap)}
                className="bg-background/80 backdrop-blur-md h-6 w-6 md:h-8 md:w-auto p-0 md:px-3"
                style={{ zIndex: 160 }}
              >
                <Map className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">{show2DMap ? "Hide" : "Map"}</span>
              </Button>
              
              {/* Exit Game Mode */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMaximized(false)}
                className="bg-background/80 backdrop-blur-md h-6 md:h-8 px-2 md:px-3"
              >
                <Minimize2 className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">Exit</span>
              </Button>
            </div>
          </div>
          
          {/* Left side - Mission Tab Button */}
          <div className="absolute top-10 md:top-16 left-2 md:left-4 pointer-events-auto" style={{ zIndex: 150 }}>
            <button
              onClick={() => setShowMissions(true)}
              className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-lg bg-background/80 backdrop-blur-md border border-border/50 text-foreground hover:bg-background/90 transition-all shadow-lg"
            >
              <Target className="h-4 w-4 text-primary" />
              <span className="font-display text-xs md:text-sm font-bold uppercase tracking-wider">Missions</span>
            </button>
          </div>
          
          {/* Mission Popup */}
          {showMissions && (
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-auto"
              style={{ zIndex: 200 }}
              onClick={() => setShowMissions(false)}
            >
              <div 
                className="bg-background/95 backdrop-blur-md border border-border/50 rounded-xl p-4 md:p-6 shadow-xl w-[90vw] max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
                      Missions
                    </h3>
                  </div>
                  <button 
                    onClick={() => setShowMissions(false)} 
                    className="text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">Missions coming soon!</p>
                  <p className="text-xs mt-2">Check back later for exciting challenges.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* 2D Map Overlay - Full screen on mobile, positioned on desktop */}
          {show2DMap && spotsWithShops && (
            <div 
              className="absolute inset-0 md:inset-auto md:top-16 md:left-4 flex items-center justify-center md:block pointer-events-auto"
              style={{ zIndex: 200 }}
            >
              <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-lg p-3 md:p-4 shadow-lg w-[90vw] max-w-sm md:max-w-md max-h-[80vh] overflow-auto">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                    <Map className="h-4 w-4 text-primary" />
                    Street Map
                  </h3>
                  <button 
                    onClick={() => setShow2DMap(false)}
                    className="text-muted-foreground hover:text-foreground text-xl leading-none p-1"
                  >
                    ×
                  </button>
                </div>
                <div className="overflow-auto">
                  <div className="transform scale-[0.6] md:scale-75 origin-top-left w-[166%] md:w-[133%]">
                    <SpotSelectionMap
                      spots={spotsWithShops}
                      selectedSpotId=""
                      onSelectSpot={() => {}}
                      highlightedSpotId={selectedSpotId}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Right side - Player & Shop panels - ALWAYS VISIBLE */}
          <div className="absolute top-10 md:top-auto md:bottom-4 right-2 md:right-4 pointer-events-auto flex flex-col gap-1 md:gap-2" style={{ zIndex: 150 }}>
            <OverlayPanel title="Player" icon={User} className="w-28 md:w-40">
              <div className="space-y-0.5 md:space-y-1 text-[10px] md:text-xs">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1"><Trophy className="h-2.5 w-2.5" /> Level</span>
                  <span className="text-foreground font-bold">{level}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1"><Coins className="h-2.5 w-2.5" /> Coins</span>
                  <span className="text-primary font-bold">{coins}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all" 
                    style={{ width: `${(xp % 200) / 2}%` }}
                  />
                </div>
                <div className="text-[8px] text-muted-foreground text-center">
                  {xp % 200}/200 XP
                </div>
              </div>
            </OverlayPanel>
            
            <OverlayPanel title="Shop" icon={Store} className="w-28 md:w-48">
              {selectedShop?.hasShop ? (
                <div className="space-y-1 text-[10px] md:text-xs">
                  <p className="text-foreground font-medium truncate">{selectedShop.shopName}</p>
                  {selectedShop.category && <p className="truncate">{selectedShop.category}</p>}
                  {selectedShop.externalLink && (
                    <a 
                      href={selectedShop.externalLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      Visit <ExternalLink className="h-2 w-2 md:h-3 md:w-3" />
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-[10px] md:text-xs">Click shop for details</p>
              )}
            </OverlayPanel>
          </div>
        </div>
        {interiorOverlay}
      </div>
    );
  }

  const interiorOverlay = isInsideShop && interiorShop ? (
    <ShopInteriorRoom shop={interiorShop} onExit={handleExitShop} />
  ) : null;

  // Normal 3-Column Layout
  return (
    <>
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/city-map">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              {street.name}
            </h1>
            <p className="text-muted-foreground text-sm uppercase tracking-wider">
              {street.category}
            </p>
          </div>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[70vh]">
          {/* Left Column - Missions Panel */}
          <div className="lg:col-span-3">
            <PanelBox title="Missions Panel" icon={Target}>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Visit 3 shops
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  Find the hidden item
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  Talk to an NPC
                </li>
              </ul>
            </PanelBox>
          </div>

          {/* Center Column - 3D Scene */}
          <div className="lg:col-span-6">
            <div className="cyber-card h-full min-h-[400px] lg:min-h-[500px] p-0 overflow-hidden relative">
              {/* Controls Bar */}
              <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
              {/* Camera View - Only desktop */}
              <div className="bg-background/80 backdrop-blur-md rounded-lg p-1 gap-1 hidden md:flex">
                <Button
                  variant={cameraView === "thirdPerson" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCameraView("thirdPerson")}
                  className="h-7 px-2 text-xs"
                  title="Third Person View"
                >
                  <UserCircle className="h-3 w-3 mr-1" />
                  3rd
                </Button>
                <Button
                  variant={cameraView === "firstPerson" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCameraView("firstPerson")}
                  className="h-7 px-2 text-xs"
                  title="First Person View"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  1st
                </Button>
              </div>

                {/* Day/Night Toggle */}
                <div className="bg-background/80 backdrop-blur-md rounded-lg p-1 flex gap-1">
                  <Button
                    variant={timeOfDay === "day" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTimeOfDay("day")}
                    className="h-7 px-2 text-xs"
                  >
                    <Sun className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={timeOfDay === "night" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTimeOfDay("night")}
                    className="h-7 px-2 text-xs"
                  >
                    <Moon className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Maximize Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMaximized(true)}
                  className="h-7 px-2 text-xs bg-background/80 backdrop-blur-md"
                >
                  <Maximize2 className="h-3 w-3 mr-1" />
                  Game Mode
                </Button>
              </div>
              
              {/* Zoom/Controls Hint */}
              <div className="absolute bottom-2 left-2 z-10 bg-background/70 backdrop-blur-md rounded-lg px-3 py-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ZoomIn className="h-3 w-3" /> Scroll to zoom
                </span>
                <span className="flex items-center gap-1">
                  <Move className="h-3 w-3" /> Drag to rotate
                </span>
              </div>
              
              <CityScene 
                streetId={street.id} 
                timeOfDay={timeOfDay} 
                cameraView={cameraView} 
                shopBrandings={shopBrandings}
                onShopClick={handleShopClick}
              />
              
              {/* Shop Detail Modal */}
              {showShopModal && (
                <ShopDetailModal
                  shop={selectedShop}
                  onClose={() => setShowShopModal(false)}
                  onEnterShop={handleEnterShop}
                />
              )}
            </div>
          </div>

          {/* Right Column - Player & Shop Info */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <PanelBox title="Player Panel" icon={User}>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Level</span>
                  <span className="text-foreground">1</span>
                </div>
                <div className="flex justify-between">
                  <span>Coins</span>
                  <span className="text-primary">500</span>
                </div>
                <div className="flex justify-between">
                  <span>XP</span>
                  <span className="text-foreground">0 / 100</span>
                </div>
              </div>
            </PanelBox>

            <PanelBox title="Shop Info Panel" icon={Store}>
              {selectedShop?.hasShop ? (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-foreground font-medium">{selectedShop.shopName}</h4>
                    {selectedShop.category && (
                      <p className="text-xs text-muted-foreground">{selectedShop.category}</p>
                    )}
                  </div>
                  {selectedShop.externalLink && (
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <a 
                        href={selectedShop.externalLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Visit Store
                      </a>
                    </Button>
                  )}
                </div>
              ) : selectedShop ? (
                <div className="space-y-2">
                  <p className="text-foreground font-medium">Spot {selectedShop.spotLabel}</p>
                  <p className="text-xs">This spot is available for rent!</p>
                  <Button variant="cyber" size="sm" asChild className="w-full">
                    <Link to="/merchant/create-shop">Rent This Spot</Link>
                  </Button>
                </div>
              ) : (
                <p>Click on a shop in the 3D scene to view details here.</p>
              )}
            </PanelBox>
          </div>
        </div>
        </div>
      </div>
      {interiorOverlay}
    </>
  );
};

export default StreetView;
