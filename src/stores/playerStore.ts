import { create } from 'zustand';

type PlayerState = {
  position: [number, number, number];
  cameraRotation: { azimuth: number; polar: number };
  setPosition: (position: [number, number, number]) => void;
  setCameraRotation: (rotation: { azimuth: number; polar: number }) => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  position: [0, 0.25, 35],
  cameraRotation: { azimuth: 0, polar: Math.PI / 4 },
  setPosition: (position) => set({ position }),
  setCameraRotation: (cameraRotation) => set({ cameraRotation }),
}));
