import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Store, AlertCircle, Minimize2, Sun, Moon, UserCircle, Eye, ExternalLink, Coins, Trophy, X, Maximize2, ZoomIn, Move, Target, Heart, Map as MapIcon, Ghost, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStreetBySlug, useSpotsWithShops } from "@/hooks/useStreets";
import { useAllSpotsForStreet, transformToShopBranding, ShopBranding } from "@/hooks/use3DShops";
import { ShopItem } from "@/hooks/useShopItems";
import CityScene, { CameraView } from "@/components/3d/CityScene";
import ShopDetailModal from "@/components/3d/ShopDetailModal";
import ShopInteriorRoom from "@/components/3d/ShopInteriorRoom";
import SpotSelectionMap from "@/components/merchant/SpotSelectionMap";
import MissionPanel from "@/components/mission/MissionPanel";
import GhostHuntPanel from "@/components/mission/GhostHuntPanel";
import GhostHuntUI from "@/components/mission/GhostHuntUI";
import GhostHuntFailedModal from "@/components/mission/GhostHuntFailedModal";
import GhostHuntCompleteModal from "@/components/mission/GhostHuntCompleteModal";
import ZombieMissionCompleteModal from "@/components/mission/ZombieMissionCompleteModal";
import MirrorWorldPanel from "@/components/mission/MirrorWorldPanel";
import MirrorWorldBriefing from "@/components/mission/MirrorWorldBriefing";
import MirrorWorldUI from "@/components/mission/MirrorWorldUI";
import MirrorWorldComplete from "@/components/mission/MirrorWorldComplete";
import MirrorWorldFailed from "@/components/mission/MirrorWorldFailed";
import QuestionModal from "@/components/mission/QuestionModal";
import HealthDisplay from "@/components/mission/HealthDisplay";
import MissionFailedModal from "@/components/mission/MissionFailedModal";
import TrapHitFeedback from "@/components/mission/TrapHitFeedback";
import MissionTimer from "@/components/mission/MissionTimer";
import JumpScareModal from "@/components/mission/JumpScareModal";
import GameStartScreen from "@/components/3d/GameStartScreen";
import ShopProximityIndicator from "@/components/3d/ShopProximityIndicator";
import TutorialTooltip from "@/components/3d/TutorialTooltip";
import { useGameStore } from "@/stores/gameStore";
import { useMissionStore } from "@/stores/missionStore";
import { useGhostHuntStore } from "@/stores/ghostHuntStore";
import { useMirrorWorldStore } from "@/stores/mirrorWorldStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useTutorialProgress } from "@/hooks/useTutorialProgress";
import { generateMissionQuestions } from "@/lib/missionQuestions";
import { selectMissionTargetShop } from "@/lib/missionShopSelection";
import { getEligibleShops } from "@/lib/missionShopSelection";
import { useGameAudio, playSounds } from "@/hooks/useGameAudio";
import { supabase } from "@/integrations/supabase/client";
import { useFlashlightReveal } from "@/hooks/useFlashlightReveal";
import { useGhostTrapCapture } from "@/hooks/useGhostTrapCapture";
import { useDeviceType } from "@/hooks/useDeviceType";

