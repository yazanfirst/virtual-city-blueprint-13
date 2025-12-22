/**
 * Food Street Page
 * 
 * Dedicated page for the Food Street zone.
 * Accessed via:
 * 1. Gate trigger (inside city) - player walks through the Food Street gate
 * 2. Outside access (CityMap/menu) - direct navigation
 * 
 * Both paths load the same scene using the same route (/food-street).
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, UserCircle, Eye, Map, Coins, Trophy, User, Target, X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CityScene, { CameraView } from '@/components/3d/CityScene';
import ShopDetailModal from '@/components/3d/ShopDetailModal';
import ShopInteriorRoom from '@/components/3d/ShopInteriorRoom';
import { useGameStore } from '@/stores/gameStore';
import { useAllSpotsForStreet, transformToShopBranding, ShopBranding } from '@/hooks/use3DShops';
import { ZONES_CONFIG } from '@/config/zones.config';

const FoodStreet = () => {
  const location = useLocation();
  const navigationState = (location.state as { outsideEntry?: boolean; fromSource?: string } | null) || {};
  
  // Zone config from static config
  const zoneConfig = ZONES_CONFIG['food_street'];
  
  // State
  const [isMaximized, setIsMaximized] = useState(true); // Default to game mode
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night'>('day');
  const [cameraView, setCameraView] = useState<CameraView>('thirdPerson');
  const [selectedShop, setSelectedShop] = useState<ShopBranding | null>(null);
  const [showShopModal, setShowShopModal] = useState(false);
  const [show2DMap, setShow2DMap] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [isInsideShop, setIsInsideShop] = useState(false);
  const [interiorShop, setInteriorShop] = useState<ShopBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Game state
  const { coins, level, xp } = useGameStore();
  
  // Fetch shop data for this street
  const { data: spotsData, isLoading: spotsLoading } = useAllSpotsForStreet('food-street', { enabled: true });
  const shopBrandings = spotsData ? transformToShopBranding(spotsData) : [];

  // Loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, navigationState.outsideEntry ? 800 : 300);
    return () => clearTimeout(timer);
  }, [navigationState.outsideEntry]);

  // Fullscreen handling
  useEffect(() => {
    const requestFullscreenLandscape = async () => {
      if (!isMaximized) return;
      try {
        const docEl = document.documentElement as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>;
        };
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        }
        if ('screen' in window && 'orientation' in screen) {
          const orientation = screen.orientation as ScreenOrientation & {
            lock?: (orientation: string) => Promise<void>;
          };
          await orientation.lock?.('landscape');
        }
      } catch {
        // Silently fail
      }
    };

    const exitFullscreen = async () => {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
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

  const handleShopClick = useCallback((shop: ShopBranding) => {
    setSelectedShop(shop);
    setShowShopModal(true);
  }, []);

  const handleEnterShop = useCallback((shop: ShopBranding) => {
    setInteriorShop(shop);
    setIsInsideShop(true);
    setShowShopModal(false);
  }, []);

  const handleExitShop = useCallback(() => {
    setIsInsideShop(false);
  }, []);

  // Loading screen
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-6 animate-pulse">
            <Map className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Loading {zoneConfig.name}…
          </h2>
          <p className="text-muted-foreground text-sm">
            Preparing the culinary district
          </p>
          <div className="mt-6 w-48 mx-auto h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-loading-bar" />
          </div>
        </div>
      </div>
    );
  }

  // Shop interior view
  if (isInsideShop && interiorShop) {
    return <ShopInteriorRoom shop={interiorShop} onExit={handleExitShop} />;
  }

  // Overlay panel component
  const OverlayPanel = ({
    title,
    icon: Icon,
    children,
    className = '',
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
      <div className="text-muted-foreground text-xs">{children}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* 3D Scene */}
      <div className="relative h-full w-full">
        <CityScene
          streetId="food-street"
          timeOfDay={timeOfDay}
          cameraView={cameraView}
          shopBrandings={shopBrandings}
          shouldLoadAssets={true}
          onShopClick={handleShopClick}
        />

        {/* Shop Detail Modal */}
        {showShopModal && selectedShop && (
          <ShopDetailModal
            shop={selectedShop}
            onClose={() => setShowShopModal(false)}
            onEnterShop={handleEnterShop}
          />
        )}

        {/* Top Controls */}
        <div className="absolute top-2 md:top-4 left-2 md:left-4 right-2 md:right-4 flex items-center justify-between pointer-events-none" style={{ zIndex: 150 }}>
          <div className="flex items-center gap-1 md:gap-3 pointer-events-auto">
            <Button variant="ghost" size="icon" asChild className="bg-background/80 backdrop-blur-md h-8 w-8 md:h-10 md:w-10">
              <Link to="/city-map">
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </Button>
            <div className="bg-background/80 backdrop-blur-md rounded-lg px-2 py-1 md:px-4 md:py-2 hidden sm:block">
              <h1 className="font-display text-sm md:text-lg font-bold text-foreground">
                {zoneConfig.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2 pointer-events-auto">
            {/* Camera View - Desktop only */}
            <div className="bg-background/80 backdrop-blur-md rounded-lg p-1 gap-1 hidden lg:flex">
              <Button
                variant={cameraView === 'thirdPerson' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCameraView('thirdPerson')}
                className="h-8 px-3"
              >
                <UserCircle className="h-4 w-4 mr-1" />
                3rd Person
              </Button>
              <Button
                variant={cameraView === 'firstPerson' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCameraView('firstPerson')}
                className="h-8 px-3"
              >
                <Eye className="h-4 w-4 mr-1" />
                1st Person
              </Button>
            </div>

            {/* Day/Night Toggle */}
            <div className="bg-background/80 backdrop-blur-md rounded-lg p-0.5 md:p-1 flex gap-0.5 md:gap-1">
              <Button
                variant={timeOfDay === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeOfDay('day')}
                className="h-6 w-6 md:h-8 md:w-8 p-0"
              >
                <Sun className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <Button
                variant={timeOfDay === 'night' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeOfDay('night')}
                className="h-6 w-6 md:h-8 md:w-8 p-0"
              >
                <Moon className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>

            {/* Exit to City */}
            <Button
              variant="outline"
              size="sm"
              asChild
              className="bg-background/80 backdrop-blur-md h-6 md:h-8 px-2 md:px-3"
            >
              <Link to="/city/main-boulevard">
                <Minimize2 className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">Back to City</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Mission Button */}
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
                    Food Street Missions
                  </h3>
                </div>
                <button onClick={() => setShowMissions(false)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Food Street missions coming soon!</p>
                <p className="text-xs mt-2">Discover recipes, collect ingredients, and more.</p>
              </div>
            </div>
          </div>
        )}

        {/* Player Stats Panel */}
        <div className="absolute top-10 md:top-auto md:bottom-4 right-2 md:right-4 pointer-events-auto flex flex-col gap-1 md:gap-2" style={{ zIndex: 150 }}>
          <OverlayPanel title="Player" icon={User} className="w-28 md:w-40">
            <div className="space-y-0.5 md:space-y-1 text-[10px] md:text-xs">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <Trophy className="h-2.5 w-2.5" /> Level
                </span>
                <span className="text-foreground font-bold">{level}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <Coins className="h-2.5 w-2.5" /> Coins
                </span>
                <span className="text-primary font-bold">{coins}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${(xp % 200) / 2}%` }}
                />
              </div>
              <div className="text-[8px] text-muted-foreground text-center">{xp % 200}/200 XP</div>
            </div>
          </OverlayPanel>
        </div>
      </div>
    </div>
  );
};

export default FoodStreet;
