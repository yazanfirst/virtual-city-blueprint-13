
## Fix: Reset Game State on Sign Out

### Problem
When a user signs out, their game data (Level, Coins, XP) remains in the Zustand store memory. The next visitor (or the same person before signing in again) sees the previous user's progress in the Player Panel. This is because `signOut()` in `useAuth.tsx` only clears authentication state but never calls `resetGame()` on the game store or `resetPlayer()` on the player store.

### Solution
Reset all Zustand stores when the user signs out or when the auth state changes to "signed out". There are two places to fix:

**1. `src/hooks/usePlayerProgress.ts`** -- Reset game store on logout

The hook already detects logout (`if (!user)`) but only resets `loadedRef`. It needs to also call `resetGame()` to clear coins/XP/level back to defaults (100 coins, 0 XP, Level 1).

```
useEffect(() => {
  if (!user) {
    loadedRef.current = false;
    useGameStore.getState().resetGame();    // <-- add this
    usePlayerStore.getState().resetPlayer(); // <-- add this
  }
}, [user]);
```

**2. `src/hooks/useAuth.tsx`** -- Belt-and-suspenders reset in signOut

As a safety net, also reset the stores directly in the `signOut` function so that even if the hook hasn't re-rendered yet, the data is cleared immediately:

```typescript
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';

const signOut = async () => {
  await supabase.auth.signOut();
  setUser(null);
  setSession(null);
  setUserRole(null);
  useGameStore.getState().resetGame();
  usePlayerStore.getState().resetPlayer();
};
```

### Technical Details
- `resetGame()` sets coins=100, xp=0, level=1, and clears visited shops and collected coins
- `resetPlayer()` resets position, camera, jump counter, and shop interior state
- Both stores already have these reset functions -- they just are never called on sign out
- No database changes needed -- this is purely a client-side state cleanup issue

### Files to Edit
- `src/hooks/useAuth.tsx` -- import stores and call reset in `signOut()`
- `src/hooks/usePlayerProgress.ts` -- call `resetGame()` and `resetPlayer()` in the logout effect
