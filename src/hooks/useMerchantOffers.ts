import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface MerchantOffer {
  id: string;
  shop_id: string;
  title: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  coin_price: number;
  min_player_level: number;
  daily_limit: number;
  per_player_limit: number;
  min_order_value: number | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOfferInput {
  shop_id: string;
  title: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  coin_price: number;
  min_player_level?: number;
  daily_limit?: number;
  per_player_limit?: number;
  min_order_value?: number | null;
  expires_at?: string | null;
}

// Fetch active offers for a shop (player view)
export function useShopOffers(shopId: string | undefined) {
  return useQuery({
    queryKey: ['shop-offers', shopId],
    queryFn: async () => {
      if (!shopId) return [];
      const { data, error } = await supabase
        .from('merchant_offers')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as MerchantOffer[];
    },
    enabled: !!shopId,
  });
}

// Fetch ALL offers for a shop (merchant view, including inactive)
export function useMerchantShopOffers(shopId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['merchant-offers', shopId],
    queryFn: async () => {
      if (!shopId || !user) return [];
      const { data, error } = await supabase
        .from('merchant_offers')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as MerchantOffer[];
    },
    enabled: !!shopId && !!user,
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOfferInput) => {
      const { data, error } = await supabase
        .from('merchant_offers')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as MerchantOffer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['merchant-offers', data.shop_id] });
      toast({ title: 'Offer created', description: 'Your offer is now live for players.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MerchantOffer> & { id: string }) => {
      const { data, error } = await supabase
        .from('merchant_offers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as MerchantOffer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['merchant-offers', data.shop_id] });
      toast({ title: 'Offer updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, shopId }: { id: string; shopId: string }) => {
      const { error } = await supabase
        .from('merchant_offers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return shopId;
    },
    onSuccess: (shopId) => {
      queryClient.invalidateQueries({ queryKey: ['merchant-offers', shopId] });
      toast({ title: 'Offer deleted' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}
