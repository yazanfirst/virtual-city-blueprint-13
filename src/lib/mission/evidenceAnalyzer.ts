import { EligibleShop } from './eligibility';
import { Position3D } from '@/hooks/use3DShops';
import { supabase } from '@/integrations/supabase/client';

// City landmarks for positional clues
const LANDMARKS = {
  fountain: { x: 0, z: 0, name: 'central fountain' },
  northPark: { x: 45, z: 42, name: 'north park' },
  southPark: { x: -45, z: 42, name: 'south park' },
  eastGate: { x: 78, z: 0, name: 'electronics gate' },
  westGate: { x: -78, z: 0, name: 'food street gate' },
  eastLake: { x: 58, z: 48, name: 'east lake' },
  westLake: { x: -55, z: -48, name: 'west lake' },
};

export interface NeighborData {
  leftNeighbor: EligibleShop | null;
  rightNeighbor: EligibleShop | null;
  hasEmptySide: boolean;
  sameCategory: boolean;
  differentCategories: string[];
}

export interface LandmarkProximity {
  name: string;
  distance: number;
  direction: 'north' | 'south' | 'east' | 'west' | 'near';
}

export interface ShopEvidence {
  neighbors: NeighborData;
  landmarks: LandmarkProximity[];
  streetPosition: 'main_boulevard' | 'cross_street';
  streetSide: 'north' | 'south' | 'east' | 'west';
  isCornerShop: boolean;
  itemKeywords: string[];
}

// Get item keywords from shop_items
export async function extractItemKeywords(shopId: string): Promise<string[]> {
  const { data } = await supabase
    .from('shop_items')
    .select('title, description')
    .eq('shop_id', shopId)
    .limit(5);

  if (!data) return [];

  const keywords: string[] = [];
  
  for (const item of data) {
    // Extract meaningful words from title
    if (item.title) {
      const words = item.title.toLowerCase().split(/[\s\-_]+/);
      keywords.push(...words.filter(w => w.length > 2));
    }
    // Extract words from description
    if (item.description) {
      const words = item.description.toLowerCase().split(/[\s\-_,\.]+/);
      keywords.push(...words.filter(w => w.length > 3));
    }
  }

  // Return unique keywords
  return [...new Set(keywords)].slice(0, 10);
}

// Analyze shop's neighbors
export function getNeighborRelationships(
  targetShop: EligibleShop,
  allShops: EligibleShop[]
): NeighborData {
  const targetPos = targetShop.position3d;
  const isMainBoulevard = Math.abs(targetPos.x) === 18;
  
  let leftNeighbor: EligibleShop | null = null;
  let rightNeighbor: EligibleShop | null = null;
  let minLeftDist = Infinity;
  let minRightDist = Infinity;

  for (const shop of allShops) {
    if (shop.shopId === targetShop.shopId) continue;
    
    const shopPos = shop.position3d;
    
    if (isMainBoulevard) {
      // Main boulevard - neighbors are above/below (z axis)
      if (shopPos.x === targetPos.x) {
        const zDiff = shopPos.z - targetPos.z;
        if (zDiff > 0 && zDiff < minRightDist) {
          rightNeighbor = shop;
          minRightDist = zDiff;
        } else if (zDiff < 0 && Math.abs(zDiff) < minLeftDist) {
          leftNeighbor = shop;
          minLeftDist = Math.abs(zDiff);
        }
      }
    } else {
      // Cross street - neighbors are left/right (x axis)
      if (shopPos.z === targetPos.z) {
        const xDiff = shopPos.x - targetPos.x;
        if (xDiff > 0 && xDiff < minRightDist) {
          rightNeighbor = shop;
          minRightDist = xDiff;
        } else if (xDiff < 0 && Math.abs(xDiff) < minLeftDist) {
          leftNeighbor = shop;
          minLeftDist = Math.abs(xDiff);
        }
      }
    }
  }

  const categories = new Set<string>();
  if (leftNeighbor) categories.add(leftNeighbor.category);
  if (rightNeighbor) categories.add(rightNeighbor.category);
  categories.delete(targetShop.category);

  return {
    leftNeighbor,
    rightNeighbor,
    hasEmptySide: !leftNeighbor || !rightNeighbor,
    sameCategory: leftNeighbor?.category === targetShop.category || rightNeighbor?.category === targetShop.category,
    differentCategories: [...categories],
  };
}

// Get landmark proximity
export function getLandmarkProximity(position: Position3D): LandmarkProximity[] {
  const proximities: LandmarkProximity[] = [];

  for (const [, landmark] of Object.entries(LANDMARKS)) {
    const dx = landmark.x - position.x;
    const dz = landmark.z - position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    let direction: LandmarkProximity['direction'] = 'near';
    if (Math.abs(dx) > Math.abs(dz)) {
      direction = dx > 0 ? 'east' : 'west';
    } else {
      direction = dz > 0 ? 'north' : 'south';
    }

    if (distance < 15) direction = 'near';

    proximities.push({
      name: landmark.name,
      distance,
      direction,
    });
  }

  return proximities.sort((a, b) => a.distance - b.distance);
}

// Determine shop street position
export function getStreetPosition(position: Position3D): {
  street: 'main_boulevard' | 'cross_street';
  side: 'north' | 'south' | 'east' | 'west';
  isCorner: boolean;
} {
  const isMainBoulevard = Math.abs(position.x) === 18;
  
  if (isMainBoulevard) {
    return {
      street: 'main_boulevard',
      side: position.x > 0 ? 'east' : 'west',
      isCorner: Math.abs(position.z) < 20, // Near intersection
    };
  } else {
    return {
      street: 'cross_street',
      side: position.z > 0 ? 'north' : 'south',
      isCorner: Math.abs(position.x) < 40, // Near main boulevard
    };
  }
}

// Main analysis function
export async function analyzeShopContext(
  targetShop: EligibleShop,
  allShops: EligibleShop[]
): Promise<ShopEvidence> {
  const neighbors = getNeighborRelationships(targetShop, allShops);
  const landmarks = getLandmarkProximity(targetShop.position3d);
  const streetInfo = getStreetPosition(targetShop.position3d);
  const itemKeywords = await extractItemKeywords(targetShop.shopId);

  return {
    neighbors,
    landmarks,
    streetPosition: streetInfo.street,
    streetSide: streetInfo.side,
    isCornerShop: streetInfo.isCorner,
    itemKeywords,
  };
}
