import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Animated } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS, SIZES, ORDER_STATUS_CONFIG } from '../src/config/theme';
import { orderAPI } from '../src/services/api';
import { useCartStore } from '../src/store/cartStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32; // Full width minus padding

export default function LiveOrderFloat() {
    const router = useRouter();
    const pathname = usePathname();
    const [activeOrder, setActiveOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    // Cart Data
    const totalItems = useCartStore((s) => s.getTotalItems());
    const cartTotal = useCartStore((s) => s.getSubtotal());
    const restaurantName = useCartStore((s) => s.restaurantName);

    useEffect(() => {
        checkActiveOrders();
        const interval = setInterval(checkActiveOrders, 10000); // 10s polling
        return () => clearInterval(interval);
    }, []);

    // Don't show on tracking info screen or checkout to prevent clutter
    if (pathname.includes('/tracking/') || pathname.includes('/checkout') || pathname.includes('/cart')) return null;

    const checkActiveOrders = async () => {
        try {
            const res = await orderAPI.list({ limit: 5 });
            if (res.success && res.data.orders.length > 0) {
                const current = res.data.orders.find(o =>
                    ['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery'].includes(o.status)
                );
                setActiveOrder(current || null);
            } else {
                setActiveOrder(null);
            }
        } catch (e) {
            console.log('Error checking active orders:', e);
        } finally {
            setLoading(false);
        }
    };

    // Determine what slides to show
    const showOrder = !!activeOrder;
    const showCart = totalItems > 0;

    if (!showOrder && !showCart) return null;

    const slides = [];

    if (showOrder) {
        slides.push({ type: 'order', data: activeOrder });
    }

    if (showCart) {
        slides.push({ type: 'cart', data: { totalItems, cartTotal, restaurantName } });
    }

    return (
        <View style={styles.containerWrapper}>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {slides.map((slide, index) => (
                    <View key={slide.type} style={styles.cardContainer}>
                        {slide.type === 'order' ? (
                            <OrderCard order={slide.data} router={router} />
                        ) : (
                            <CartCard data={slide.data} router={router} />
                        )}
                    </View>
                ))}
            </ScrollView>

            {/* Pagination Dots */}
            {slides.length > 1 && (
                <View style={styles.pagination}>
                    {slides.map((_, i) => (
                        <View key={i} style={[styles.dot, { opacity: 1 }]} /> // Simplified dots for now
                    ))}
                </View>
            )}
        </View>
    );
}

function OrderCard({ order, router }) {
    const config = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.placed;

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => router.push(`/tracking/${order.id}`)}
        >
            <View style={styles.content}>
                <View style={[styles.iconBox, { backgroundColor: config.color + '20' }]}>
                    <MaterialIcons name={config.icon || 'restaurant'} size={24} color={config.color} />
                </View>
                <View style={styles.info}>
                    <Text style={styles.title}>Order {order.status === 'placed' ? 'Placed' : 'Update'}</Text>
                    <Text style={styles.subtitle}>
                        {config.label} • {order.restaurant_name}
                    </Text>
                </View>
                <View style={styles.arrow}>
                    <MaterialIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
                </View>
            </View>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, {
                    backgroundColor: config.color,
                    width: getProgressWidth(order.status)
                }]} />
            </View>
        </TouchableOpacity>
    );
}

function CartCard({ data, router }) {
    return (
        <TouchableOpacity
            style={[styles.card, { borderColor: COLORS.primary }]}
            activeOpacity={0.9}
            onPress={() => router.push('/cart')}
        >
            <View style={styles.content}>
                <View style={[styles.iconBox, { backgroundColor: COLORS.primary + '20' }]}>
                    <MaterialIcons name="shopping-bag" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.info}>
                    <Text style={styles.title}>View Cart ({data.totalItems})</Text>
                    <Text style={styles.subtitle}>
                        ₹{data.cartTotal} • {data.restaurantName}
                    </Text>
                </View>
                <View style={styles.arrow}>
                    <MaterialIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

const getProgressWidth = (status) => {
    switch (status) {
        case 'placed': return '20%';
        case 'confirmed': return '40%';
        case 'preparing': return '60%';
        case 'ready': return '80%';
        case 'picked_up': case 'out_for_delivery': return '90%';
        default: return '0%';
    }
};

const styles = StyleSheet.create({
    containerWrapper: {
        position: 'absolute',
        bottom: SIZES.tabBarHeight + 16,
        left: 0,
        right: 0,
        height: 80, // Fixed height for area
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 8, // Gap between cards if not paging, but with paging usually 0
    },
    cardContainer: {
        width: CARD_WIDTH,
        marginRight: 0, // Since we used pagingEnabled, exact width matters
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        ...SHADOWS.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.primary + '20',
        marginHorizontal: 4, // Small gap simulate
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
    },
    subtitle: {
        fontSize: 12,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
    progressBarBg: {
        height: 3,
        backgroundColor: COLORS.borderLight,
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
    },
    pagination: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: -15,
        alignSelf: 'center',
        gap: 6
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
    }
});
