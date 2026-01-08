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
}

const INDICATOR_CONTENTS = {
  true: [
    '✦ HERE ✦',
    '→ THIS WAY →',
    '★ MYSTERY ★',
    '◆ SEEK ◆',
    '✧ TREASURE ✧',
  ],
  decoy: [
    '? MAYBE ?',
    '← OR HERE ←',
    '○ PERHAPS ○',
    '◇ LOOK ◇',
    '~ CLOSE ~',
  ],
};

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
  random: () => number
): IndicatorData {
  const type = seededChoice(['billboard', 'poster', 'arrow', 'banner'] as IndicatorType[], random);

  return {
    id: `true-${shop.shopId}`,
    type,
    position: calculateIndicatorPosition(shop.position3d, type, random),
    rotation: shop.position3d.rotation,
    isDecoy: false,
    content: seededChoice(INDICATOR_CONTENTS.true, random),
    visibleAtNight: random() > 0.5, // 50% chance night-only
  };
}

function createDecoyIndicator(
  shop: EligibleShop,
  random: () => number
): IndicatorData {
  const type = seededChoice(['arrow', 'poster', 'banner'] as IndicatorType[], random);

  // Fair deception tells
  const tellType = Math.floor(random() * 5);
  const tells: Partial<IndicatorData> = {};

  switch (tellType) {
    case 0:
      tells.fadeOnApproach = true;
      break;
    case 1:
      tells.glitchy = true;
      break;
    case 2:
      // Reversed arrow - handled via rotation
      break;
    case 3:
      tells.visibleAtNight = false; // Only visible in day (opposite of some true ones)
      break;
    case 4:
      tells.flickering = true;
      break;
  }

  return {
    id: `decoy-${shop.shopId}`,
    type,
    position: calculateIndicatorPosition(shop.position3d, type, random),
    rotation: shop.position3d.rotation + (tellType === 2 ? Math.PI : 0), // Reversed
    isDecoy: true,
    content: seededChoice(INDICATOR_CONTENTS.decoy, random),
    ...tells,
  };
}

export function generateIndicators(
  targetShop: EligibleShop,
  allEligible: EligibleShop[],
  random: () => number
): IndicatorData[] {
  const indicators: IndicatorData[] = [];

  // 1 TRUE indicator - tied to correct shop
  const trueIndicator = createTrueIndicator(targetShop, random);
  indicators.push(trueIndicator);

  // 0-2 DECOY indicators
  const decoyCount = Math.floor(random() * 3); // 0, 1, or 2
  const otherShops = allEligible.filter((s) => s.shopId !== targetShop.shopId);
  const shuffledOthers = seededShuffle(otherShops, random);

  for (let i = 0; i < Math.min(decoyCount, shuffledOthers.length); i++) {
    const decoy = createDecoyIndicator(shuffledOthers[i], random);
    indicators.push(decoy);
  }

  return indicators;
}
