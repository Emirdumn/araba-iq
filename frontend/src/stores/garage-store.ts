import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GarageCar {
  id: string;
  brand: string;
  model: string;
  package_version: string;
  year: number;
  price: number;
  fuel: string;
  gear: string;
  km: number;
  body_type: string;
  engine_power: number;
  consumption: number;
  luggage: number;
  features: string[];
  notes: string;
}

interface GarageState {
  cars: GarageCar[];
  selectedIds: string[];
  addCar: (car: Omit<GarageCar, "id">) => void;
  updateCar: (id: string, car: Partial<GarageCar>) => void;
  removeCar: (id: string) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
}

export const useGarageStore = create<GarageState>()(
  persist(
    (set, get) => ({
      cars: [],
      selectedIds: [],
      addCar: (carData) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newCar = { ...carData, id };
        set({ cars: [...get().cars, newCar] });
      },
      updateCar: (id, carData) => {
        set({
          cars: get().cars.map((c) => (c.id === id ? { ...c, ...carData } : c)),
        });
      },
      removeCar: (id) => {
        set({
          cars: get().cars.filter((c) => c.id !== id),
          selectedIds: get().selectedIds.filter((selId) => selId !== id),
        });
      },
      toggleSelection: (id) => {
        const selected = get().selectedIds;
        if (selected.includes(id)) {
          set({ selectedIds: selected.filter((selId) => selId !== id) });
        } else {
          // Allow max 4 comparisons
          if (selected.length < 4) {
            set({ selectedIds: [...selected, id] });
          }
        }
      },
      clearSelection: () => set({ selectedIds: [] }),
      selectAll: () => {
        const allIds = get().cars.map((c) => c.id).slice(0, 4);
        set({ selectedIds: allIds });
      },
    }),
    {
      name: "arabaiq-garage-storage",
    }
  )
);
