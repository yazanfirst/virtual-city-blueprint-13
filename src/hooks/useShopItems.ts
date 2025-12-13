import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type ShopItem = Tables<"shop_items">;
export type ShopItemUpsertInput = {
  id?: string;
  shop_id?: string;
  slot_index: number;
  title: string;
  description?: string | null;
  price?: number | null;
  image_url?: string | null;
};

export const shopItemsQueryKey = (shopId?: string) => ["shop-items", shopId];

export function useShopItems(shopId?: string) {
  return useQuery({
    queryKey: shopItemsQueryKey(shopId),
    enabled: Boolean(shopId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_items")
        .select("*")
        .eq("shop_id", shopId)
        .order("slot_index");

      if (error) throw error;
      return data as ShopItem[];
    },
    staleTime: 30000,
  });
}

export function useUpsertShopItem(shopId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ShopItemUpsertInput) => {
      const { error } = await supabase
        .from("shop_items")
        .upsert({ ...payload, shop_id: shopId, updated_at: new Date().toISOString() });

      if (error) throw error;
    },
    onSuccess: () => {
      if (shopId) {
        queryClient.invalidateQueries({ queryKey: shopItemsQueryKey(shopId) });
      }
    },
  });
}

export function useDeleteShopItem(shopId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slotIndex: number) => {
      const { error } = await supabase
        .from("shop_items")
        .delete()
        .eq("shop_id", shopId)
        .eq("slot_index", slotIndex);

      if (error) throw error;
    },
    onSuccess: () => {
      if (shopId) {
        queryClient.invalidateQueries({ queryKey: shopItemsQueryKey(shopId) });
      }
    },
  });
}
