import {
  SYMBOLIC_CLUES,
  SPATIAL_CLUES,
  EXCLUSIONARY_CLUES,
  INDICATOR_CONFIGS,
  MISSION_CONFIG,
  createSeededRandom,
  IndicatorType,
  DecoyTell,
  SymbolicClueTemplate,
  SpatialClueTemplate,
  ExclusionaryClueTemplate,
} from '@/config/mystery-box.config';
import { MissionClue, MissionIndicator, EligibleShop } from '@/stores/missionStore';

const DECOY_TELLS: DecoyTell[] = ['glitch', 'fade', 'reversed', 'cold'];
const INDICATOR_TYPES: IndicatorType[] = ['billboard', 'arrow', 'glow', 'flag', 'flicker'];

// Apply a clue template to filter candidates
function applySymbolicClue(
  candidates: EligibleShop[],
  template: SymbolicClueTemplate
): EligibleShop[] {
  return candidates.filter(shop => 
    template.categories.some(cat => 
      shop.category.toLowerCase().includes(cat.toLowerCase())
    )
  );
}

function applySpatialClue(
  candidates: EligibleShop[],
  template: SpatialClueTemplate,
  allShops: EligibleShop[]
): EligibleShop[] {
  const positions = allShops.map(s => ({ x: s.position.x, z: s.position.z }));
  return candidates.filter(shop => 
    template.filterFn(shop.position.x, shop.position.z, positions)
  );
}

function applyExclusionaryClue(
  candidates: EligibleShop[],
  template: ExclusionaryClueTemplate
): EligibleShop[] {
  return candidates.filter(shop => {
    // Category exclusion
    if (template.excludeCategories) {
      const isExcluded = template.excludeCategories.some(cat =>
        shop.category.toLowerCase().includes(cat.toLowerCase())
      );
      if (isExcluded) return false;
    }
    
    // Position exclusion
    if (template.filterFn) {
      return template.filterFn(shop.position.x, shop.position.z);
    }
    
    return true;
  });
}

// Find matching symbolic clues for a target shop
function findMatchingSymbolicClues(target: EligibleShop): SymbolicClueTemplate[] {
  return SYMBOLIC_CLUES.filter(template =>
    template.categories.some(cat =>
      target.category.toLowerCase().includes(cat.toLowerCase())
    )
  );
}

// Find matching spatial clues for a target shop
function findMatchingSpatialClues(target: EligibleShop, allShops: EligibleShop[]): SpatialClueTemplate[] {
  const positions = allShops.map(s => ({ x: s.position.x, z: s.position.z }));
  return SPATIAL_CLUES.filter(template =>
    template.filterFn(target.position.x, target.position.z, positions)
  );
}

// Find matching exclusionary clues for a target shop
function findMatchingExclusionaryClues(target: EligibleShop): ExclusionaryClueTemplate[] {
  return EXCLUSIONARY_CLUES.filter(template => {
    // Check category exclusion doesn't exclude target
    if (template.excludeCategories) {
      const targetExcluded = template.excludeCategories.some(cat =>
        target.category.toLowerCase().includes(cat.toLowerCase())
      );
      if (targetExcluded) return false;
    }
    
    // Check position filter includes target
    if (template.filterFn) {
      return template.filterFn(target.position.x, target.position.z);
    }
    
    return true;
  });
}

// Validate that clues narrow down to acceptable candidate count
function validateClues(
  clues: { symbolic?: SymbolicClueTemplate; spatial?: SpatialClueTemplate; exclusionary?: ExclusionaryClueTemplate },
  target: EligibleShop,
  allShops: EligibleShop[]
): { valid: boolean; candidateCount: number } {
  let candidates = [...allShops];
  
  if (clues.symbolic) {
    candidates = applySymbolicClue(candidates, clues.symbolic);
  }
  
  if (clues.spatial) {
    candidates = applySpatialClue(candidates, clues.spatial, allShops);
  }
  
  if (clues.exclusionary) {
    candidates = applyExclusionaryClue(candidates, clues.exclusionary);
  }
  
  const targetIncluded = candidates.some(c => c.shopId === target.shopId);
  const candidateCount = candidates.length;
  
  // Valid if target is included and candidates are narrowed to 1-2
  return {
    valid: targetIncluded && candidateCount >= 1 && candidateCount <= 2,
    candidateCount,
  };
}

