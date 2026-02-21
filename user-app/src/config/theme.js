export const COLORS = {
    // Brand Colors
    primary: '#D4AF37', // Gold - keeping the brand color
    primaryLight: '#F3E5AB', // Light Gold for backgrounds
    primaryDark: '#B4941F',

    // Gradients
    gradients: {
        primary: ['#D4AF37', '#AA8A09'], // Rich Gold to Darker Gold
        darkGold: ['#AA8A09', '#786004'], // Dark Gold to Deep Bronze
        premium: ['#F3E5AB', '#D4AF37', '#856d12'], // Light to Deep Dark (3 step)
        header: ['#B8860B', '#8B6508'], // Dark Goldenrod to Darker
    },

    // Theme Colors (Light Mode)
    background: '#F8F9FA', // Off-white/Light Gray for app background
    surface: '#FFFFFF', // Pure White for cards
    surfaceLight: '#F3F4F6', // Very light gray for inputs/secondary backgrounds

    // Text Colors
    textPrimary: '#1F2937', // Dark Gray/Almost Black for headings
    textSecondary: '#6B7280', // Medium Gray for body text
    textLight: '#9CA3AF', // Light Gray for placeholders
    textInverse: '#FFFFFF', // White text on dark/gold backgrounds

    // Status Colors
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    // UI Elements
    border: '#E5E7EB',
    borderLight: '#F0F0F0',
    overlay: 'rgba(0,0,0,0.5)',
    white: '#FFFFFF',
    black: '#000000',

    // Functional
    veg: '#10B981',
    nonVeg: '#EF4444',
};

export const FONTS = {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    black: 'Inter_900Black',
};

export const SIZES = {
    // Font sizes
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,

    // Spacing
    padding: 16,
    paddingSm: 12,
    paddingLg: 24,
    radius: 12,
    radiusSm: 8,
    radiusLg: 16,
    radiusFull: 999,

    // Layout
    tabBarHeight: 60,
};

export const SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    premium: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    gold: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
};

export const ORDER_STATUS_CONFIG = {
    placed: { label: 'Placed', color: '#3B82F6', icon: 'check-circle' },
    confirmed: { label: 'Confirmed', color: '#8B5CF6', icon: 'restaurant' },
    preparing: { label: 'Preparing', color: '#F59E0B', icon: 'soup-kitchen' },
    ready: { label: 'Ready', color: '#10B981', icon: 'inventory' },
    picked_up: { label: 'Out for Delivery', color: '#D4AF37', icon: 'delivery-dining' },
    out_for_delivery: { label: 'Out for Delivery', color: '#D4AF37', icon: 'delivery-dining' },
    delivered: { label: 'Delivered', color: '#10B981', icon: 'check-circle' },
    cancelled: { label: 'Cancelled', color: '#EF4444', icon: 'cancel' },
};
