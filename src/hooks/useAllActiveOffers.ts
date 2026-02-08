import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MerchantOffer } from '@/hooks/useMerchantOffers';

export interface OfferWithShop extends MerchantOffer {
  shop_name: string;
  shop_logo_url: string | null;
  shop_external_link: string | null;
}

/**
 * Fetches all active offers across all shops on the current street.
 * Uses shopBrandings (already loaded) to resolve shop names client-side,
 * avoiding RLS issues with the shops table.
 */
export function useAllActiveOffers(shopMap: Map<string, { name: string; logoUrl: string | null; externalLink: string | null }>) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-active-offers', user?.id, Array.from(shopMap.keys()).sort().join(',')],
    queryFn: async () => {
      if (!user || shopMap.size === 0) return [];

      // Get the shop IDs we know about on this street
      const shopIds = Array.from(shopMap.keys());

      const { data, error } = await supabase
        .from('merchant_offers')
        .select('*')
        .eq('is_active', true)
        .in('shop_id', shopIds)
        .order('coin_price', { ascending: true });

      if (error) throw error;

      // Enrich with shop info from the pre-loaded brandings
      return ((data ?? []) as MerchantOffer[]).map((offer) => {
        const shop = shopMap.get(offer.shop_id);
        return {
          ...offer,
          shop_name: shop?.name ?? 'Unknown Shop',
          shop_logo_url: shop?.logoUrl ?? null,
          shop_external_link: shop?.externalLink ?? null,
        } as OfferWithShop;
      });
    },
    enabled: !!user && shopMap.size > 0,
  });
}
