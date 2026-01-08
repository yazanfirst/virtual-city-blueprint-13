import { supabase } from '@/integrations/supabase/client';
import { SpotWithActiveShop, ShopBranding, parsePosition3D, Position3D } from '@/hooks/use3DShops';

export interface EligibleShop {
  shopId: string;
  spotId: string;
  branding: ShopBranding;
  category: string;
  itemCount: number;
  position3d: Position3D;
  metadata: {
    hasLogo: boolean;
    hasExternalLink: boolean;
    facadeTemplate: string;
  };
}

// Check if a shop has at least 1 valid item (cached check)
const itemCountCache = new Map<string, number>();

async function getShopItemCount(shopId: string): Promise<number> {
  if (itemCountCache.has(shopId)) {
    return itemCountCache.get(shopId)!;
  }
  
  const { count } = await supabase
    .from('shop_items')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shopId);
  
  const itemCount = count || 0;
  itemCountCache.set(shopId, itemCount);
  return itemCount;
}

export async function getEligibleShops(
  spotsWithShops: SpotWithActiveShop[]
): Promise<EligibleShop[]> {
  const eligible: EligibleShop[] = [];

  for (const spot of spotsWithShops) {
    const shop = spot.shop;

    // Rule 1: Must have a shop
    if (!shop) continue;

    // Rule 2: Shop must be 'active' (not suspended, pending, rejected)
    if (shop.status !== 'active') continue;

    // Rule 3: Must have a category
    if (!shop.category) continue;

    // Rule 4: Check for at least 1 valid item
    const itemCount = await getShopItemCount(shop.id);
    if (itemCount === 0) continue;

    const position = parsePosition3D(spot.position_3d as unknown as string | Position3D);

    eligible.push({
      shopId: shop.id,
      spotId: spot.id,
      branding: {
        spotId: spot.id,
        streetId: spot.street_id,
        spotLabel: spot.spot_label,
        position,
        hasShop: true,
        shopId: shop.id,
        isSuspended: false,
        shopName: shop.name,
        category: shop.category,
        primaryColor: shop.primary_color || '#3B82F6',
        accentColor: shop.accent_color || '#10B981',
        facadeTemplate: shop.facade_template || 'modern_neon',
        logoUrl: shop.logo_url,
        externalLink: shop.external_link,
        signageFont: shop.signage_font || 'classic',
        textureTemplate: shop.texture_template,
        textureUrl: shop.texture_url,
      },
      category: shop.category,
      itemCount,
      position3d: position,
      metadata: {
        hasLogo: !!shop.logo_url,
        hasExternalLink: !!shop.external_link,
        facadeTemplate: shop.facade_template || 'modern_neon',
      },
    });
  }

  return eligible;
}

// Clear cache when needed
export function clearEligibilityCache(): void {
  itemCountCache.clear();
}
