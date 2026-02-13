import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ShopAnalytics {
  shopId: string;
  shopName: string;
  totalVisits: number;
  totalLinkClicks: number;
  totalRedemptions: number;
  recentVisits: number; // last 30 days
  recentLinkClicks: number;
  recentRedemptions: number;
}

export function useShopAnalytics(shopId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shop-analytics', shopId],
    queryFn: async (): Promise<ShopAnalytics | null> => {
      if (!shopId || !user) return null;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoff = thirtyDaysAgo.toISOString();

      // Parallel queries
      const [visitsRes, clicksRes, redemptionsRes, recentVisitsRes, recentClicksRes, recentRedemptionsRes, shopRes] = await Promise.all([
        supabase.from('player_shop_visits').select('id', { count: 'exact', head: true }).eq('shop_id', shopId),
        supabase.from('shop_link_clicks').select('id', { count: 'exact', head: true }).eq('shop_id', shopId),
        supabase.from('offer_redemptions').select('id', { count: 'exact', head: true })
          .in('offer_id', 
            // We need to get offer IDs for this shop first - use a subquery approach
            [] // Will handle below
          ),
        supabase.from('player_shop_visits').select('id', { count: 'exact', head: true }).eq('shop_id', shopId).gte('created_at', cutoff),
        supabase.from('shop_link_clicks').select('id', { count: 'exact', head: true }).eq('shop_id', shopId).gte('created_at', cutoff),
        // placeholder
        Promise.resolve({ count: 0 }),
        supabase.from('shops').select('name').eq('id', shopId).eq('merchant_id', user.id).single(),
      ]);

      if (shopRes.error) return null;

      // Get offer IDs for this shop, then count redemptions
      const { data: offers } = await supabase
        .from('merchant_offers')
        .select('id')
        .eq('shop_id', shopId);

      const offerIds = offers?.map(o => o.id) || [];
      
      let totalRedemptions = 0;
      let recentRedemptions = 0;
      
      if (offerIds.length > 0) {
        const [totalRedRes, recentRedRes] = await Promise.all([
          supabase.from('offer_redemptions').select('id', { count: 'exact', head: true }).in('offer_id', offerIds),
          supabase.from('offer_redemptions').select('id', { count: 'exact', head: true }).in('offer_id', offerIds).gte('created_at', cutoff),
        ]);
        totalRedemptions = totalRedRes.count || 0;
        recentRedemptions = recentRedRes.count || 0;
      }

      return {
        shopId,
        shopName: shopRes.data?.name || '',
        totalVisits: visitsRes.count || 0,
        totalLinkClicks: clicksRes.count || 0,
        totalRedemptions,
        recentVisits: recentVisitsRes.count || 0,
        recentLinkClicks: recentClicksRes.count || 0,
        recentRedemptions,
      };
    },
    enabled: !!shopId && !!user,
    staleTime: 60000,
  });
}

export function useMerchantAnalyticsSummary() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['merchant-analytics-summary', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get all merchant's shops
      const { data: shops } = await supabase
        .from('shops')
        .select('id, name')
        .eq('merchant_id', user.id);

      if (!shops || shops.length === 0) return { shops: [], totals: { visits: 0, clicks: 0, redemptions: 0 } };

      const shopIds = shops.map(s => s.id);

      const [visitsRes, clicksRes] = await Promise.all([
        supabase.from('player_shop_visits').select('id', { count: 'exact', head: true }).in('shop_id', shopIds),
        supabase.from('shop_link_clicks').select('id', { count: 'exact', head: true }).in('shop_id', shopIds),
      ]);

      // Get all offers for these shops
      const { data: offers } = await supabase
        .from('merchant_offers')
        .select('id')
        .in('shop_id', shopIds);

      let totalRedemptions = 0;
      if (offers && offers.length > 0) {
        const { count } = await supabase
          .from('offer_redemptions')
          .select('id', { count: 'exact', head: true })
          .in('offer_id', offers.map(o => o.id));
        totalRedemptions = count || 0;
      }

      return {
        shops,
        totals: {
          visits: visitsRes.count || 0,
          clicks: clicksRes.count || 0,
          redemptions: totalRedemptions,
        },
      };
    },
    enabled: !!user,
    staleTime: 60000,
  });
}
