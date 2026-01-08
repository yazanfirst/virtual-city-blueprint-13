import { EligibleShop } from './eligibility';
import { seededWeightedChoice } from './seededRandom';
import { Position3D } from '@/hooks/use3DShops';

export function selectTargetShop(
  eligibleShops: EligibleShop[],
  shopsVisited: Set<string>,
  random: () => number
): EligibleShop {
  // Calculate weights
  const weights = eligibleShops.map((shop) => {
    let weight = 1;

    // Prefer unvisited shops (3x weight)
    if (!shopsVisited.has(shop.shopId)) {
      weight *= 3;
    }

    // Prefer shops with more items (richer content)
    weight *= Math.min(shop.itemCount, 5); // Cap at 5x

    // Slight preference for shops with logos
    if (shop.metadata.hasLogo) weight *= 1.2;

    // Slight preference for shops with external links
    if (shop.metadata.hasExternalLink) weight *= 1.1;

    return weight;
  });

  return seededWeightedChoice(eligibleShops, weights, random);
}

export function calculateBoxPosition(
  shopPosition: Position3D,
  random: () => number
): [number, number, number] {
  // Place box near shop entrance with small random offset
  const offsetX = (random() - 0.5) * 2; // -1 to 1
  const offsetZ = (random() - 0.5) * 2 + 3; // In front of shop

  // Apply rotation to offset
  const angle = shopPosition.rotation;
  const rotatedX = offsetX * Math.cos(angle) - offsetZ * Math.sin(angle);
  const rotatedZ = offsetX * Math.sin(angle) + offsetZ * Math.cos(angle);

  return [
    shopPosition.x + rotatedX,
    0.8, // Slightly above ground for visibility
    shopPosition.z + rotatedZ,
  ];
}
