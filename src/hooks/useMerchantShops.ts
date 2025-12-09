import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';

export type Shop = Tables<'shops'>;
export type ShopInsert = TablesInsert<'shops'>;

export function useMerchantShops() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['merchant-shops', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('shops')
        .select(`
          *,
          shop_spots (
            spot_label,
            street_id,
            streets (
              name,
              slug
            )
          )
        `)
        .eq('merchant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateShop() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (shopData: Omit<ShopInsert, 'merchant_id'>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('shops')
        .insert({
          ...shopData,
          merchant_id: user.id,
          status: 'pending_review',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-shops'] });
      queryClient.invalidateQueries({ queryKey: ['spots-with-shops'] });
    },
  });
}

export function useUpdateShop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Shop> & { id: string }) => {
      const { data, error } = await supabase
        .from('shops')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-shops'] });
      queryClient.invalidateQueries({ queryKey: ['spots-with-shops'] });
      queryClient.invalidateQueries({ queryKey: ['active-shops'] });
    },
  });
}

export function useCheckDuplicateLink(externalLink: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['check-duplicate-link', externalLink],
    queryFn: async () => {
      if (!externalLink) return { isDuplicate: false, sameOwner: false };

      const { data, error } = await supabase
        .from('shops')
        .select('id, merchant_id, name')
        .eq('external_link', externalLink);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { isDuplicate: false, sameOwner: false };
      }

      const sameOwner = data.some(shop => shop.merchant_id === user?.id);
      const differentOwner = data.some(shop => shop.merchant_id !== user?.id);

      return {
        isDuplicate: data.length > 0,
        sameOwner,
        differentOwner,
        existingShops: data,
      };
    },
    enabled: !!externalLink && externalLink.length > 5,
  });
}
