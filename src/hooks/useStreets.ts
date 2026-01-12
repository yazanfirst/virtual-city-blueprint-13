import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Street = Tables<'streets'>;
export type ShopSpot = Tables<'shop_spots'>;

// Public shop type from RPC - excludes merchant_id and admin_notes
export interface PublicShop {
  id: string;
  spot_id: string;
  name: string;
  category: string | null;
  external_link: string | null;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  facade_template: string | null;
  signage_font: string | null;
  texture_template: string | null;
  texture_url: string | null;
  status: string | null;
  duplicate_brand: boolean | null;
  branch_label: string | null;
  branch_justification: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SpotWithShop extends ShopSpot {
  shop?: PublicShop | null;
}

export function useStreets() {
  return useQuery({
    queryKey: ['streets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streets')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Street[];
    },
  });
}

export function useStreetBySlug(slug: string) {
  return useQuery({
    queryKey: ['street', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streets')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data as Street | null;
    },
    enabled: !!slug,
  });
}

export function useShopSpots(streetId: string) {
  return useQuery({
    queryKey: ['shop-spots', streetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_spots')
        .select('*')
        .eq('street_id', streetId)
        .order('sort_order');

      if (error) throw error;
      return data as ShopSpot[];
    },
    enabled: !!streetId,
  });
}

export function useSpotsWithShops(streetId: string) {
  return useQuery({
    queryKey: ['spots-with-shops', streetId],
    queryFn: async () => {
      // First get all spots
      const { data: spots, error: spotsError } = await supabase
        .from('shop_spots')
        .select('*')
        .eq('street_id', streetId)
        .order('sort_order');

      if (spotsError) throw spotsError;

      // Use RPC to get public shop data (excludes merchant_id and admin_notes)
      const spotIds = spots.map(s => s.id);
      const { data: shops, error: shopsError } = await supabase
        .rpc('get_active_or_suspended_public_shops_for_spots', { _spot_ids: spotIds });

      if (shopsError) throw shopsError;

      // Merge spots with their shops
      const spotsWithShops: SpotWithShop[] = spots.map(spot => ({
        ...spot,
        shop: shops?.find((shop: PublicShop) => shop.spot_id === spot.id) || null,
      }));

      return spotsWithShops;
    },
    enabled: !!streetId,
  });
}

export function useActiveShopsForStreet(streetId: string) {
  return useQuery({
    queryKey: ['active-shops', streetId],
    queryFn: async () => {
      const { data: spots, error: spotsError } = await supabase
        .from('shop_spots')
        .select('*')
        .eq('street_id', streetId)
        .order('sort_order');

      if (spotsError) throw spotsError;

      // Use RPC to get public shop data (excludes merchant_id and admin_notes)
      const spotIds = spots.map(s => s.id);
      const { data: shops, error: shopsError } = await supabase
        .rpc('get_active_public_shops_for_spots', { _spot_ids: spotIds });

      if (shopsError) throw shopsError;

      return spots.map(spot => ({
        ...spot,
        shop: shops?.find((shop: PublicShop) => shop.spot_id === spot.id) || null,
      }));
    },
    enabled: !!streetId,
  });
}
