import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
    items: [],
    restaurantId: null,
    restaurantName: null,

    // Add item to cart
    addItem: (item, restaurant) => {
        const state = get();

        // If cart has items from a different restaurant, clear first
        if (state.restaurantId && state.restaurantId !== restaurant.id) {
            set({
                items: [{ ...item, quantity: 1 }],
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
            });
            return 'replaced';
        }

        const existingIndex = state.items.findIndex(
            (i) => i.id === item.id && JSON.stringify(i.customizations) === JSON.stringify(item.customizations)
        );

        if (existingIndex >= 0) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += 1;
            set({ items: newItems });
        } else {
            set({
                items: [...state.items, { ...item, quantity: 1 }],
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
            });
        }
        return 'added';
    },

    // Update item quantity
    updateQuantity: (itemId, change) => {
        const state = get();
        const index = state.items.findIndex(i => i.id === itemId);
        if (index === -1) return;

        const newItems = [...state.items];
        newItems[index].quantity += change;

        if (newItems[index].quantity <= 0) {
            newItems.splice(index, 1);
        }

        if (newItems.length === 0) {
            set({ items: [], restaurantId: null, restaurantName: null });
        } else {
            set({ items: newItems });
        }
    },

    // Remove item
    removeItem: (itemId) => {
        const state = get();
        const index = state.items.findIndex(i => i.id === itemId);
        if (index === -1) return;

        const newItems = [...state.items];
        newItems.splice(index, 1);

        if (newItems.length === 0) {
            set({ items: [], restaurantId: null, restaurantName: null });
        } else {
            set({ items: newItems });
        }
    },

    // Clear cart
    clearCart: () => set({ items: [], restaurantId: null, restaurantName: null }),

    // Get subtotal
    getSubtotal: () => {
        return get().items.reduce((sum, item) => {
            let itemTotal = item.price * item.quantity;
            if (item.customizations) {
                item.customizations.forEach((c) => {
                    c.selected_options?.forEach((o) => {
                        itemTotal += o.price * item.quantity;
                    });
                });
            }
            return sum + itemTotal;
        }, 0);
    },

    // Get total items count
    getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
    },
}));
