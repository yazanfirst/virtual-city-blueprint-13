import { EligibleShop } from './eligibility';
import { seededChoice } from './seededRandom';
import {
  analyzeShopContext,
  ShopEvidence,
  getNeighborRelationships,
  getLandmarkProximity,
  getStreetPosition,
} from './evidenceAnalyzer';

export interface Clue {
  id: number;
  type: 'positional' | 'item' | 'exclusionary';
  text: string;
}

// Positional clue templates using real data
const POSITIONAL_TEMPLATES = [
  (e: ShopEvidence) => e.neighbors.hasEmptySide 
    ? 'The target has an empty spot on one side.' 
    : null,
  (e: ShopEvidence) => e.neighbors.differentCategories.length > 0 
    ? `Look near a shop that sells something different - not ${e.neighbors.differentCategories[0]}.`
    : null,
  (e: ShopEvidence) => e.landmarks[0]?.distance < 30 
    ? `The target is ${e.landmarks[0].direction} of the ${e.landmarks[0].name}.`
    : null,
  (e: ShopEvidence) => e.isCornerShop 
    ? 'The target is near the main intersection.'
    : 'The target is NOT near the intersection.',
  (e: ShopEvidence) => e.streetPosition === 'main_boulevard'
    ? 'Search along the main boulevard, not the cross street.'
    : 'Search along the cross street, not the main boulevard.',
  (e: ShopEvidence) => e.streetSide === 'east' || e.streetSide === 'west'
    ? `The target faces the ${e.streetSide} side of the street.`
    : `The target is on the ${e.streetSide} section.`,
  (e: ShopEvidence) => e.neighbors.leftNeighbor && e.neighbors.rightNeighbor
    ? 'The target has shops on both sides - no empty neighbors.'
    : null,
];

// Item-based clue templates
const ITEM_TEMPLATES = [
  (keywords: string[]) => keywords.length > 0
    ? `Inside, you'll find something with "${keywords[0]}" in its name.`
    : null,
  (keywords: string[]) => keywords.includes('cold') || keywords.includes('warm')
    ? 'The shop sells items for temperature comfort.'
    : null,
  (keywords: string[]) => keywords.some(k => k.includes('shirt') || k.includes('wear'))
    ? 'Look for a shop selling wearable items.'
    : null,
  (keywords: string[]) => keywords.length >= 3
    ? `One item description mentions "${keywords[Math.floor(keywords.length / 2)]}".`
    : null,
  (keywords: string[]) => keywords.length > 0
    ? `Seek where "${keywords[keywords.length - 1]}" can be found.`
    : null,
];

// Exclusionary clue templates
const EXCLUSIONARY_TEMPLATES = [
  (target: EligibleShop, others: EligibleShop[]) => {
    const otherCategories = [...new Set(others.map(s => s.category))].filter(c => c !== target.category);
    return otherCategories.length > 0
      ? `The target is NOT in the ${otherCategories[0]} category.`
      : null;
  },
  (target: EligibleShop, others: EligibleShop[]) => {
    const otherFacades = [...new Set(others.map(s => s.metadata.facadeTemplate))].filter(f => f !== target.metadata.facadeTemplate);
    return otherFacades.length > 0
      ? `Avoid shops with ${otherFacades[0].replace('_', ' ')} facade.`
      : null;
  },
  (target: EligibleShop, _others: EligibleShop[]) => {
    return target.metadata.hasLogo
      ? 'The target shop HAS a logo displayed.'
      : 'The target shop has NO logo - just text signage.';
  },
  (target: EligibleShop, _others: EligibleShop[]) => {
    return target.metadata.hasExternalLink
      ? 'The target has an external website link.'
      : 'The target has NO external website.';
  },
  (target: EligibleShop, others: EligibleShop[]) => {
    const shopsWithSameCategory = others.filter(s => s.category === target.category);
    return shopsWithSameCategory.length === 0
      ? `Only one shop sells ${target.category} items - that's your target.`
      : null;
  },
];

export async function generateClues(
  targetShop: EligibleShop,
  allEligible: EligibleShop[],
  random: () => number
): Promise<Clue[]> {
  const clues: Clue[] = [];
  const others = allEligible.filter(s => s.shopId !== targetShop.shopId);
  
  // Analyze shop context
  const evidence = await analyzeShopContext(targetShop, allEligible);

  // Clue 1: Positional (uses real position data)
  const validPositionalClues = POSITIONAL_TEMPLATES
    .map(fn => fn(evidence))
    .filter((text): text is string => text !== null);
  
  if (validPositionalClues.length > 0) {
    clues.push({
      id: 1,
      type: 'positional',
      text: seededChoice(validPositionalClues, random),
    });
  } else {
    // Fallback
    clues.push({
      id: 1,
      type: 'positional',
      text: `The target is on the ${evidence.streetPosition.replace('_', ' ')}.`,
    });
  }

  // Clue 2: Item-based (uses real shop_items)
  const validItemClues = ITEM_TEMPLATES
    .map(fn => fn(evidence.itemKeywords))
    .filter((text): text is string => text !== null);
  
  if (validItemClues.length > 0) {
    clues.push({
      id: 2,
      type: 'item',
      text: seededChoice(validItemClues, random),
    });
  } else if (evidence.itemKeywords.length > 0) {
    clues.push({
      id: 2,
      type: 'item',
      text: `The shop contains items related to "${evidence.itemKeywords[0]}".`,
    });
  } else {
    clues.push({
      id: 2,
      type: 'item',
      text: 'Enter the shop to examine its items for the Mystery Box.',
    });
  }

  // Clue 3: Exclusionary (what the target is NOT)
  const validExclusionaryClues = EXCLUSIONARY_TEMPLATES
    .map(fn => fn(targetShop, others))
    .filter((text): text is string => text !== null);
  
  if (validExclusionaryClues.length > 0) {
    clues.push({
      id: 3,
      type: 'exclusionary',
      text: seededChoice(validExclusionaryClues, random),
    });
  } else {
    clues.push({
      id: 3,
      type: 'exclusionary',
      text: 'Process of elimination is your friend.',
    });
  }

  return clues;
}
