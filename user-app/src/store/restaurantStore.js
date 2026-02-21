import { create } from 'zustand';

export const useRestaurantStore = create((set, get) => ({
    restaurants: {}, // Cache: { [id]: { ...data, timestamp } }

    setRestaurant: (id, data) => set((state) => ({
        restaurants: {
            ...state.restaurants,
            [id]: {
                ...data,
                timestamp: Date.now()
            }
        }
    })),

    getRestaurant: (id) => {
        const cached = get().restaurants[id];
        if (!cached) return null;

        // Optional: Expire cache after 15 minutes
        const isExpired = Date.now() - cached.timestamp > 15 * 60 * 1000;
        return isExpired ? null : cached;
    },

    clearCache: () => set({ restaurants: {} })
}));
