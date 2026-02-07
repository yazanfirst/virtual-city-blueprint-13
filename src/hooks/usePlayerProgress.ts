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

export function usePlayerProgress() {
  const { user } = useAuth();
  const loadFromServer = useGameStore((s) => s.loadFromServer);
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
    };

    loadProgress();
  }, [user, loadFromServer]);

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

  return {
    isLoggedIn: !!user,
    earnCoins,
    spendCoins,
    earnXP,
    incrementMissions,
    incrementShopsVisited,
  };
}
