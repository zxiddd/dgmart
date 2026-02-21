import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, StatusBar, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS, ORDER_STATUS_CONFIG } from '../../src/config/theme';
import { useState, useEffect, useCallback } from 'react';
import { orderAPI } from '../../src/services/api';
import { useFocusEffect } from 'expo-router';

export default function OrdersScreen() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            const res = await orderAPI.list();
            if (res.success) {
                // Map backend status to frontend status if needed, or ensure they match
                // Backend: placed, confirmed, preparing, ready, delivered, cancelled
                // Frontend config handles these.
                const formattedOrders = res.data.orders.map(order => ({
                    id: order.id,
                    restaurant_name: order.restaurant_name,
                    items: order.items || [], // Backend now sends ["Item (Qty)"]
                    total: parseFloat(order.total),
                    status: order.status,
                    date: new Date(order.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    rating: 0, // Not verified yet
                }));
                setOrders(formattedOrders);
            }
        } catch (error) {
            console.log('Error fetching orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
            // Poll for updates while screen is focused
            const interval = setInterval(fetchOrders, 10000);
            return () => clearInterval(interval);
        }, [])
    );

    const handleCancel = (orderId) => {
        Alert.alert(
            'Cancel Order',
            'Are you sure you want to cancel this order?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await orderAPI.cancel(orderId, 'User cancelled from history');
                            if (res.success) {
                                Alert.alert('Success', 'Order cancelled successfully');
                                fetchOrders();
                            }
                        } catch (error) {
                            Alert.alert('Error', error.message || 'Failed to cancel order');
                        }
                    }
                }
            ]
        );
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const renderOrderItem = ({ item }) => {
        const config = ORDER_STATUS_CONFIG[item.status] || ORDER_STATUS_CONFIG.placed;

        return (
            <TouchableOpacity
                style={styles.orderCardV2}
                activeOpacity={0.7}
                onPress={() => router.push(`/tracking/${item.id}`)}
            >
                <View style={styles.cardHeaderV2}>
                    <View style={styles.restaurantInfoV2}>
                        <View style={styles.storeIconV2}>
                            <MaterialIcons name="store" size={24} color={COLORS.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.restaurantNameV2} numberOfLines={1}>{item.restaurant_name}</Text>
                            <Text style={styles.orderDateV2}>{item.date}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadgeV2, { backgroundColor: config.color + '15' }]}>
                        <Text style={[styles.statusTextV2, { color: config.color }]}>{config.label}</Text>
                    </View>
                </View>

                <View style={styles.dividerV2} />

                <View style={styles.itemsBlockV2}>
                    <Text style={styles.itemTextV2} numberOfLines={2}>
                        {item.items.join(', ')}
                    </Text>
                    <Text style={styles.totalTextV2}>₹{item.total}</Text>
                </View>

                <View style={styles.cardActionRowV2}>
                    {['placed', 'confirmed'].includes(item.status) ? (
                        <TouchableOpacity style={styles.cancelBtnV2} onPress={() => handleCancel(item.id)}>
                            <Text style={styles.cancelTextV2}>Cancel Order</Text>
                        </TouchableOpacity>
                    ) : item.status === 'delivered' ? (
                        <TouchableOpacity style={styles.reorderBtnV2}>
                            <MaterialIcons name="refresh" size={16} color={COLORS.primary} />
                            <Text style={styles.reorderTextV2}>Reorder</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.trackBtnV2} onPress={() => router.push(`/tracking/${item.id}`)}>
                            <Text style={styles.trackTextV2}>Track Order</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.helpBtnV2}>
                        <Text style={styles.helpTextV2}>Help</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Order History</Text>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={renderOrderItem}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                    }
                    ListHeaderComponent={() => (
                        <Text style={styles.sectionTitle}>Past Orders</Text>
                    )}
                    ListEmptyComponent={() => (
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Text style={{ color: COLORS.textSecondary }}>No past orders found.</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        paddingTop: 50, paddingBottom: 16, paddingHorizontal: SIZES.padding,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 2,
    },
    headerTitle: { fontSize: SIZES.xl, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    listContent: { padding: SIZES.padding },
    sectionTitle: {
        fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.textSecondary,
        marginBottom: 16, marginTop: 8,
    },
    orderCardV2: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        ...SHADOWS.sm,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    cardHeaderV2: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    restaurantInfoV2: {
        flex: 1,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    storeIconV2: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    restaurantNameV2: {
        fontSize: 16,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
    },
    orderDateV2: {
        fontSize: 12,
        fontFamily: FONTS.medium,
        color: COLORS.textLight,
        marginTop: 2,
    },
    statusBadgeV2: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusTextV2: {
        fontSize: 10,
        fontFamily: FONTS.bold,
        textTransform: 'uppercase',
    },
    dividerV2: {
        height: 1,
        backgroundColor: COLORS.borderLight,
        marginVertical: 12,
    },
    itemsBlockV2: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    itemTextV2: {
        flex: 1,
        fontSize: 14,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
        paddingRight: 10,
    },
    totalTextV2: {
        fontSize: 16,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
    },
    cardActionRowV2: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'flex-end',
    },
    reorderBtnV2: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    reorderTextV2: {
        fontSize: 14,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
    },
    cancelBtnV2: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.error,
    },
    cancelTextV2: {
        fontSize: 14,
        fontFamily: FONTS.bold,
        color: COLORS.error,
    },
    trackBtnV2: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    trackTextV2: {
        fontSize: 14,
        fontFamily: FONTS.bold,
        color: COLORS.white,
    },
    helpBtnV2: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    helpTextV2: {
        fontSize: 14,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
});
