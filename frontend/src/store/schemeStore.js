import { create } from 'zustand';

export const useSchemeStore = create((set) => ({
  schemes: [],
  totalSchemes: 0,
  nextCursor: null,
  filters: {
    state: '',
    category: '',
    benefitType: '',
    search: '',
    sort: 'newest',
  },
  isLoading: false,

  setSchemes: (schemes, nextCursor) => set({ schemes, nextCursor }),
  appendSchemes: (more, nextCursor) =>
    set((state) => ({ schemes: [...state.schemes, ...more], nextCursor })),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters }, schemes: [], nextCursor: null })),
  setLoading: (isLoading) => set({ isLoading }),
  clearSchemes: () => set({ schemes: [], nextCursor: null }),
}));
