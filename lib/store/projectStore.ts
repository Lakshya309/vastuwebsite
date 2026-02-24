import { create } from "zustand";

interface ProjectState {
  liveNorthDirection: number;
  setLiveNorthDirection: (direction: number) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  liveNorthDirection: 0,
  setLiveNorthDirection: (direction) => set({ liveNorthDirection: direction }),
}));
