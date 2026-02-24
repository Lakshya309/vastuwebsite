import { create } from "zustand";
import { Wall } from "../floorPlanInterfaces";

interface ProjectState {
  liveNorthDirection: number;
  setLiveNorthDirection: (direction: number) => void;
  walls: Wall[];
  addWall: (wall: Wall) => void;
  updateWall: (wall: Wall) => void;
  removeWall: (wallId: string) => void;
  setWalls: (walls: Wall[]) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  liveNorthDirection: 0,
  setLiveNorthDirection: (direction) => set({ liveNorthDirection: direction }),
  walls: [],
  addWall: (wall) => set((state) => ({ walls: [...state.walls, wall] })),
  updateWall: (wall) =>
    set((state) => ({
      walls: state.walls.map((w) => (w.id === wall.id ? wall : w)),
    })),
  removeWall: (wallId) =>
    set((state) => ({ walls: state.walls.filter((w) => w.id !== wallId) })),
  setWalls: (walls) => set({ walls }),
}));
