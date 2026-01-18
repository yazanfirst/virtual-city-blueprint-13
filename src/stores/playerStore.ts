import { create } from 'zustand';

// Safe spawn position (away from traps/hazards)
const SAFE_SPAWN_POSITION: [number, number, number] = [0, 0.5, 45];

// Saved state when entering shop (so we can restore when exiting)
type SavedOutsideState = {
  position: [number, number, number];
  cameraRotation: { azimuth: number; polar: number };
};

type PlayerState = {
  position: [number, number, number];
  cameraRotation: { azimuth: number; polar: number };
  jumpCounter: number;
  isInsideShop: boolean;
  savedOutsideState: SavedOutsideState | null;
  setPosition: (position: [number, number, number]) => void;
  setCameraRotation: (rotation: { azimuth: number; polar: number }) => void;
  incrementJump: () => void;
  resetToSafeSpawn: () => void;
  enterShop: () => void;
  exitShop: () => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  position: [0, 0.25, 35],
  cameraRotation: { azimuth: 0, polar: Math.PI / 4 },
  jumpCounter: 0,
  isInsideShop: false,
  savedOutsideState: null,
  incrementJump: () => set((state) => ({ jumpCounter: state.jumpCounter + 1 })),

  setPosition: (position) => set({ position }),
  setCameraRotation: (cameraRotation) => set({ cameraRotation }),
  resetToSafeSpawn: () => set({ position: SAFE_SPAWN_POSITION }),
  
  // Save current outside state and mark as inside shop
  enterShop: () => {
    const { position, cameraRotation } = get();
    set({
      isInsideShop: true,
      savedOutsideState: {
        position: [...position] as [number, number, number],
        cameraRotation: { ...cameraRotation },
      },
    });
  },
  
  // Restore outside state when exiting shop
  exitShop: () => {
    const { savedOutsideState } = get();
    if (savedOutsideState) {
      set({
        isInsideShop: false,
        position: savedOutsideState.position,
        cameraRotation: savedOutsideState.cameraRotation,
        savedOutsideState: null,
      });
    } else {
      set({ isInsideShop: false });
    }
  },
}));
