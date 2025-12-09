import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Target, User, Store, AlertCircle, Maximize2, Minimize2, Sun, Moon, ZoomIn, Move, UserCircle, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStreetBySlug } from "@/hooks/useStreets";
import { useAllSpotsForStreet, transformToShopBranding, ShopBranding } from "@/hooks/use3DShops";
import CityScene, { CameraView } from "@/components/3d/CityScene";

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
  const [isMaximized, setIsMaximized] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<"day" | "night">("day");
  const [cameraView, setCameraView] = useState<CameraView>("thirdPerson");
  const [selectedShop, setSelectedShop] = useState<ShopBranding | null>(null);

  // Transform spots data to shop brandings
  const shopBrandings = spotsData ? transformToShopBranding(spotsData) : [];

  // Request fullscreen + landscape orientation when maximized on mobile
  useEffect(() => {
    const requestFullscreenLandscape = async () => {
      if (!isMaximized) return;
      
      try {
        // First request fullscreen (required for orientation lock on most browsers)
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if ((docEl as any).webkitRequestFullscreen) {
          await (docEl as any).webkitRequestFullscreen();
        }
        
        // Then try to lock to landscape
        if ('screen' in window && 'orientation' in screen) {
          await (screen.orientation as any).lock?.('landscape');
        }
      } catch {
        // Silently fail if not supported
      }
    };

    const exitFullscreen = async () => {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        
        if ('screen' in window && 'orientation' in screen) {
          (screen.orientation as any).unlock?.();
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
    return (
      <div className="fixed inset-0 z-50 bg-background">
        {/* Full-screen 3D Scene */}
        <div className="relative h-full w-full">
          <CityScene 
            streetId={street.id} 
            timeOfDay={timeOfDay} 
            cameraView={cameraView}
            shopBrandings={shopBrandings}
            onShopClick={setSelectedShop}
          />
          
          {/* Top Controls Bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto">
              <Button variant="ghost" size="icon" asChild className="bg-background/80 backdrop-blur-md">
                <Link to="/city-map">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="bg-background/80 backdrop-blur-md rounded-lg px-4 py-2">
                <h1 className="font-display text-lg font-bold text-foreground">
                  {street.name}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Camera View - Only third person on mobile */}
              <div className="bg-background/80 backdrop-blur-md rounded-lg p-1 flex gap-1 hidden md:flex">
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

              {/* Day/Night Toggle */}
              <div className="bg-background/80 backdrop-blur-md rounded-lg p-1 flex gap-1">
                <Button
                  variant={timeOfDay === "day" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeOfDay("day")}
                  className="h-8 px-3"
                >
                  <Sun className="h-4 w-4 mr-1" />
                  Day
                </Button>
                <Button
                  variant={timeOfDay === "night" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeOfDay("night")}
                  className="h-8 px-3"
                >
                  <Moon className="h-4 w-4 mr-1" />
                  Night
                </Button>
              </div>
              
              {/* Exit Game Mode */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMaximized(false)}
                className="bg-background/80 backdrop-blur-md"
              >
                <Minimize2 className="h-4 w-4 mr-2" />
                Exit Game Mode
              </Button>
            </div>
          </div>
          
          {/* Overlay Panels */}
          <div className="absolute top-20 left-4 pointer-events-auto">
            <OverlayPanel title="Missions" icon={Target} className="w-48">
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-primary" />
                  Visit 3 shops
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                  Find hidden item
                </li>
              </ul>
            </OverlayPanel>
          </div>
          
          <div className="absolute bottom-4 right-4 pointer-events-auto flex flex-col gap-2">
            <OverlayPanel title="Player" icon={User} className="w-40">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Level</span>
                  <span className="text-foreground">1</span>
                </div>
                <div className="flex justify-between">
                  <span>Coins</span>
                  <span className="text-primary">500</span>
                </div>
              </div>
            </OverlayPanel>
            
            <OverlayPanel title="Shop" icon={Store} className="w-48">
              {selectedShop?.hasShop ? (
                <div className="space-y-2">
                  <p className="text-foreground font-medium">{selectedShop.shopName}</p>
                  {selectedShop.category && <p className="text-xs">{selectedShop.category}</p>}
                  {selectedShop.externalLink && (
                    <a 
                      href={selectedShop.externalLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline text-xs"
                    >
                      Visit Store <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ) : (
                <p>Click a shop to view details</p>
              )}
            </OverlayPanel>
          </div>
        </div>
      </div>
    );
  }

  // Normal 3-Column Layout
  return (
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
                onShopClick={setSelectedShop}
              />
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
  );
};

export default StreetView;
