import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { mockShopsByStreetSlug, mockSpotsByStreetSlug } from '@/lib/mockStreetContent';

export type ShopSpot = Tables<'shop_spots'>;
export type Shop = Tables<'shops'>;

export interface SpotWithActiveShop extends ShopSpot {
  shop: Shop | null;
}

// Hook to fetch all spots with their active shops for 3D rendering
export function useAllSpotsForStreet(streetSlug: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['all-spots-for-street-3d', streetSlug],
    queryFn: async () => {
      const mockSpots = mockSpotsByStreetSlug[streetSlug];
      const mockShops = mockShopsByStreetSlug[streetSlug];

      if (mockSpots && mockShops) {
        return mockSpots.map(spot => ({
          ...spot,
          shop: mockShops.find(shop => shop.spot_id === spot.id) || null,
        }));
      }

      // First get the street by slug
      const { data: street, error: streetError } = await supabase
        .from('streets')
        .select('id')
        .eq('slug', streetSlug)
        .maybeSingle();

      if (streetError) throw streetError;
      if (!street) return [];

      // Get all spots for this street
      const { data: spots, error: spotsError } = await supabase
        .from('shop_spots')
        .select('*')
        .eq('street_id', street.id)
        .order('sort_order');

      if (spotsError) throw spotsError;

      // Get all active AND suspended shops for these spots (suspended shows as closed)
      const spotIds = spots.map(s => s.id);
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .in('spot_id', spotIds)
        .in('status', ['active', 'suspended']);

      if (shopsError) throw shopsError;

      // Combine spots with their shops
      const spotsWithShops: SpotWithActiveShop[] = spots.map(spot => ({
        ...spot,
        shop: shops?.find(shop => shop.spot_id === spot.id) || null,
      }));

      return spotsWithShops;
    },
    enabled: options?.enabled ?? !!streetSlug,
    staleTime: 30000, // Cache for 30 seconds
  });
}

// Types for 3D positioning
export interface Position3D {
  x: number;
  z: number;
  rotation: number;
}

// Helper to parse position_3d from the database
export function parsePosition3D(position3d: Position3D | string | null): Position3D {
  if (typeof position3d === 'string') {
    return JSON.parse(position3d) as Position3D;
  }

  if (position3d && typeof position3d === 'object') {
    return position3d;
  }

  return { x: 0, z: 0, rotation: 0 };
}

export interface ShopBranding {
  spotId: string;
  streetId: string;
  spotLabel: string;
  position: Position3D;
  hasShop: boolean;
  shopId?: string;
  isSuspended?: boolean;
  shopName?: string;
  category?: string | null;
  primaryColor?: string;
  accentColor?: string;
  facadeTemplate?: string;
  logoUrl?: string | null;
  externalLink?: string | null;
  signageFont?: string | null;
  textureTemplate?: string | null;
  textureUrl?: string | null;
}

export function transformToShopBranding(spotsWithShops: SpotWithActiveShop[]): ShopBranding[] {
  return spotsWithShops.map(spot => {
    const position = parsePosition3D(spot.position_3d as unknown as string | Position3D);
    
    if (spot.shop) {
      return {
        spotId: spot.id,
        streetId: spot.street_id,
        spotLabel: spot.spot_label,
        position,
        hasShop: true,
        shopId: spot.shop.id,
        isSuspended: spot.shop.status === 'suspended',
        shopName: spot.shop.name,
        category: spot.shop.category,
        primaryColor: spot.shop.primary_color || '#3B82F6',
        accentColor: spot.shop.accent_color || '#10B981',
        facadeTemplate: spot.shop.facade_template || 'modern_neon',
        logoUrl: spot.shop.logo_url,
        externalLink: spot.shop.external_link,
        signageFont: spot.shop.signage_font || 'classic',
        textureTemplate: spot.shop.texture_template || null,
        textureUrl: spot.shop.texture_url || null,
      };
    }

    return {
      spotId: spot.id,
      streetId: spot.street_id,
      spotLabel: spot.spot_label,
      position,
      hasShop: false,
    };
  });
}
