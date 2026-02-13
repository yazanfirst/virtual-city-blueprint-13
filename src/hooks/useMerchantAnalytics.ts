import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMerchantShops } from "@/hooks/useMerchantShops";

interface MerchantAnalytics {
  totalShopVisits: number;
  uniqueVisitors: number;
  websiteClicks: number;
  couponClaims: number;
}

export function useMerchantAnalytics() {
  const { data: shops = [], isLoading: shopsLoading } = useMerchantShops();
  const shopIds = useMemo(() => shops.map((shop) => shop.id), [shops]);

  return useQuery<MerchantAnalytics>({
    queryKey: ["merchant-analytics", shopIds],
    queryFn: async () => {
      if (shopIds.length === 0) {
        return { totalShopVisits: 0, uniqueVisitors: 0, websiteClicks: 0, couponClaims: 0 };
      }

      const [{ data: visits, error: visitsError }, { count: websiteClicks, error: clickError }, { data: offers, error: offersError }] = await Promise.all([
        supabase.from("player_shop_visits").select("user_id").in("shop_id", shopIds),
        supabase.from("shop_link_clicks").select("id", { count: "exact", head: true }).in("shop_id", shopIds),
        supabase.from("merchant_offers").select("id").in("shop_id", shopIds),
      ]);

      if (visitsError) throw visitsError;
      if (clickError) throw clickError;
      if (offersError) throw offersError;

      const offerIds = (offers ?? []).map((offer) => offer.id);
      let couponClaims = 0;

      if (offerIds.length > 0) {
        const { count, error } = await supabase
          .from("offer_redemptions")
          .select("id", { count: "exact", head: true })
          .in("offer_id", offerIds);

        if (error) throw error;
        couponClaims = count ?? 0;
      }

      return {
        totalShopVisits: visits?.length ?? 0,
        uniqueVisitors: new Set((visits ?? []).map((visit) => visit.user_id)).size,
        websiteClicks: websiteClicks ?? 0,
        couponClaims,
      };
    },
    enabled: !shopsLoading,
  });
}