// Shop entry distance threshold (in world units)
const SHOP_ENTRY_DISTANCE = 8;

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
  const navigate = useNavigate();
  const { data: street, isLoading } = useStreetBySlug(streetId || "");
  const { data: spotsData } = useAllSpotsForStreet(streetId || "");
  const { data: spotsWithShops } = useSpotsWithShops(street?.id || "");
  const [isMaximized, setIsMaximized] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<"day" | "night">("day");
  const [cameraView, setCameraView] = useState<CameraView>("thirdPerson");
  const [selectedShop, setSelectedShop] = useState<ShopBranding | null>(null);
  const [showShopModal, setShowShopModal] = useState(false);
  const [show2DMap, setShow2DMap] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [isInsideShop, setIsInsideShop] = useState(false);
  const [interiorShop, setInteriorShop] = useState<ShopBranding | null>(null);
  const [nearbyShop, setNearbyShop] = useState<ShopBranding | null>(null);

  // Game state
  const { coins, level, xp, resetGame } = useGameStore();
  
  // Player state
  const { position: playerPosition, resetToSafeSpawn, resetPlayer, enterShop: playerEnterShop, exitShop: playerExitShop } = usePlayerStore();
  
  // Mission state
  const mission = useMissionStore();
  const ghostHunt = useGhostHuntStore();
  const mirrorWorld = useMirrorWorldStore();
  const deviceType = useDeviceType();
  const isMobile = deviceType === "mobile";
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [showJumpScare, setShowJumpScare] = useState(false);
  const [showGhostHuntFailed, setShowGhostHuntFailed] = useState(false);
  const [showGhostHuntComplete, setShowGhostHuntComplete] = useState(false);
  const [showZombieComplete, setShowZombieComplete] = useState(false);
  const [missionTab, setMissionTab] = useState<'zombie' | 'ghost' | 'mirror'>('zombie');
  const [shopItemsMap, setShopItemsMap] = useState<Map<string, ShopItem[]>>(new Map());
  
  // Game audio
  useGameAudio();
  
  // Flashlight reveal logic for ghost hunt
  useFlashlightReveal();
  
  // Ghost trap capture logic
  useGhostTrapCapture();

  // Tutorial system
  const tutorial = useTutorialProgress();

  // Transform spots data to shop brandings - MUST be before useEffect that uses it
  const shopBrandings = spotsData ? transformToShopBranding(spotsData) : [];
  
  // Get spot IDs for each recharge type (EMF, Flashlight, Trap) for map highlighting
  const rechargeSpotIds = useMemo(() => {
    const ids: { emf: string; flashlight: string; trap: string } = { emf: '', flashlight: '', trap: '' };
    const shopIds = ghostHunt.rechargeShopIds;
    if (shopIds.emf) ids.emf = shopBrandings.find((s) => s.shopId === shopIds.emf)?.spotId ?? '';
    if (shopIds.flashlight) ids.flashlight = shopBrandings.find((s) => s.shopId === shopIds.flashlight)?.spotId ?? '';
    if (shopIds.trap) ids.trap = shopBrandings.find((s) => s.shopId === shopIds.trap)?.spotId ?? '';
    return ids;
  }, [ghostHunt.rechargeShopIds, shopBrandings]);
  
  // Check if any recharge pickups are assigned
  const hasAnyRechargeShop = Boolean(ghostHunt.rechargeShopIds.emf || ghostHunt.rechargeShopIds.flashlight || ghostHunt.rechargeShopIds.trap);

  // Track if user has exited a shop for first time (to show mission intro)
  const [hasExitedShopOnce, setHasExitedShopOnce] = useState(false);

  const isAnyMissionActive = mission.isActive || ghostHunt.isActive || mirrorWorld.isActive;
  const isMissionBlocking = (mission.isActive && mission.phase !== 'completed' && mission.phase !== 'failed') ||
    (ghostHunt.isActive && ghostHunt.phase !== 'completed' && ghostHunt.phase !== 'failed') ||
    (mirrorWorld.isActive && mirrorWorld.phase !== 'completed' && mirrorWorld.phase !== 'failed');
  const activeMissionTab = mirrorWorld.isActive ? 'mirror' : ghostHunt.isActive ? 'ghost' : mission.isActive ? 'zombie' : 'zombie';

  // Tutorial triggers - IN ORDER:
  // 1. Movement tutorial when game starts
  useEffect(() => {
    if (hasGameStarted && isMaximized && !isInsideShop && !isAnyMissionActive) {
      tutorial.showTutorialStep('movement');
    }
  }, [hasGameStarted, isMaximized, isInsideShop, isAnyMissionActive, tutorial]);

  // 2. Shop nearby tutorial
  useEffect(() => {
    if (nearbyShop && hasGameStarted && !isInsideShop && !isAnyMissionActive) {
      tutorial.showTutorialStep('shop_nearby');
    }
  }, [nearbyShop, hasGameStarted, isInsideShop, isAnyMissionActive, tutorial]);

  // 3. Shop exit tutorial (after first exit - not during mission) - introduce missions
  useEffect(() => {
    if (hasExitedShopOnce && !isInsideShop && !isAnyMissionActive) {
      tutorial.showTutorialStep('shop_exit_missions');
    }
  }, [hasExitedShopOnce, isInsideShop, isAnyMissionActive, tutorial]);

  // 4. Mission activated tutorial - right after clicking activate
  useEffect(() => {
    if (mission.isActive && mission.phase === 'escape' && !tutorial.isStepCompleted('mission_activated')) {
      tutorial.showTutorialStep('mission_activated');
    }
  }, [mission.isActive, mission.phase, tutorial]);

  // Question phase - no tutorial needed, questions appear directly

  // PAUSE GAME when ANY popup/modal is active
  const isAnyPopupOpen = tutorial.activeTooltip ||
    showMissions ||
    show2DMap ||
    showShopModal ||
    showQuestionModal ||
    showFailedModal ||
    showJumpScare ||
    showGhostHuntFailed ||
    showGhostHuntComplete ||
    ghostHunt.phase === 'briefing' ||
    mirrorWorld.phase === 'briefing' ||
    mirrorWorld.phase === 'completed' ||
    mirrorWorld.phase === 'failed';
  const hideMobileControls = Boolean(
    tutorial.activeTooltip ||
    showMissions ||
    show2DMap ||
    showShopModal ||
    showQuestionModal ||
    showFailedModal ||
    showJumpScare ||
    showGhostHuntFailed ||
    showGhostHuntComplete ||
    ghostHunt.phase === 'briefing' ||
    mirrorWorld.phase === 'briefing' ||
    mirrorWorld.phase === 'completed' ||
    mirrorWorld.phase === 'failed'
  );
  const hideSidePanels = isMobile && ((ghostHunt.isActive && ghostHunt.phase !== 'inactive') || (mirrorWorld.isActive && mirrorWorld.phase !== 'inactive'));
  
  useEffect(() => {
    if (isAnyPopupOpen) {
      // Pause zombies when any popup is showing
      if (mission.isActive && !mission.zombiesPaused) {
        mission.pauseZombies();
      }
    }
  }, [isAnyPopupOpen, mission.isActive]);

  useEffect(() => {
    if (isAnyMissionActive) {
      tutorial.dismissTooltip();
    }
  }, [isAnyMissionActive, tutorial]);

  useEffect(() => {
    if (mission.phase === 'completed') {
      setShowZombieComplete(true);
    } else {
      setShowZombieComplete(false);
    }
  }, [mission.phase]);

  // Resume game when tutorial tooltip is dismissed
  const handleTutorialDismiss = useCallback(() => {
    tutorial.dismissTooltip();
    // Resume zombies only if no other popups are open
    const otherPopupsOpen = showMissions || show2DMap || showShopModal || showQuestionModal || showFailedModal || showJumpScare;
    if (mission.isActive && mission.phase === 'escape' && !otherPopupsOpen) {
      mission.resumeZombies();
    }
  }, [tutorial, mission, showMissions, show2DMap, showShopModal, showQuestionModal, showFailedModal, showJumpScare]);
  // Fetch all shop items for shops on this street
  useEffect(() => {
    const fetchAllShopItems = async () => {
      if (!shopBrandings || shopBrandings.length === 0) return;
      
      // Get all shop IDs that have shops
      const shopIds = shopBrandings
        .filter(b => b.hasShop && b.shopId)
        .map(b => b.shopId);
      
      if (shopIds.length === 0) return;
      
      const { data, error } = await supabase
        .from('shop_items')
        .select('*')
        .in('shop_id', shopIds);
      
      if (error) {
        console.error('Failed to fetch shop items:', error);
        return;
      }
      
      // Group by shop_id
      const itemsByShop = new Map<string, ShopItem[]>();
      for (const item of data || []) {
        const existing = itemsByShop.get(item.shop_id) || [];
        existing.push(item);
        itemsByShop.set(item.shop_id, existing);
      }
      
      setShopItemsMap(itemsByShop);
    };
    
    fetchAllShopItems();
  }, [shopBrandings.length]); // use length instead of array to avoid infinite loop

  // Select 3 DIFFERENT random shops for EMF, Flashlight, Trap recharges
  useEffect(() => {
    if (!ghostHunt.isActive || ghostHunt.phase !== 'briefing') return;
    // Already assigned
    if (hasAnyRechargeShop) return;
    if (!shopBrandings || shopBrandings.length === 0) return;

    const eligible = getEligibleShops(shopBrandings, shopItemsMap, []);
    if (eligible.length < 3) {
      console.debug('[GhostHunt] Recharge pickup skipped: not enough eligible shops.');
      return;
    }

    // Shuffle eligible shops using current timestamp as seed
    const seed = Date.now();
    const shuffled = [...eligible].sort((a, b) => {
      const hashA = Math.sin(seed + a.shop.spotId.charCodeAt(0)) * 10000;
      const hashB = Math.sin(seed + b.shop.spotId.charCodeAt(0)) * 10000;
      return (hashA - Math.floor(hashA)) - (hashB - Math.floor(hashB));
    });

    const emfShop = shuffled[0]?.shop.shopId ?? null;
    const flashlightShop = shuffled[1]?.shop.shopId ?? null;
    const trapShop = shuffled[2]?.shop.shopId ?? null;

    ghostHunt.setRechargePickups({ emf: emfShop, flashlight: flashlightShop, trap: trapShop });
    console.debug('[GhostHunt] Recharge pickups assigned:', { emf: emfShop, flashlight: flashlightShop, trap: trapShop });
  }, [ghostHunt.isActive, ghostHunt.phase, hasAnyRechargeShop, ghostHunt.setRechargePickups, shopBrandings, shopItemsMap]);

  // Proximity detection - find nearby shop
  useEffect(() => {
    if (!hasGameStarted || isInsideShop) {
      setNearbyShop(null);
      return;
    }

    const [px, , pz] = playerPosition;
    let closest: ShopBranding | null = null;
    let closestDist = Infinity;

    for (const shop of shopBrandings) {
      if (!shop.hasShop || shop.isSuspended) continue;
      
      // Calculate distance to shop front (z+4 offset for front of building)
      const shopFrontX = shop.position.x;
      const shopFrontZ = shop.position.z + Math.cos(shop.position.rotation) * 4;
      const shopFrontXOffset = Math.sin(shop.position.rotation) * 4;
      
      const dx = px - (shopFrontX + shopFrontXOffset);
      const dz = pz - shopFrontZ;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < SHOP_ENTRY_DISTANCE && dist < closestDist) {
        closest = shop;
        closestDist = dist;
      }
    }

    setNearbyShop(closest);
  }, [playerPosition, shopBrandings, hasGameStarted, isInsideShop]);

  // Find the spot ID for the selected shop (to highlight in 2D map)
  const selectedSpotId = selectedShop?.spotId || "";

  // Check if player is close enough to enter shop
  const isPlayerNearShop = (shop: ShopBranding): boolean => {
    const [px, , pz] = playerPosition;
    const shopFrontX = shop.position.x;
    const shopFrontZ = shop.position.z + Math.cos(shop.position.rotation) * 4;
    const shopFrontXOffset = Math.sin(shop.position.rotation) * 4;
    
    const dx = px - (shopFrontX + shopFrontXOffset);
    const dz = pz - shopFrontZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    return dist < SHOP_ENTRY_DISTANCE;
  };

  const handleShopClick = (shop: ShopBranding) => {
    // Check proximity first - player must be near the shop
    if (!isPlayerNearShop(shop)) {
      return; // Too far away, ignore click
    }

    // During mission escape phase, only allow clicking target shop
    if (mission.isActive && mission.phase === 'escape') {
      if (shop.shopId === mission.targetShop?.shopId) {
        mission.enterShop();
        // Save outside state before entering shop
        playerEnterShop();
        setInteriorShop(shop);
        setIsInsideShop(true);
      }
      // Non-target shops are ignored during escape phase
      return;
    }

    // After wrong answer: allow ONE return to the *target* shop (it will trigger the trap)
    if (mission.isActive && mission.phase === 'question' && mission.deceptiveMessageShown) {
      if (shop.shopId === mission.targetShop?.shopId) {
        handleEnterShop(shop);
      }
      return;
    }
    
    // During observation/question phase, don't allow any shop clicks
    if (mission.isActive && (mission.phase === 'observation' || mission.phase === 'question')) {
      return;
    }
    
    // Mission completed or inactive - all shops are clickable normally
    // (This handles both normal mode and post-mission state)
    setSelectedShop(shop);
    setShowShopModal(true);
  };

  const handleEnterShop = (shop: ShopBranding) => {
    // Check for mission trap (second entry after wrong answer)
    if (mission.isActive && mission.deceptiveMessageShown && shop.shopId === mission.targetShop?.shopId) {
      // Trigger jump scare modal (NO sound)
      setShowJumpScare(true);
      mission.triggerTrap();
      return;
    }
    // Save outside state before entering shop (camera + position)
    playerEnterShop();
    setInteriorShop(shop);
    setIsInsideShop(true);
    setShowShopModal(false);
  };

  const handleExitShop = () => {
    // Restore outside state (camera + position) when exiting shop
    playerExitShop();
    setIsInsideShop(false);
    
    // Track first shop exit (not during mission) to show mission intro tutorial
    if (!mission.isActive && !hasExitedShopOnce) {
      setHasExitedShopOnce(true);
    }
    
    // If in mission observation phase, trigger questions
    if (mission.isActive && mission.phase === 'observation') {
      const questions = generateMissionQuestions(
        mission.targetShopItems,
        mission.targetShop?.shopName
      );
      mission.exitShop(questions);
      if (questions.length > 0) {
        setShowQuestionModal(true);
      }
    }
  };
  
  const handleMissionActivate = () => {
    // Mission is now active, night mode will be forced
    ghostHunt.resetMission();
    tutorial.dismissTooltip();
    setShowGhostHuntFailed(false);
    setShowGhostHuntComplete(false);
    setShowFailedModal(false);
  };
  
  const handleZombieTouchPlayer = () => {
    // Don't trigger if protected (spawn protection or other)
    if (mission.isActive && !mission.isProtected && mission.phase !== 'failed') {
      mission.failMission('zombie');
      setShowQuestionModal(false);
      setShowFailedModal(true);
    }
  };
  
  const handleTrapHitPlayer = (trapType: 'firepit' | 'axe' | 'thorns' = 'firepit') => {
    // Don't trigger if protected (spawn protection)
    if (mission.isActive && !mission.isProtected && mission.phase !== 'failed') {
      playSounds.ouch();
      mission.hitByTrap(trapType);
      // Check if lives depleted
      if (mission.lives <= 1) {
        setShowFailedModal(true);
      }
    }
  };
  
  const handleRetryMission = () => {
    setShowFailedModal(false);
    setShowJumpScare(false);
    resetToSafeSpawn(); // Move player to safe position before retry
    mission.resetMission();
    setShowMissions(true); // Show mission panel to start again
  };
  
  const handleExitMission = () => {
    setShowFailedModal(false);
    setShowJumpScare(false);
    resetToSafeSpawn(); // Move player to safe position
    mission.resetMission();
  };

  const handlePauseGame = () => {
    setIsGamePaused(true);
    setIsMaximized(false);
    if (mission.isActive && mission.phase === 'escape') {
      mission.pauseZombies();
    }
    if (mirrorWorld.isActive && mirrorWorld.phase === 'hunting') {
      mirrorWorld.setPaused(true);
    }
  };

  const handleResumeGame = () => {
    setIsGamePaused(false);
    setIsMaximized(true);
    if (mission.isActive && mission.phase === 'escape') {
      mission.resumeZombies();
    }
    if (mirrorWorld.isActive && mirrorWorld.phase === 'hunting') {
      mirrorWorld.setPaused(false);
    }
  };

  const handleExitGame = () => {
    setIsGamePaused(false);
    setIsMaximized(false);
    setHasGameStarted(false);
    setHasExitedShopOnce(false);
    setShowMissions(false);
    setShow2DMap(false);
    setShowShopModal(false);
    setShowQuestionModal(false);
    setShowFailedModal(false);
    setShowJumpScare(false);
    setShowGhostHuntFailed(false);
    setShowGhostHuntComplete(false);
    setSelectedShop(null);
    setInteriorShop(null);
    setIsInsideShop(false);
    setNearbyShop(null);
    playerExitShop();
    resetPlayer();
    resetGame();
    mission.resetMission();
    mission.resetProgress();
    ghostHunt.resetMission();
    ghostHunt.resetProgress();
    mirrorWorld.resetMission();
    mirrorWorld.resetProgress();
  };

  const handleExitToCityMap = () => {
    handleExitGame();
    navigate("/city-map");
  };
  
  const handleQuestionAnswer = (answer: string) => {
    const correct = mission.answerQuestion(answer);
    
    // Freeze ALL zombies for 3 seconds after any question closes
    // This gives player a fair chance to escape even if zombies were close
    mission.freezeAllZombies(3000);
    
    if (!correct) {
      // Wrong answer - close modal, show deceptive message, play notification
      playSounds.notification();
      setShowQuestionModal(false);
    } else if (mission.phase === 'completed') {
      // All correct - mission complete
      setShowQuestionModal(false);
    }
    // Otherwise, next question will show automatically
  };

  // shopBrandings already declared above

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
      <ShopInteriorRoom 
        shop={interiorShop} 
        onExit={handleExitShop} 
        isMissionMode={mission.isActive && mission.phase === 'observation'}
      />
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
            forcedTimeOfDay={(mission.isActive && mission.phase !== 'completed') || (ghostHunt.isActive && ghostHunt.phase === 'hunting') || (mirrorWorld.isActive && mirrorWorld.phase === 'hunting') ? "night" : null}
            onZombieTouchPlayer={handleZombieTouchPlayer}
            onTrapHitPlayer={handleTrapHitPlayer}
            hideMobileControls={hideMobileControls}
          />
          
          {/* Health Display (Lives) - for both missions */}
          {mission.isActive && (
            <div className="absolute top-14 left-2 md:left-4 pointer-events-none" style={{ zIndex: 150 }}>
              <HealthDisplay />
            </div>
          )}

          {/* Zombie Mission Timer */}
          {mission.isActive && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 150 }}>
              <MissionTimer />
            </div>
          )}
          
          {/* Shop Proximity Indicator */}
          <ShopProximityIndicator 
            nearbyShop={nearbyShop} 
            onPress={() => {
              if (nearbyShop) {
                handleShopClick(nearbyShop);
              }
            }}
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
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/80 backdrop-blur-md h-8 w-8 md:h-10 md:w-10"
                onClick={(event) => {
                  event.stopPropagation();
                  handleExitToCityMap();
                }}
                type="button"
                aria-label="Back to city map"
              >
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
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
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setTimeOfDay("day");
                  }}
                  className={`h-8 w-8 md:h-8 md:w-8 p-0 md:px-3 rounded-md flex items-center justify-center touch-manipulation select-none active:scale-95 transition-all ${
                    timeOfDay === "day" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-transparent text-foreground hover:bg-accent"
                  }`}
                  data-control-ignore="true"
                >
                  <Sun className="h-4 w-4 md:h-4 md:w-4" />
                </button>
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setTimeOfDay("night");
                  }}
                  className={`h-8 w-8 md:h-8 md:w-8 p-0 md:px-3 rounded-md flex items-center justify-center touch-manipulation select-none active:scale-95 transition-all ${
                    timeOfDay === "night" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-transparent text-foreground hover:bg-accent"
                  }`}
                  data-control-ignore="true"
                >
                  <Moon className="h-4 w-4 md:h-4 md:w-4" />
                </button>
              </div>
              
              {/* Map Toggle - Mobile friendly */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setShow2DMap(!show2DMap);
                }}
                className={`h-8 w-8 md:h-8 md:w-auto p-0 md:px-3 rounded-md flex items-center justify-center touch-manipulation select-none active:scale-95 transition-all ${
                  show2DMap 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background/80 backdrop-blur-md border border-border text-foreground hover:bg-accent"
                }`}
                style={{ zIndex: 160 }}
                data-control-ignore="true"
              >
                <MapIcon className="h-4 w-4 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">{show2DMap ? "Hide" : "Map"}</span>
              </button>
              
              {/* Exit Game Mode */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handlePauseGame();
                }}
                className="bg-background/80 backdrop-blur-md h-8 md:h-8 px-3 md:px-3 rounded-md border border-border flex items-center justify-center touch-manipulation select-none active:scale-95 transition-all text-foreground hover:bg-accent"
                data-control-ignore="true"
              >
                <Minimize2 className="h-4 w-4 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">Exit</span>
              </button>
            </div>
          </div>
          
          {/* Left side - Mission Tab Button */}
          <div className="absolute top-10 md:top-16 left-2 md:left-4 pointer-events-auto" style={{ zIndex: 150 }}>
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                setMissionTab(isAnyMissionActive ? activeMissionTab : missionTab);
                setShowMissions(true);
                mission.setNotification(false);
                if (mission.isActive && mission.phase === 'escape') {
                  mission.pauseZombies();
                }
              }}
              className="relative flex items-center gap-2 px-4 py-3 md:px-4 md:py-2.5 rounded-lg bg-background/80 backdrop-blur-md border border-border/50 text-foreground hover:bg-background/90 transition-all shadow-lg touch-manipulation select-none active:scale-95"
              data-control-ignore="true"
            >
              <Target className="h-4 w-4 text-primary" />
              <span className="font-display text-xs md:text-sm font-bold uppercase tracking-wider">
                {isMissionBlocking ? 'Mission Guide' : 'Missions'}
              </span>
              {/* Notification indicator */}
              {mission.hasNotification && !isMissionBlocking && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                </span>
              )}
            </button>
          </div>
          
          {/* Mission Popup */}
          {showMissions && (
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-auto"
              style={{ zIndex: 200, touchAction: 'manipulation' }}
              data-control-ignore="true"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={() => {
                setShowMissions(false);
                // Resume zombies when mission panel closes during escape phase (if no other popups open)
                const otherPopupsOpen = tutorial.activeTooltip || show2DMap || showShopModal || showQuestionModal || showFailedModal || showJumpScare;
                if (mission.isActive && mission.phase === 'escape' && !otherPopupsOpen) {
                  mission.resumeZombies();
                }
              }}
            >
              <div 
                className="bg-background/95 backdrop-blur-md border border-border/50 rounded-xl p-4 md:p-6 shadow-xl w-[90vw] max-w-md max-h-[80vh] overflow-auto"
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
                      {isMissionBlocking ? 'Mission Guide' : 'Missions'}
                    </h3>
                  </div>
                  <button 
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setShowMissions(false);
                      const otherPopupsOpen = tutorial.activeTooltip || show2DMap || showShopModal || showQuestionModal || showFailedModal || showJumpScare;
                      if (mission.isActive && mission.phase === 'escape' && !otherPopupsOpen) {
                        mission.resumeZombies();
                      }
                    }}
                    className="text-muted-foreground hover:text-foreground p-3 -m-2 touch-manipulation select-none active:scale-95"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                {/* Mission Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setMissionTab('zombie');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all touch-manipulation active:scale-95 flex items-center justify-center gap-2 ${
                      missionTab === 'zombie'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Target className="h-3 w-3" />
                    Zombie Escape
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setMissionTab('ghost');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all touch-manipulation active:scale-95 flex items-center justify-center gap-2 ${
                      missionTab === 'ghost'
                        ? 'bg-purple-600 text-white'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Ghost className="h-3 w-3" />
                    Ghost Hunt
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setMissionTab('mirror');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all touch-manipulation active:scale-95 flex items-center justify-center gap-2 ${
                      missionTab === 'mirror'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    Mirror World
                  </button>
                </div>
                
                {/* Mission Content */}
                <div className="py-2">
                  {missionTab === 'zombie' && (
                    <MissionPanel
                      shops={shopBrandings}
                      shopItemsMap={shopItemsMap}
                      onActivate={() => {
                        handleMissionActivate();
                        setShowMissions(false);
                      }}
                      disableActivation={isMissionBlocking && !mission.isActive}
                      isCompact
                    />
                  )}
                  {missionTab === 'ghost' && (
                    <GhostHuntPanel
                      onActivate={() => {
                        mission.resetMission();
                        mirrorWorld.resetMission();
                        tutorial.dismissTooltip();
                        setShowQuestionModal(false);
                        setShowFailedModal(false);
                        setShowJumpScare(false);
                        setShowMissions(false);
                      }}
                      disableActivation={isMissionBlocking && !ghostHunt.isActive}
                      isCompact
                    />
                  )}
                  {missionTab === 'mirror' && (
                    <MirrorWorldPanel
                      onActivate={() => {
                        mission.resetMission();
                        ghostHunt.resetMission();
                        resetToSafeSpawn();
                        tutorial.dismissTooltip();
                        setShowQuestionModal(false);
                        setShowFailedModal(false);
                        setShowJumpScare(false);
                        setShowMissions(false);
                      }}
                      disableActivation={isMissionBlocking && !mirrorWorld.isActive}
                      isCompact
                    />
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Ghost Hunt UI Overlay */}
          {ghostHunt.isActive && ghostHunt.phase !== 'inactive' && (
            <GhostHuntUI 
              onComplete={() => setShowGhostHuntComplete(true)}
              onFailed={() => setShowGhostHuntFailed(true)}
            />
          )}

          {/* Mirror World Briefing */}
          {mirrorWorld.isActive && mirrorWorld.phase === 'briefing' && (
            <MirrorWorldBriefing />
          )}

          {/* Mirror World UI Overlay */}
          {mirrorWorld.isActive && mirrorWorld.phase === 'hunting' && (
            <MirrorWorldUI />
          )}

          <MirrorWorldComplete
            isOpen={mirrorWorld.phase === 'completed'}
            nextLevel={Math.min(mirrorWorld.maxLevel, mirrorWorld.unlockedLevel)}
            currentLevel={mirrorWorld.difficultyLevel}
            onContinue={() => {
              const nextLevel = Math.min(mirrorWorld.maxLevel, mirrorWorld.unlockedLevel);
              mirrorWorld.setDifficultyLevel(nextLevel);
              mirrorWorld.resetMission();
              resetToSafeSpawn();
              mirrorWorld.startMission();
            }}
            onExit={() => {
              mirrorWorld.resetMission();
              resetToSafeSpawn();
              setIsInsideShop(false);
              setInteriorShop(null);
            }}
          />

          <MirrorWorldFailed
            isOpen={mirrorWorld.phase === 'failed'}
            onRetry={() => {
              mirrorWorld.resetMission();
              mirrorWorld.startMission();
            }}
            onExit={() => {
              mirrorWorld.resetMission();
              resetToSafeSpawn();
              setIsInsideShop(false);
              setInteriorShop(null);
            }}
          />
          
          {/* Ghost Hunt Failed Modal */}
          {showGhostHuntFailed && (
            <GhostHuntFailedModal
              reason={ghostHunt.timeRemaining <= 0 ? 'time' : 'death'}
              capturedCount={ghostHunt.capturedCount}
              requiredCaptures={ghostHunt.requiredCaptures}
              onRetry={() => {
                setShowGhostHuntFailed(false);
                resetToSafeSpawn();
                ghostHunt.resetMission();
                ghostHunt.startMission();
              }}
              onExit={() => {
                setShowGhostHuntFailed(false);
                resetToSafeSpawn();
                ghostHunt.resetMission();
              }}
            />
          )}
          
          {/* Ghost Hunt Complete Modal */}
          {showGhostHuntComplete && (
            <GhostHuntCompleteModal
              capturedCount={ghostHunt.capturedCount}
              totalGhosts={ghostHunt.totalGhosts}
              currentLevel={ghostHunt.difficultyLevel}
              unlockedLevel={ghostHunt.unlockedLevel}
              maxLevel={ghostHunt.maxLevel}
              timeBonus={Math.floor(ghostHunt.timeRemaining * 2)}
              onContinue={() => {
                const nextLevel = Math.min(ghostHunt.maxLevel, ghostHunt.unlockedLevel);
                ghostHunt.resetMission();
                ghostHunt.setDifficultyLevel(nextLevel);
                ghostHunt.startMission();
                setShowGhostHuntComplete(false);
              }}
              onExit={() => {
                setShowGhostHuntComplete(false);
                ghostHunt.resetMission();
              }}
            />
          )}

          <ZombieMissionCompleteModal
            isOpen={showZombieComplete}
            currentLevel={mission.level}
            unlockedLevel={mission.unlockedLevel}
            maxLevel={mission.maxLevel}
            isAllComplete={mission.level >= mission.maxLevel}
            onContinue={() => {
              const nextLevel = mission.level >= mission.maxLevel ? 1 : Math.min(mission.maxLevel, mission.unlockedLevel);
              mission.resetMission();
              mission.setLevel(nextLevel);
              const selected = selectMissionTargetShop(shopBrandings, shopItemsMap, mission.recentlyUsedShopIds);
              if (selected) {
                mission.activateMission(selected.shop, selected.items);
                handleMissionActivate();
              }
              setShowZombieComplete(false);
            }}
            onExit={() => {
              mission.resetMission();
              setShowZombieComplete(false);
            }}
          />
          
          {/* 2D Map Overlay - Full screen on mobile, positioned on desktop */}
          {show2DMap && spotsWithShops && (
            <div 
              className="absolute inset-0 md:inset-auto md:top-16 md:left-4 flex items-center justify-center md:block pointer-events-auto"
              style={{ zIndex: 200, touchAction: 'manipulation' }}
              data-control-ignore="true"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <div 
                className="bg-background/95 backdrop-blur-md border border-border/50 rounded-lg p-3 md:p-4 shadow-lg w-[90vw] max-w-sm md:max-w-md max-h-[80vh] overflow-auto"
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                    <MapIcon className="h-4 w-4 text-primary" />
                    Street Map
                  </h3>
                  <button 
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setShow2DMap(false);
                    }}
                    className="text-muted-foreground hover:text-foreground p-3 -m-2 touch-manipulation select-none active:scale-95 text-xl leading-none"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="overflow-auto">
                  <div className="transform scale-[0.6] md:scale-75 origin-top-left w-[166%] md:w-[133%]">
                    <SpotSelectionMap
                      spots={spotsWithShops}
                      selectedSpotId=""
                      onSelectSpot={() => {}}
                      highlightedSpotId={ghostHunt.isActive && rechargeSpotIds.emf ? rechargeSpotIds.emf : selectedSpotId}
                      highlightedSpotLabel={ghostHunt.isActive && hasAnyRechargeShop ? 'Recharge Gear (EMF/Flash/Trap)' : undefined}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Right side - Player & Shop panels */}
          {!hideSidePanels && (
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
          )}
        </div>
        {interiorOverlay}
        
        {/* Question Modal */}
        <QuestionModal
          isOpen={showQuestionModal}
          question={mission.questions[mission.currentQuestionIndex] || null}
          onAnswer={handleQuestionAnswer}
          onClose={() => setShowQuestionModal(false)}
          onRecheck={() => {
            // Player tried to re-check - trigger jump scare (same as wrong answer trap)
            setShowQuestionModal(false);
            setShowJumpScare(true);
          }}
        />
        
        {/* Trap Hit Feedback ("Ouch!") */}
        {mission.isActive && <TrapHitFeedback />}
        
        {/* Jump Scare Modal */}
        <JumpScareModal
          isOpen={showJumpScare}
          onRetry={handleRetryMission}
          onExit={handleExitMission}
        />
        
        {/* Mission Failed Modal (for non-jumpscare fails) */}
        <MissionFailedModal
          isOpen={(showFailedModal || mission.phase === 'failed') && !showJumpScare && mission.failReason !== 'jumpscare'}
          failReason={mission.failReason}
          onRetry={handleRetryMission}
          onExit={handleExitMission}
        />
        
        {/* Tutorial Tooltip */}
        {tutorial.activeTooltip && (
          <TutorialTooltip
            step={tutorial.activeTooltip}
            onDismiss={handleTutorialDismiss}
          />
        )}
      </div>
    );
  }

  const interiorOverlay = isInsideShop && interiorShop ? (
    <ShopInteriorRoom 
      shop={interiorShop} 
      onExit={handleExitShop}
      isMissionMode={mission.isActive && mission.phase === 'observation'}
    />
  ) : null;

  // Normal 3-Column Layout
  return (
    <>
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              handleExitToCityMap();
            }}
            type="button"
            aria-label="Back to city map"
          >
            <ArrowLeft className="h-5 w-5" />
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

          {/* Center Column - 3D Scene or Start Screen */}
          <div className="lg:col-span-6">
            <div className="cyber-card h-full min-h-[400px] lg:min-h-[500px] p-0 overflow-hidden relative">
              {!hasGameStarted ? (
                /* Start Game Screen */
                <GameStartScreen 
                  streetName={street.name}
                  category={street.category}
                  onStartGame={() => {
                    setHasGameStarted(true);
                    setIsGamePaused(false);
                    setIsMaximized(true); // Auto fullscreen on start
                  }}
                />
              ) : (
                <>
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
                      <button
                        type="button"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setTimeOfDay("day");
                        }}
                        className={`h-10 w-10 p-0 rounded-md flex items-center justify-center touch-manipulation select-none active:scale-95 transition-all md:h-7 md:w-7 ${
                          timeOfDay === "day" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-transparent text-foreground hover:bg-accent"
                        }`}
                        aria-label="Day mode"
                        data-control-ignore="true"
                      >
                        <Sun className="h-4 w-4 md:h-3 md:w-3" />
                      </button>
                      <button
                        type="button"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setTimeOfDay("night");
                        }}
                        className={`h-10 w-10 p-0 rounded-md flex items-center justify-center touch-manipulation select-none active:scale-95 transition-all md:h-7 md:w-7 ${
                          timeOfDay === "night" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-transparent text-foreground hover:bg-accent"
                        }`}
                        aria-label="Night mode"
                        data-control-ignore="true"
                      >
                        <Moon className="h-4 w-4 md:h-3 md:w-3" />
                      </button>
                    </div>

                    {/* Maximize Button */}
                    <button
                      type="button"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        isGamePaused ? handleResumeGame() : setIsMaximized(true);
                      }}
                      className="h-10 px-3 text-sm rounded-md flex items-center justify-center bg-background/80 backdrop-blur-md border border-border text-foreground touch-manipulation select-none active:scale-95 transition-all hover:bg-accent md:h-7 md:px-2 md:text-xs"
                      data-control-ignore="true"
                    >
                      <Maximize2 className="h-4 w-4 mr-2 md:h-3 md:w-3 md:mr-1" />
                      {isGamePaused ? "Resume" : "Game Mode"}
                    </button>
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
                    forcedTimeOfDay={(mission.isActive && mission.phase !== 'completed') || (ghostHunt.isActive && ghostHunt.phase === 'hunting') || (mirrorWorld.isActive && mirrorWorld.phase === 'hunting') ? "night" : null}
                    onZombieTouchPlayer={handleZombieTouchPlayer}
                    onTrapHitPlayer={handleTrapHitPlayer}
                    hideMobileControls={hideMobileControls}
                  />
                  
                  {/* Shop Proximity Indicator */}
                  <ShopProximityIndicator
                    nearbyShop={nearbyShop}
                    onPress={() => {
                      if (nearbyShop) handleShopClick(nearbyShop);
                    }}
                  />
                  
                  {/* Shop Detail Modal */}
                  {showShopModal && (
                    <ShopDetailModal
                      shop={selectedShop}
                      onClose={() => setShowShopModal(false)}
                      onEnterShop={handleEnterShop}
                    />
                  )}
                </>
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
      {isGamePaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="cyber-card w-[90vw] max-w-md p-6 text-center space-y-5">
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold text-foreground">Game Paused</h2>
              <p className="text-sm text-muted-foreground">
                Resume to continue where you left off, or exit to restart from the beginning.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button variant="cyber" onClick={handleResumeGame}>
                Resume Game
              </Button>
              <Button variant="outline" onClick={handleExitGame}>
                Exit to Start
              </Button>
            </div>
          </div>
        </div>
      )}
      {interiorOverlay}
      
      {/* Trap Hit Feedback ("Ouch!") */}
      {mission.isActive && <TrapHitFeedback />}
      
      {/* Jump Scare Modal */}
      <JumpScareModal
        isOpen={showJumpScare}
        onRetry={handleRetryMission}
        onExit={handleExitMission}
      />
      
      {/* Mission Failed Modal (for non-jumpscare fails) */}
      <MissionFailedModal
        isOpen={(showFailedModal || mission.phase === 'failed') && !showJumpScare && mission.failReason !== 'jumpscare'}
        failReason={mission.failReason}
        onRetry={handleRetryMission}
        onExit={handleExitMission}
      />
    </>
  );
};

export default StreetView;
