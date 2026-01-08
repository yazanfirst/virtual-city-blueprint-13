// Mulberry32 PRNG - fast, deterministic
export function createSeededRandom(seed: number) {
  return function (): number {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function seededChoice<T>(array: T[], random: () => number): T {
  return array[Math.floor(random() * array.length)];
}

export function seededWeightedChoice<T>(
  items: T[],
  weights: number[],
  random: () => number
): T {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Generate session seed - stable for current browser session
let cachedSessionSeed: number | null = null;

export function getSessionSeed(): number {
  if (cachedSessionSeed === null) {
    // Try to get from sessionStorage for persistence within tab
    const stored = sessionStorage.getItem('mission_session_seed');
    if (stored) {
      cachedSessionSeed = parseInt(stored, 10);
    } else {
      cachedSessionSeed = Date.now() + Math.floor(Math.random() * 1000000);
      sessionStorage.setItem('mission_session_seed', cachedSessionSeed.toString());
    }
  }
  return cachedSessionSeed;
}

export function resetSessionSeed(): void {
  sessionStorage.removeItem('mission_session_seed');
  cachedSessionSeed = null;
}
