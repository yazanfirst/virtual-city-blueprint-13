import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGameStore } from '@/stores/gameStore';

export interface Redemption {
  id: string;
  offer_id: string;
  player_id: string;
  redemption_code: string;
  status: string;
  coins_spent: number;
  created_at: string;
  expires_at: string;
}

interface ClaimResult {
  success: boolean;
  redemption_code?: string;
  coupon_code?: string | null;
  coins_spent?: number;
  coins_remaining?: number;
  expires_at?: string;
  error?: string;
}

export function useMyRedemptions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-redemptions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('offer_redemptions')
        .select('*')
        .eq('player_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Redemption[];
    },
    enabled: !!user,
  });
}

// Count how many times the current player has redeemed a specific offer
export function usePlayerOfferRedemptionCount(offerId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['redemption-count', offerId, user?.id],
    queryFn: async () => {
      if (!user || !offerId) return 0;
      const { count, error } = await supabase
        .from('offer_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('offer_id', offerId)
        .eq('player_id', user.id);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user && !!offerId,
  });
}

export function useClaimOffer() {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const loadFromServer = useGameStore((s) => s.loadFromServer);

  const claimOffer = useCallback(
    async (offerId: string): Promise<ClaimResult> => {
      setLoading(true);
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
          return { success: false, error: 'App configuration error. Missing Supabase URL.' };
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          return { success: false, error: 'You must be logged in to claim offers' };
        }

        const response = await fetch(
          `${supabaseUrl}/functions/v1/redeem-offer`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ offer_id: offerId }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          return { success: false, error: result.error || 'Failed to claim offer' };
        }

        // Update local coin balance
        if (result.coins_remaining !== undefined) {
          const state = useGameStore.getState();
          loadFromServer({
            coins: result.coins_remaining,
            xp: state.xp,
            level: state.level,
          });
        }

        // Invalidate redemption queries
        queryClient.invalidateQueries({ queryKey: ['my-redemptions'] });
        queryClient.invalidateQueries({ queryKey: ['redemption-count'] });

        return {
          success: true,
          redemption_code: result.redemption_code,
          coupon_code: result.coupon_code || null,
          coins_spent: result.coins_spent,
          coins_remaining: result.coins_remaining,
          expires_at: result.expires_at,
        };
      } catch (err) {
        return { success: false, error: 'Network error. Please try again.' };
      } finally {
        setLoading(false);
      }
    },
    [loadFromServer, queryClient]
  );

  return { claimOffer, loading };
}