// Main clue generation function
export function generateClues(
  target: EligibleShop,
  allShops: EligibleShop[],
  seed: number
): MissionClue[] {
  const rng = createSeededRandom(seed);
  
  // Find all matching templates for target
  const matchingSymbolic = findMatchingSymbolicClues(target);
  const matchingSpatial = findMatchingSpatialClues(target, allShops);
  const matchingExclusionary = findMatchingExclusionaryClues(target);
  
  // Try different combinations until we find one that validates
  const maxAttempts = 20;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const symbolicClue = matchingSymbolic.length > 0
      ? matchingSymbolic[Math.floor(rng() * matchingSymbolic.length)]
      : null;
    
    const spatialClue = matchingSpatial.length > 0
      ? matchingSpatial[Math.floor(rng() * matchingSpatial.length)]
      : null;
    
    const exclusionaryClue = matchingExclusionary.length > 0
      ? matchingExclusionary[Math.floor(rng() * matchingExclusionary.length)]
      : null;
    
    const validation = validateClues(
      { symbolic: symbolicClue || undefined, spatial: spatialClue || undefined, exclusionary: exclusionaryClue || undefined },
      target,
      allShops
    );
    
    if (validation.valid) {
      const clues: MissionClue[] = [];
      
      if (symbolicClue) {
        clues.push({
          id: symbolicClue.id,
          type: 'symbolic',
          text: symbolicClue.pattern,
          revealed: true, // First clue is always revealed
        });
      }
      
      if (spatialClue) {
        clues.push({
          id: spatialClue.id,
          type: 'spatial',
          text: spatialClue.pattern,
          revealed: clues.length === 0, // Reveal if no symbolic clue
        });
      }
      
      if (exclusionaryClue) {
        clues.push({
          id: exclusionaryClue.id,
          type: 'exclusionary',
          text: exclusionaryClue.pattern,
          revealed: clues.length === 0, // Reveal only if no other clues
        });
      }
      
      // Ensure at least one clue is revealed
      if (clues.length > 0 && !clues.some(c => c.revealed)) {
        clues[0].revealed = true;
      }
      
      return clues;
    }
  }
  
  // Fallback: return a generic clue set
  const fallbackClues: MissionClue[] = [
    {
      id: 'generic_category',
      type: 'symbolic',
      text: `Seek where "${target.category}" finds its home.`,
      revealed: true,
    },
    {
      id: 'generic_position',
      type: 'spatial',
      text: target.position.x > 0 
        ? 'The prize hides on the right side of the street.'
        : 'The prize hides on the left side of the street.',
      revealed: false,
    },
  ];
  
  return fallbackClues;
}

// Generate indicators for the mission
export function generateIndicators(
  target: EligibleShop,
  allShops: EligibleShop[],
  seed: number
): MissionIndicator[] {
  const rng = createSeededRandom(seed + 1000); // Offset seed for indicator generation
  const indicators: MissionIndicator[] = [];
  
  // Choose indicator type for this session
  const indicatorType = INDICATOR_TYPES[Math.floor(rng() * INDICATOR_TYPES.length)];
  
  // Add true indicator on target
  indicators.push({
    shopId: target.shopId,
    position: { x: target.position.x, z: target.position.z },
    type: indicatorType,
    isDecoy: false,
  });
  
  // Determine number of decoys (0-2)
  const decoyCount = Math.floor(rng() * (MISSION_CONFIG.maxDecoyIndicators + 1));
  
  // Get wrong shops for decoys
  const wrongShops = allShops.filter(s => s.shopId !== target.shopId);
  
  // Shuffle wrong shops using seeded random
  const shuffledWrong = [...wrongShops].sort(() => rng() - 0.5);
  
  // Add decoy indicators
  for (let i = 0; i < decoyCount && i < shuffledWrong.length; i++) {
    const decoyShop = shuffledWrong[i];
    const decoyTell = DECOY_TELLS[Math.floor(rng() * DECOY_TELLS.length)];
    
    indicators.push({
      shopId: decoyShop.shopId,
      position: { x: decoyShop.position.x, z: decoyShop.position.z },
      type: indicatorType, // Same type but with tell
      isDecoy: true,
      decoyTell,
    });
  }
  
  return indicators;
}

// Select target shop using weighted random
export function selectTargetShop(
  eligibleShops: EligibleShop[],
  visitedShopIds: Set<string>,
  seed: number
): EligibleShop {
  const rng = createSeededRandom(seed);
  
  // Calculate weights
  const weighted = eligibleShops.map(shop => {
    let weight = 1;
    
    // Prefer unvisited shops (3x weight)
    if (!visitedShopIds.has(shop.shopId)) {
      weight *= 3;
    }
    
    // Prefer shops with custom colors (slightly)
    if (shop.primaryColor && shop.primaryColor !== '#3B82F6') {
      weight *= 1.2;
    }
    
    // Prefer shops with specific categories
    if (shop.category && shop.category.length > 0) {
      weight *= 1.3;
    }
    
    return { shop, weight };
  });
  
  // Weighted random selection
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let random = rng() * totalWeight;
  
  for (const { shop, weight } of weighted) {
    random -= weight;
    if (random <= 0) return shop;
  }
  
  // Fallback
  return eligibleShops[Math.floor(rng() * eligibleShops.length)];
}
