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
const PAGE_SIZE = 30;

interface GarageState {
  cars: GarageCar[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  search: string;
  selectedIds: Set<number>;

  load: (search?: string) => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: () => boolean;
  setSearch: (q: string) => void;

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
  total: 0,
  loading: false,
  loadingMore: false,
  search: "",
  selectedIds: new Set(),

  load: async (search) => {
    const q = search ?? get().search;
    set({ loading: true, search: q });
    try {
      const res = await fetchGarageCars({ limit: PAGE_SIZE, offset: 0, search: q || undefined });
      set({ cars: res.items, total: res.total });
    } catch {
      set({ cars: [], total: 0 });
    } finally {
      set({ loading: false });
    }
  },

  loadMore: async () => {
    const { cars, total, search, loadingMore } = get();
    if (loadingMore || cars.length >= total) return;
    set({ loadingMore: true });
    try {
      const res = await fetchGarageCars({ limit: PAGE_SIZE, offset: cars.length, search: search || undefined });
      set((s) => ({ cars: [...s.cars, ...res.items], total: res.total }));
    } finally {
      set({ loadingMore: false });
    }
  },

  hasMore: () => {
    const { cars, total } = get();
    return cars.length < total;
  },

  setSearch: (q) => {
    set({ search: q });
    get().load(q);
  },

  addCar: async (input) => {
    const car = await createGarageCar(input);
    set((s) => ({ cars: [car, ...s.cars], total: s.total + 1 }));
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
      return { cars: s.cars.filter((c) => c.id !== id), selectedIds: next, total: s.total - 1 };
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
