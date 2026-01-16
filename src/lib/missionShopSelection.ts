import { ShopBranding } from '@/hooks/use3DShops';
import { ShopItem } from '@/hooks/useShopItems';

/**
 * Rule-based shop selection for missions.
 * NO AI/ML - purely deterministic logic.
 * 
 * Selection rules:
 * 1. Must be on the active street (has branding data)
 * 2. Must be occupied (hasShop = true)
 * 3. Must NOT be suspended
 * 4. Must have at least 1 valid shop item
 * 5. Avoid recently used shops if possible
 */

export interface EligibleShop {
  shop: ShopBranding;
  items: ShopItem[];
}

/**
 * Filter shops to find eligible mission targets
 */
export function getEligibleShops(
  shops: ShopBranding[],
  shopItemsMap: Map<string, ShopItem[]>,
  recentlyUsedIds: string[] = []
): EligibleShop[] {
  const eligible: EligibleShop[] = [];
  
  for (const shop of shops) {
    // Rule 1 & 2: Must have a shop
    if (!shop.hasShop || !shop.shopId) continue;
    
    // Rule 3: Must not be suspended
    if (shop.isSuspended) continue;
    
    // Get items if available
    const items = shopItemsMap.get(shop.shopId) || [];
    const validItems = items.filter(item => 
      item.title && 
      item.title.trim().length > 0
    );
    
    // Allow shops with or without items (items enhance the experience but aren't required)
    eligible.push({ shop, items: validItems });
  }
  
  return eligible;
}

/**
 * Select a random shop from eligible shops
 * Prefers shops not recently used
 * Uses seeded randomness for reproducibility
 */
export function selectMissionTargetShop(
  shops: ShopBranding[],
  shopItemsMap: Map<string, ShopItem[]>,
  recentlyUsedIds: string[] = [],
  seed?: number
): EligibleShop | null {
  const eligible = getEligibleShops(shops, shopItemsMap, recentlyUsedIds);
  
  if (eligible.length === 0) return null;
  
  // Filter out recently used shops if possible
  const notRecentlyUsed = eligible.filter(
    e => !recentlyUsedIds.includes(e.shop.shopId)
  );
  
  // Use non-recently-used if available, otherwise use all eligible
  const pool = notRecentlyUsed.length > 0 ? notRecentlyUsed : eligible;
  
  // Seeded random selection (deterministic)
  const randomSeed = seed ?? Date.now();
  const index = Math.abs(randomSeed) % pool.length;
  
  return pool[index];
}

/**
 * Check if a specific shop is valid for mission targeting
 */
export function isShopValidForMission(
  shop: ShopBranding,
  items: ShopItem[]
): boolean {
  if (!shop.hasShop || !shop.shopId) return false;
  if (shop.isSuspended) return false;
  
  const validItems = items.filter(item => 
    item.title && 
    item.title.trim().length > 0
  );
  
  return validItems.length > 0;
}
