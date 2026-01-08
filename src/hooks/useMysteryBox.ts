import { useMemo, useCallback } from 'react';
import { useAllSpotsForStreet, transformToShopBranding, ShopBranding } from './use3DShops';
import { useMissionStore, EligibleShop } from '@/stores/missionStore';
import { useGameStore } from '@/stores/gameStore';
import { generateSessionSeed } from '@/config/mystery-box.config';
import { generateClues, generateIndicators, selectTargetShop } from '@/lib/clue-engine';

// Transform ShopBranding to EligibleShop format
function toEligibleShop(branding: ShopBranding): EligibleShop | null {
  if (!branding.hasShop || !branding.shopId || branding.isSuspended) {
    return null;
  }
  
  if (!branding.category) {
    return null;
  }
  
  return {
    shopId: branding.shopId,
    spotId: branding.spotId,
    name: branding.shopName || 'Unknown Shop',
    category: branding.category,
    position: branding.position,
    primaryColor: branding.primaryColor,
    accentColor: branding.accentColor,
  };
}

export function useEligibleShops(streetSlug: string) {
  const { data: spotsWithShops, isLoading } = useAllSpotsForStreet(streetSlug);
  
  const eligibleShops = useMemo(() => {
    if (!spotsWithShops) return [];
    
    const brandings = transformToShopBranding(spotsWithShops);
    
    return brandings
      .map(toEligibleShop)
      .filter((shop): shop is EligibleShop => shop !== null);
  }, [spotsWithShops]);
  
  return { eligibleShops, isLoading };
}

export function useMysteryBoxMission(streetSlug: string) {
  const { eligibleShops, isLoading } = useEligibleShops(streetSlug);
  const { shopsVisited, addCoins, addXP } = useGameStore();
  
  const {
    missionActive,
    targetShopId,
    targetShopPosition,
    clues,
    indicators,
    shopsVisitedThisMission,
    boxCollected,
    missionFailed,
    startMission,
    visitShop,
    collectBox,
    revealNextClue,
    resetMission,
    getVisitsRemaining,
    canVisitMoreShops,
    getRevealedClues,
    getUnrevealedClueCount,
  } = useMissionStore();
  
  // Start a new mystery box mission
  const initMission = useCallback(() => {
    if (eligibleShops.length < 3) {
      console.warn('Not enough eligible shops for mystery box mission');
      return false;
    }
    
    const seed = generateSessionSeed();
    const target = selectTargetShop(eligibleShops, shopsVisited, seed);
    const missionClues = generateClues(target, eligibleShops, seed);
    const missionIndicators = generateIndicators(target, eligibleShops, seed);
    
    startMission(target, missionClues, missionIndicators, seed);
    return true;
  }, [eligibleShops, shopsVisited, startMission]);
  
  // Handle shop visit during mission
  const handleShopVisit = useCallback((shopId: string) => {
    if (!missionActive) return { success: true, isTarget: false };
    
    const success = visitShop(shopId);
    const isTarget = shopId === targetShopId;
    
    return { success, isTarget };
  }, [missionActive, visitShop, targetShopId]);
  
  // Handle box collection
  const handleCollectBox = useCallback(() => {
    const reward = collectBox();
    
    if (reward.coins > 0) {
      addCoins(reward.coins);
    }
    if (reward.xp > 0) {
      addXP(reward.xp);
    }
    
    return reward;
  }, [collectBox, addCoins, addXP]);
  
  // Get mystery box position (offset from target shop)
  const boxPosition = useMemo(() => {
    if (!targetShopPosition) return null;
    
    // Offset the box slightly in front of the shop
    return {
      x: targetShopPosition.x,
      y: 0.5, // Slightly above ground
      z: targetShopPosition.z + 3, // In front of shop
    };
  }, [targetShopPosition]);
  
  return {
    // State
    isLoading,
    missionActive,
    targetShopId,
    boxPosition,
    clues,
    indicators,
    shopsVisitedThisMission: Array.from(shopsVisitedThisMission),
    boxCollected,
    missionFailed,
    eligibleShopCount: eligibleShops.length,
    
    // Actions
    initMission,
    handleShopVisit,
    handleCollectBox,
    revealNextClue,
    resetMission,
    
    // Computed
    visitsRemaining: getVisitsRemaining(),
    canVisitMore: canVisitMoreShops(),
    revealedClues: getRevealedClues(),
    unrevealedClueCount: getUnrevealedClueCount(),
  };
}
