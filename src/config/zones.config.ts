/**
 * Zone Configuration - Single Source of Truth
 * 
 * This file defines all accessible zones in the virtual city.
 * Currently uses static data, but can be replaced with DB fetch later.
 * 
 * To migrate to DB:
 * 1. Create a `zones` table with the same structure
 * 2. Replace the static ZONES_CONFIG with a fetch function
 * 3. No logic changes needed in components using this config
 */

export type ShopConfig = {
  id: string;
  name: string;
  category: 'restaurant' | 'cafe' | 'bakery' | 'fast-food' | 'dessert' | 'bar';
  position: { x: number; z: number; rotation: number };
  color: string;
  description?: string;
};

export type ZoneConfig = {
  zoneId: string;
  name: string;
  route: string;
  description: string;
  gateTriggerId: string;
  gatePosition: { x: number; z: number };
  gateTriggerBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  playerSpawnPosition: { x: number; y: number; z: number };
  isActive: boolean;
  shops: ShopConfig[];
};

// Food Street shop configurations
const FOOD_STREET_SHOPS: ShopConfig[] = [
  // Main street - left side (facing road, rotation = -Math.PI/2)
  { id: 'fs-1', name: 'Golden Wok', category: 'restaurant', position: { x: -9, z: 20, rotation: Math.PI / 2 }, color: '#D97B4A', description: 'Authentic Asian cuisine' },
  { id: 'fs-2', name: 'Pasta Palace', category: 'restaurant', position: { x: -9, z: 8, rotation: Math.PI / 2 }, color: '#5BBAA5', description: 'Italian favorites' },
  { id: 'fs-3', name: 'Burger Barn', category: 'fast-food', position: { x: -9, z: -4, rotation: Math.PI / 2 }, color: '#D98BB5', description: 'Juicy handmade burgers' },
  { id: 'fs-4', name: 'Sushi Zen', category: 'restaurant', position: { x: -9, z: -16, rotation: Math.PI / 2 }, color: '#5B9BD5', description: 'Fresh sushi & sashimi' },
  
  // Main street - right side (facing road, rotation = Math.PI/2)
  { id: 'fs-5', name: 'Café Aroma', category: 'cafe', position: { x: 9, z: 20, rotation: -Math.PI / 2 }, color: '#8B6B4A', description: 'Premium coffee & pastries' },
  { id: 'fs-6', name: 'Taco Fiesta', category: 'fast-food', position: { x: 9, z: 8, rotation: -Math.PI / 2 }, color: '#E8C547', description: 'Mexican street food' },
  { id: 'fs-7', name: 'Noodle House', category: 'restaurant', position: { x: 9, z: -4, rotation: -Math.PI / 2 }, color: '#6B9B6B', description: 'Hand-pulled noodles' },
  { id: 'fs-8', name: 'Ice Dream', category: 'dessert', position: { x: 9, z: -16, rotation: -Math.PI / 2 }, color: '#9B7BB5', description: 'Artisan ice cream' },
  
  // Sweet Branch (east) - both sides
  { id: 'fs-9', name: 'Donut Delight', category: 'bakery', position: { x: 20, z: 12, rotation: Math.PI }, color: '#D98BB5', description: 'Fresh donuts daily' },
  { id: 'fs-10', name: 'Cake Corner', category: 'bakery', position: { x: 20, z: 0, rotation: 0 }, color: '#E8C547', description: 'Custom cakes & treats' },
  
  // Harvest Branch (west) - both sides
  { id: 'fs-11', name: 'Farm Table', category: 'restaurant', position: { x: -20, z: -12, rotation: Math.PI }, color: '#6B9B6B', description: 'Farm-to-table dining' },
  { id: 'fs-12', name: 'Juice Junction', category: 'cafe', position: { x: -20, z: 0, rotation: 0 }, color: '#5BBAA5', description: 'Fresh juices & smoothies' },
];

export const ZONES_CONFIG: Record<string, ZoneConfig> = {
  'food_street': {
    zoneId: 'food_street',
    name: 'Food Street',
    route: '/food-street',
    description: 'A vibrant culinary district with restaurants, cafés, and food stalls',
    gateTriggerId: 'gate_food_street',
    gatePosition: { x: -78, z: 0 },
    // Invisible collision box near the gate - player walks through this area to trigger
    gateTriggerBounds: {
      minX: -82,
      maxX: -74,
      minZ: -7,
      maxZ: 7,
    },
    playerSpawnPosition: { x: 0, y: 0, z: 28 },
    isActive: true,
    shops: FOOD_STREET_SHOPS,
  },
  'electronics': {
    zoneId: 'electronics',
    name: 'Electronics District',
    route: '/electronics',
    description: 'Tech shops and gadget stores',
    gateTriggerId: 'gate_electronics',
    gatePosition: { x: 78, z: 0 },
    gateTriggerBounds: {
      minX: 74,
      maxX: 82,
      minZ: -7,
      maxZ: 7,
    },
    playerSpawnPosition: { x: 0, y: 0, z: 28 },
    isActive: false, // Coming soon
    shops: [],
  },
};

// Helper to get zone by route
export function getZoneByRoute(route: string): ZoneConfig | undefined {
  return Object.values(ZONES_CONFIG).find(z => z.route === route);
}

// Helper to get zone by gate trigger ID
export function getZoneByGateId(gateId: string): ZoneConfig | undefined {
  return Object.values(ZONES_CONFIG).find(z => z.gateTriggerId === gateId);
}

// Helper to get all active zones
export function getActiveZones(): ZoneConfig[] {
  return Object.values(ZONES_CONFIG).filter(z => z.isActive);
}

// Helper to check if a position is within a gate trigger bounds
export function isPositionInGateTrigger(
  x: number,
  z: number,
  zoneId: string
): boolean {
  const zone = ZONES_CONFIG[zoneId];
  if (!zone) return false;
  
  const { minX, maxX, minZ, maxZ } = zone.gateTriggerBounds;
  return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
}

// Get all gate trigger zones for collision detection
export function getAllGateTriggers(): Array<{ zoneId: string; bounds: ZoneConfig['gateTriggerBounds'] }> {
  return Object.values(ZONES_CONFIG)
    .filter(z => z.isActive)
    .map(z => ({ zoneId: z.zoneId, bounds: z.gateTriggerBounds }));
}
