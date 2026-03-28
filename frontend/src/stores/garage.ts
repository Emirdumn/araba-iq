import { create } from "zustand";
import {
  fetchGarageCars,
  createGarageCar,
  updateGarageCar,
  deleteGarageCar,
  type GarageCar,
  type GarageCarInput,
} from "@/lib/araba-iq-client";

const MAX_COMPARE = 4;

interface GarageState {
  cars: GarageCar[];
  loading: boolean;
  selectedIds: Set<number>;

  load: () => Promise<void>;
  addCar: (input: Partial<GarageCarInput>) => Promise<GarageCar>;
  editCar: (id: number, input: Partial<GarageCarInput>) => Promise<GarageCar>;
  removeCar: (id: number) => Promise<void>;
  getById: (id: number) => GarageCar | undefined;

  toggleSelect: (id: number) => void;
  isSelected: (id: number) => boolean;
  clearSelection: () => void;
  selectedCars: () => GarageCar[];
}

export const useGarageStore = create<GarageState>()((set, get) => ({
  cars: [],
  loading: false,
  selectedIds: new Set(),

  load: async () => {
    set({ loading: true });
    try {
      const cars = await fetchGarageCars();
      set({ cars });
    } catch {
      set({ cars: [] });
    } finally {
      set({ loading: false });
    }
  },

  addCar: async (input) => {
    const car = await createGarageCar(input);
    set((s) => ({ cars: [car, ...s.cars] }));
    return car;
  },

  editCar: async (id, input) => {
    const car = await updateGarageCar(id, input);
    set((s) => ({ cars: s.cars.map((c) => (c.id === id ? car : c)) }));
    return car;
  },

  removeCar: async (id) => {
    await deleteGarageCar(id);
    set((s) => {
      const next = new Set(s.selectedIds);
      next.delete(id);
      return { cars: s.cars.filter((c) => c.id !== id), selectedIds: next };
    });
  },

  getById: (id) => get().cars.find((c) => c.id === id),

  toggleSelect: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_COMPARE) {
        next.add(id);
      }
      return { selectedIds: next };
    }),

  isSelected: (id) => get().selectedIds.has(id),

  clearSelection: () => set({ selectedIds: new Set() }),

  selectedCars: () => {
    const { cars, selectedIds } = get();
    return cars.filter((c) => selectedIds.has(c.id));
  },
}));

export { MAX_COMPARE };
