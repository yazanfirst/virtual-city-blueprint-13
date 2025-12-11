import { create } from 'zustand';

type PlayerState = {
  position: [number, number, number];
  cameraRotation: { azimuth: number; polar: number };
  jumpCounter: number;
  setPosition: (position: [number, number, number]) => void;
  setCameraRotation: (rotation: { azimuth: number; polar: number }) => void;
  incrementJump: () => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  position: [0, 0.25, 35],
  cameraRotation: { azimuth: 0, polar: Math.PI / 4 },
  jumpCounter: 0,
  incrementJump: () => set((state) => ({ jumpCounter: state.jumpCounter + 1 })),

  setPosition: (position) => set({ position }),
  setCameraRotation: (cameraRotation) => set({ cameraRotation }),
}));
