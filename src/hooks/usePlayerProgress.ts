import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGameStore } from '@/stores/gameStore';

interface PlayerProgress {
  user_id: string;
  coins: number;
  xp: number;
  level: number;
  missions_completed: number;
  shops_visited: number;
}

export interface MissionRewardResult {
  coinsEarned: number;
  xpEarned: number;
  isFirstClear: boolean;
}

const REPLAY_XP = 10;

export function usePlayerProgress() {
  const { user } = useAuth();
  const loadFromServer = useGameStore((s) => s.loadFromServer);
  const loadVisitedShops = useGameStore((s) => s.loadVisitedShops);
  const addCoins = useGameStore((s) => s.addCoins);
  const addXP = useGameStore((s) => s.addXP);
  const loadedRef = useRef(false);

  // Load or create player progress on login
  useEffect(() => {
    if (!user || loadedRef.current) return;

    const loadProgress = async () => {
      // Try to fetch existing progress
      const { data, error } = await supabase
        .from('player_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to load player progress:', error);
        return;
      }

      if (data) {
        // Load existing progress into Zustand
        loadFromServer({
          coins: data.coins,
          xp: data.xp,
          level: data.level,
        });
        loadedRef.current = true;
      } else {
        // Create initial progress row
        const { data: newData, error: insertErr } = await supabase
          .from('player_progress')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertErr) {
          console.error('Failed to create player progress:', insertErr);
          return;
        }
        if (newData) {
          loadFromServer({
            coins: newData.coins,
            xp: newData.xp,
            level: newData.level,
          });
        }
        loadedRef.current = true;
      }

      // Load visited shop IDs to pre-populate the client-side Set
      const { data: visits } = await supabase
        .from('player_shop_visits')
        .select('shop_id')
        .eq('user_id', user.id);

      if (visits && visits.length > 0) {
        loadVisitedShops(visits.map((v) => v.shop_id));
      }
    };

    loadProgress();
  }, [user, loadFromServer, loadVisitedShops]);

  // Reset loaded state on logout
  useEffect(() => {
    if (!user) {
      loadedRef.current = false;
    }
  }, [user]);

  const updateServer = useCallback(
    async (updates: Partial<PlayerProgress>) => {
      if (!user) return;
      const { error } = await supabase
        .from('player_progress')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to update player progress:', error);
      }
    },
    [user]
  );

  const earnCoins = useCallback(
    async (amount: number) => {
      if (!user) return;
      addCoins(amount); // Instant UI update
      const currentState = useGameStore.getState();
      await updateServer({ coins: currentState.coins });
    },
    [user, addCoins, updateServer]
  );

  const spendCoins = useCallback(
    async (amount: number): Promise<boolean> => {
      const currentCoins = useGameStore.getState().coins;
      if (currentCoins < amount) return false;
      addCoins(-amount);
      const newState = useGameStore.getState();
      await updateServer({ coins: newState.coins });
      return true;
    },
    [addCoins, updateServer]
  );

  const earnXP = useCallback(
    async (amount: number) => {
      if (!user) return;
      addXP(amount); // Instant UI update (also recalculates level)
      const currentState = useGameStore.getState();
      await updateServer({ xp: currentState.xp, level: currentState.level });
    },
    [user, addXP, updateServer]
  );

  const incrementMissions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('player_progress')
      .select('missions_completed')
      .eq('user_id', user.id)
      .single();

    if (data) {
      await updateServer({ missions_completed: data.missions_completed + 1 });
    }
  }, [user, updateServer]);

  const incrementShopsVisited = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('player_progress')
      .select('shops_visited')
      .eq('user_id', user.id)
      .single();

    if (data) {
      await updateServer({ shops_visited: data.shops_visited + 1 });
    }
  }, [user, updateServer]);

  /**
   * Records a shop visit server-side. Returns true if this was a first visit
   * (coins granted), false if already visited (no reward).
   */
  const recordShopVisit = useCallback(
    async (shopId: string): Promise<boolean> => {
      if (!user) return false;

      // Try to insert — unique constraint will reject duplicates
      const { error } = await supabase
        .from('player_shop_visits')
        .insert({ user_id: user.id, shop_id: shopId });

      if (error) {
        // 23505 = unique_violation → already visited
        if (error.code === '23505') return false;
        console.error('Failed to record shop visit:', error);
        return false;
      }

      // First visit — grant reward
      const gameState = useGameStore.getState();
      gameState.visitShop(shopId);
      await earnCoins(5);
      await incrementShopsVisited();
      return true;
    },
    [user, earnCoins, incrementShopsVisited]
  );

  /**
   * Records a mission completion with server-side first-clear detection.
   * First clear: full rewards. Replay: 0 coins + 10 XP.
   */
  const completeMission = useCallback(
    async (
      missionType: 'zombie' | 'ghost_hunt' | 'mirror_world',
      level: number,
      baseCoins: number,
      baseXP: number
    ): Promise<MissionRewardResult> => {
      if (!user) return { coinsEarned: 0, xpEarned: 0, isFirstClear: false };

      // Try to insert — unique constraint (user_id, mission_type, level)
      // will reject duplicates, just like the shop visit pattern.
      const { error } = await supabase
        .from('mission_completions')
        .insert({
          user_id: user.id,
          mission_type: missionType,
          level,
          coins_earned: baseCoins,
          xp_earned: baseXP,
        });

      if (error) {
        // 23505 = unique_violation → already completed this level
        if (error.code === '23505') {
          await earnXP(REPLAY_XP);
          await incrementMissions();
          return { coinsEarned: 0, xpEarned: REPLAY_XP, isFirstClear: false };
        }
        console.error('Failed to record mission completion:', error);
        // Deny rewards on unexpected errors to prevent exploits
        return { coinsEarned: 0, xpEarned: 0, isFirstClear: false };
      }

      // First clear — grant full rewards
      await earnCoins(baseCoins);
      await earnXP(baseXP);
      await incrementMissions();
      return { coinsEarned: baseCoins, xpEarned: baseXP, isFirstClear: true };
    },
    [user, earnCoins, earnXP, incrementMissions]
  );

  return {
    isLoggedIn: !!user,
    earnCoins,
    spendCoins,
    earnXP,
    incrementMissions,
    incrementShopsVisited,
    recordShopVisit,
    completeMission,
  };
}
