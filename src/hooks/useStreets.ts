import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Street = Tables<'streets'>;
export type ShopSpot = Tables<'shop_spots'>;
// Safe shop type excluding internal admin_notes field
export type SafeShop = Omit<Tables<'shops'>, 'admin_notes'>;

export interface SpotWithShop extends ShopSpot {
  shop?: SafeShop | null;
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

      // Then get all shops for these spots
      const spotIds = spots.map(s => s.id);
      // Explicitly select fields to exclude admin_notes (internal admin field)
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select(`
          id,
          merchant_id,
          spot_id,
          name,
          category,
          external_link,
          logo_url,
          primary_color,
          accent_color,
          facade_template,
          signage_font,
          texture_template,
          texture_url,
          status,
          duplicate_brand,
          branch_label,
          branch_justification,
          created_at,
          updated_at
        `)
        .in('spot_id', spotIds);

      if (shopsError) throw shopsError;

      // Merge spots with their shops
      const spotsWithShops: SpotWithShop[] = spots.map(spot => ({
        ...spot,
        shop: shops?.find(shop => shop.spot_id === spot.id) || null,
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

      const spotIds = spots.map(s => s.id);
      // Explicitly select fields to exclude admin_notes (internal admin field)
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select(`
          id,
          merchant_id,
          spot_id,
          name,
          category,
          external_link,
          logo_url,
          primary_color,
          accent_color,
          facade_template,
          signage_font,
          texture_template,
          texture_url,
          status,
          duplicate_brand,
          branch_label,
          branch_justification,
          created_at,
          updated_at
        `)
        .in('spot_id', spotIds)
        .eq('status', 'active');

      if (shopsError) throw shopsError;

      return spots.map(spot => ({
        ...spot,
        shop: shops?.find(shop => shop.spot_id === spot.id) || null,
      }));
    },
    enabled: !!streetId,
  });
}
