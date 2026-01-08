import { EligibleShop } from './eligibility';
import { seededChoice, seededShuffle } from './seededRandom';

export type IndicatorType = 'billboard' | 'poster' | 'arrow' | 'banner' | 'graffiti' | 'glow';

export interface IndicatorData {
  id: string;
  type: IndicatorType;
  position: [number, number, number];
  rotation: number;
  isDecoy: boolean;
  content: string;
  visibleAtNight?: boolean;
  fadeOnApproach?: boolean;
  glitchy?: boolean;
  flickering?: boolean;
  delayed?: boolean;
}

// Session-based indicator presets for variety
const INDICATOR_PRESETS = [
  {
    name: 'billboard_heavy',
    trueTypes: ['billboard', 'banner'] as IndicatorType[],
    decoyTypes: ['poster', 'arrow'] as IndicatorType[],
    nightBias: 0.3,
  },
  {
    name: 'subtle_ground',
    trueTypes: ['graffiti', 'glow'] as IndicatorType[],
    decoyTypes: ['graffiti', 'arrow'] as IndicatorType[],
    nightBias: 0.8, // 80% chance night-only
  },
  {
    name: 'directional',
    trueTypes: ['arrow', 'banner'] as IndicatorType[],
    decoyTypes: ['arrow', 'poster'] as IndicatorType[],
    nightBias: 0.5,
  },
  {
    name: 'mixed_signals',
    trueTypes: ['billboard', 'poster', 'arrow', 'glow'] as IndicatorType[],
    decoyTypes: ['billboard', 'arrow', 'graffiti'] as IndicatorType[],
    nightBias: 0.4,
  },
];

const INDICATOR_CONTENTS = {
  true: [
    '✦ HERE ✦',
    '→ THIS WAY →',
    '★ MYSTERY ★',
    '◆ SEEK ◆',
    '✧ TREASURE ✧',
    '⬇ LOOK DOWN ⬇',
    '◉ TARGET ◉',
  ],
  decoy: [
    '? MAYBE ?',
    '← OR HERE ←',
    '○ PERHAPS ○',
    '◇ LOOK ◇',
    '~ CLOSE ~',
    '⬆ TRY UP ⬆',
    '◌ SEARCH ◌',
  ],
};

// All possible decoy "tells"
type DecoyTell = 'fadeOnApproach' | 'glitchy' | 'reversed' | 'dayOnly' | 'flickering' | 'delayed';

const DECOY_TELLS: DecoyTell[] = [
  'fadeOnApproach',
  'glitchy',
  'reversed',
  'dayOnly',
  'flickering',
  'delayed',
];

function selectIndicatorPreset(random: () => number) {
  return seededChoice(INDICATOR_PRESETS, random);
}

function calculateIndicatorPosition(
  shopPosition: { x: number; z: number; rotation: number },
  type: IndicatorType,
  random: () => number
): [number, number, number] {
  const heightByType: Record<IndicatorType, number> = {
    billboard: 8,
    poster: 4,
    arrow: 3,
    banner: 6,
    graffiti: 1.5,
    glow: 0.5,
  };

  const offsetX = (random() - 0.5) * 4;
  const offsetZ = random() * 3 + 2;

  const angle = shopPosition.rotation;
  const rotatedX = offsetX * Math.cos(angle) - offsetZ * Math.sin(angle);
  const rotatedZ = offsetX * Math.sin(angle) + offsetZ * Math.cos(angle);

  return [
    shopPosition.x + rotatedX,
    heightByType[type],
    shopPosition.z + rotatedZ,
  ];
}

function createTrueIndicator(
  shop: EligibleShop,
  preset: typeof INDICATOR_PRESETS[0],
  random: () => number
): IndicatorData {
  const type = seededChoice(preset.trueTypes, random);

  return {
    id: `true-${shop.shopId}`,
    type,
    position: calculateIndicatorPosition(shop.position3d, type, random),
    rotation: shop.position3d.rotation,
    isDecoy: false,
    content: seededChoice(INDICATOR_CONTENTS.true, random),
    visibleAtNight: random() < preset.nightBias,
  };
}

function createDecoyIndicator(
  shop: EligibleShop,
  preset: typeof INDICATOR_PRESETS[0],
  random: () => number,
  decoyIndex: number
): IndicatorData {
  const type = seededChoice(preset.decoyTypes, random);

  // Each decoy gets a different tell for variety
  const tell = DECOY_TELLS[decoyIndex % DECOY_TELLS.length];
  const tells: Partial<IndicatorData> = {};

  switch (tell) {
    case 'fadeOnApproach':
      tells.fadeOnApproach = true;
      break;
    case 'glitchy':
      tells.glitchy = true;
      break;
    case 'reversed':
      // Rotation is reversed - handled below
      break;
    case 'dayOnly':
      tells.visibleAtNight = false;
      break;
    case 'flickering':
      tells.flickering = true;
      break;
    case 'delayed':
      tells.delayed = true;
      break;
  }

  return {
    id: `decoy-${shop.shopId}-${decoyIndex}`,
    type,
    position: calculateIndicatorPosition(shop.position3d, type, random),
    rotation: shop.position3d.rotation + (tell === 'reversed' ? Math.PI : 0),
    isDecoy: true,
    content: seededChoice(INDICATOR_CONTENTS.decoy, random),
    visibleAtNight: tells.visibleAtNight ?? (random() < preset.nightBias),
    ...tells,
  };
}

export function generateIndicators(
  targetShop: EligibleShop,
  allEligible: EligibleShop[],
  random: () => number
): IndicatorData[] {
  const indicators: IndicatorData[] = [];

  // Select preset for this session
  const preset = selectIndicatorPreset(random);

  // 1 TRUE indicator - tied to correct shop
  const trueIndicator = createTrueIndicator(targetShop, preset, random);
  indicators.push(trueIndicator);

  // 1-3 DECOY indicators (variable count for unpredictability)
  const decoyCount = Math.floor(random() * 3) + 1; // 1, 2, or 3
  const otherShops = allEligible.filter((s) => s.shopId !== targetShop.shopId);
  const shuffledOthers = seededShuffle(otherShops, random);

  for (let i = 0; i < Math.min(decoyCount, shuffledOthers.length); i++) {
    const decoy = createDecoyIndicator(shuffledOthers[i], preset, random, i);
    indicators.push(decoy);
  }

  return indicators;
}

// Export preset info for debugging/UI
export function getIndicatorPresetName(random: () => number): string {
  return selectIndicatorPreset(random).name;
}
