import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ShopRating {
  id: string;
  shop_id: string;
  user_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface ShopRatingSummary {
  averageRating: number;
  totalRatings: number;
  userRating: number | null;
}

export function useShopRating(shopId?: string) {
  const { user } = useAuth();

  return useQuery<ShopRatingSummary>({
    queryKey: ['shop-rating', shopId, user?.id],
    queryFn: async () => {
      if (!shopId) return { averageRating: 0, totalRatings: 0, userRating: null };

      // Fetch only ratings (not user_ids) for aggregate calculation
      const { data: ratings, error } = await supabase
        .from('shop_ratings')
        .select('rating')
        .eq('shop_id', shopId);

      // Separately fetch the current user's own rating
      let userRatingValue: number | null = null;
      if (user?.id) {
        const { data: myRating } = await supabase
          .from('shop_ratings')
          .select('rating')
          .eq('shop_id', shopId)
          .eq('user_id', user.id)
          .maybeSingle();
        userRatingValue = myRating?.rating ?? null;
      }

      if (error) throw error;

      const totalRatings = ratings?.length || 0;
      const sum = ratings?.reduce((acc, r) => acc + r.rating, 0) || 0;
      const averageRating = totalRatings > 0 ? sum / totalRatings : 0;

      return { averageRating, totalRatings, userRating: userRatingValue };
    },
    enabled: !!shopId,
    staleTime: 30000,
  });
}

export function useRateShop() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ shopId, rating }: { shopId: string; rating: number }) => {
      if (!user) throw new Error('Must be logged in to rate');
      if (rating < 1 || rating > 5) throw new Error('Rating must be 1-5');

      const { error } = await supabase
        .from('shop_ratings')
        .upsert(
          { shop_id: shopId, user_id: user.id, rating, updated_at: new Date().toISOString() },
          { onConflict: 'shop_id,user_id' }
        );

      if (error) throw error;
    },
    onSuccess: (_, { shopId }) => {
      queryClient.invalidateQueries({ queryKey: ['shop-rating', shopId] });
    },
  });
}
