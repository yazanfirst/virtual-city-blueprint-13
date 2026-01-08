import { EligibleShop } from './eligibility';
import { seededChoice } from './seededRandom';

export interface Clue {
  id: number;
  type: 'symbolic' | 'spatial' | 'exclusionary';
  text: string;
}

// Clue templates - NO easy answers
const SYMBOLIC_TEMPLATES = [
  { pattern: 'Where the {creature} meets {element}, secrets hide in plain sight', vars: ['creature', 'element'] },
  { pattern: 'The {adjective} path leads through {material} halls', vars: ['adjective', 'material'] },
  { pattern: 'Seekers of {virtue} find refuge beneath the {symbol}', vars: ['virtue', 'symbol'] },
  { pattern: 'When {creature} dreams of {element}, treasure awaits', vars: ['creature', 'element'] },
  { pattern: 'The {symbol} whispers to those who understand {virtue}', vars: ['symbol', 'virtue'] },
];

const SPATIAL_TEMPLATES = [
  { pattern: 'Stand where the {landmark} casts its longest shadow', vars: ['landmark'] },
  { pattern: 'Between {count} steps and the {direction} wind', vars: ['count', 'direction'] },
  { pattern: 'Where echoes of the {street_feature} fade to silence', vars: ['street_feature'] },
  { pattern: 'Face the {direction}, walk until {landmark} appears', vars: ['direction', 'landmark'] },
  { pattern: 'The prize rests where {street_feature} meets the crowd', vars: ['street_feature'] },
];

const EXCLUSIONARY_TEMPLATES = [
  { pattern: 'Not where {color} flags fly, nor where {other_category} thrives', vars: ['color', 'other_category'] },
  { pattern: 'The truth hides not in {facade_type}, but in its opposite', vars: ['facade_type'] },
  { pattern: 'Ignore the {decoy_feature} - it leads only to empty promises', vars: ['decoy_feature'] },
  { pattern: 'Avoid the glow of {color}, seek the subtle instead', vars: ['color'] },
  { pattern: 'Where {other_category} fears to tread, your answer waits', vars: ['other_category'] },
];

// Category to thematic mappings
const CATEGORY_THEMES: Record<string, Record<string, string>> = {
  Fashion: { creature: 'silk moth', element: 'mirror', virtue: 'elegance', symbol: 'needle', adjective: 'woven', material: 'velvet' },
  Accessories: { creature: 'magpie', element: 'crystal', virtue: 'adornment', symbol: 'clasp', adjective: 'shimmering', material: 'silver' },
  Jewelry: { creature: 'dragon', element: 'gold', virtue: 'treasure', symbol: 'gem', adjective: 'radiant', material: 'platinum' },
  Clothing: { creature: 'peacock', element: 'fabric', virtue: 'style', symbol: 'thread', adjective: 'flowing', material: 'silk' },
  Electronics: { creature: 'firefly', element: 'lightning', virtue: 'innovation', symbol: 'circuit', adjective: 'pulsing', material: 'chrome' },
  Food: { creature: 'bee', element: 'fire', virtue: 'nourishment', symbol: 'flame', adjective: 'warm', material: 'copper' },
  Art: { creature: 'phoenix', element: 'color', virtue: 'creation', symbol: 'brush', adjective: 'vivid', material: 'canvas' },
  Books: { creature: 'owl', element: 'ink', virtue: 'wisdom', symbol: 'quill', adjective: 'ancient', material: 'leather' },
  Sports: { creature: 'eagle', element: 'wind', virtue: 'victory', symbol: 'trophy', adjective: 'swift', material: 'steel' },
  Beauty: { creature: 'butterfly', element: 'light', virtue: 'grace', symbol: 'rose', adjective: 'delicate', material: 'pearl' },
  Home: { creature: 'dove', element: 'earth', virtue: 'comfort', symbol: 'hearth', adjective: 'cozy', material: 'wood' },
  default: { creature: 'raven', element: 'shadow', virtue: 'mystery', symbol: 'star', adjective: 'hidden', material: 'stone' },
};

const SPATIAL_VARS: Record<string, string[]> = {
  landmark: ['fountain', 'tall tower', 'green tree', 'old lamp', 'stone bench'],
  count: ['seven', 'twelve', 'twenty', 'thirty'],
  direction: ['north', 'east', 'south', 'west'],
  street_feature: ['busy corner', 'quiet alley', 'main boulevard', 'crossing'],
};

const EXCLUSIONARY_VARS: Record<string, string[]> = {
  color: ['neon pink', 'bright gold', 'electric blue', 'crimson'],
  other_category: ['food vendors', 'tech dealers', 'book traders', 'art galleries'],
  facade_type: ['glass facades', 'brick walls', 'modern chrome', 'vintage wood'],
  decoy_feature: ['flashing signs', 'loud music', 'crowded entrance', 'tall banners'],
};

function fillTemplate(
  template: { pattern: string; vars: string[] },
  categoryTheme: Record<string, string>,
  random: () => number
): string {
  let result = template.pattern;

  for (const varName of template.vars) {
    let replacement: string;

    if (categoryTheme[varName]) {
      replacement = categoryTheme[varName];
    } else if (SPATIAL_VARS[varName]) {
      replacement = seededChoice(SPATIAL_VARS[varName], random);
    } else if (EXCLUSIONARY_VARS[varName]) {
      replacement = seededChoice(EXCLUSIONARY_VARS[varName], random);
    } else {
      replacement = varName;
    }

    result = result.replace(`{${varName}}`, replacement);
  }

  return result;
}

export function generateClues(
  targetShop: EligibleShop,
  allEligible: EligibleShop[],
  random: () => number
): Clue[] {
  const clues: Clue[] = [];
  const theme = CATEGORY_THEMES[targetShop.category] || CATEGORY_THEMES.default;

  // Clue 1: Symbolic/Poetic
  const symbolic = seededChoice(SYMBOLIC_TEMPLATES, random);
  clues.push({
    id: 1,
    type: 'symbolic',
    text: fillTemplate(symbolic, theme, random),
  });

  // Clue 2: Spatial/Environmental
  const spatial = seededChoice(SPATIAL_TEMPLATES, random);
  clues.push({
    id: 2,
    type: 'spatial',
    text: fillTemplate(spatial, theme, random),
  });

  // Clue 3: Exclusionary/Narrowing - use other categories to exclude
  const otherCategories = [...new Set(allEligible.map((s) => s.category))].filter(
    (c) => c !== targetShop.category
  );
  const exclusionTheme = {
    ...theme,
    other_category: otherCategories.length > 0 ? seededChoice(otherCategories, random) : 'common wares',
  };

  const exclusionary = seededChoice(EXCLUSIONARY_TEMPLATES, random);
  clues.push({
    id: 3,
    type: 'exclusionary',
    text: fillTemplate(exclusionary, exclusionTheme, random),
  });

  return clues;
}
