import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { mockShopsByStreetSlug, mockSpotsByStreetSlug, mockStreets } from '@/lib/mockStreetContent';

export type Street = Tables<'streets'>;
export type ShopSpot = Tables<'shop_spots'>;
export type Shop = Tables<'shops'>;

export interface SpotWithShop extends ShopSpot {
  shop?: Shop | null;
}

export function useStreets() {
  const ensureFoodStreetIsActive = (street: Street) => street.slug === 'food-street'
    ? { ...street, is_active: true }
    : street;

  return useQuery({
    queryKey: ['streets'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('streets')
          .select('*')
          .order('name');

        if (error) throw error;
        const merged = [...(data as Street[]).map(ensureFoodStreetIsActive)];

        mockStreets.forEach(mockStreet => {
          if (!merged.find(street => street.slug === mockStreet.slug)) {
            merged.push(mockStreet);
          }
        });

        return merged.map(ensureFoodStreetIsActive);
      } catch (err) {
        // If Supabase is unavailable, still expose the mock streets so the zone can be tested
        return mockStreets;
      }
    },
  });
}

export function useStreetBySlug(slug: string, options?: { enabled?: boolean }) {
  const ensureFoodStreetIsActive = (street: Street | null) => (street?.slug === 'food-street'
    ? { ...street, is_active: true }
    : street);

  return useQuery({
    queryKey: ['street', slug],
    queryFn: async () => {
      const mockStreet = mockStreets.find(street => street.slug === slug);
      if (mockStreet) return mockStreet;

      const { data, error } = await supabase
        .from('streets')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return ensureFoodStreetIsActive(data as Street | null);
    },
    enabled: options?.enabled ?? !!slug,
  });
}

export function useShopSpots(streetId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['shop-spots', streetId],
    queryFn: async () => {
      const mockSpots = mockSpotsByStreetSlug[streetId];
      if (mockSpots) return mockSpots;

      const { data, error } = await supabase
        .from('shop_spots')
        .select('*')
        .eq('street_id', streetId)
        .order('sort_order');

      if (error) throw error;
      return data as ShopSpot[];
    },
    enabled: options?.enabled ?? !!streetId,
  });
}

export function useSpotsWithShops(streetId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['spots-with-shops', streetId],
    queryFn: async () => {
      const mockSpots = mockSpotsByStreetSlug[streetId];
      const mockShops = mockShopsByStreetSlug[streetId];

      if (mockSpots && mockShops) {
        return mockSpots.map(spot => ({
          ...spot,
          shop: mockShops.find(shop => shop.spot_id === spot.id) || null,
        }));
      }

      // First get all spots
      const { data: spots, error: spotsError } = await supabase
        .from('shop_spots')
        .select('*')
        .eq('street_id', streetId)
        .order('sort_order');

      if (spotsError) throw spotsError;

      // Then get all shops for these spots
      const spotIds = spots.map(s => s.id);
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .in('spot_id', spotIds);

      if (shopsError) throw shopsError;

      // Merge spots with their shops
      const spotsWithShops: SpotWithShop[] = spots.map(spot => ({
        ...spot,
        shop: shops?.find(shop => shop.spot_id === spot.id) || null,
      }));

      return spotsWithShops;
    },
    enabled: options?.enabled ?? !!streetId,
  });
}

export function useActiveShopsForStreet(streetId: string) {
  return useQuery({
    queryKey: ['active-shops', streetId],
    queryFn: async () => {
      const mockSpots = mockSpotsByStreetSlug[streetId];
      const mockShops = mockShopsByStreetSlug[streetId];

      if (mockSpots && mockShops) {
        return mockSpots.map(spot => ({
          ...spot,
          shop: mockShops.find(shop => shop.spot_id === spot.id) || null,
        }));
      }

      const { data: spots, error: spotsError } = await supabase
        .from('shop_spots')
        .select('*')
        .eq('street_id', streetId)
        .order('sort_order');

      if (spotsError) throw spotsError;

      const spotIds = spots.map(s => s.id);
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('*')
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
