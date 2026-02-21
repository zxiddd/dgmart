import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS, ORDER_STATUS_CONFIG } from '../../src/config/theme';
import { orderAPI } from '../../src/services/api';
import io from 'socket.io-client';

// Use same base URL as API but without /api suffix
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://172.20.10.2:5000';

const TRACKING_STEPS = ['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered'];

export default function TrackingScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [driverLocation, setDriverLocation] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        fetchOrder();

        // Initialize Socket
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket'],
            // connection options
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Socket connected');
            socket.emit('order:subscribe', id);
        });

        socket.on('order_update', (data) => {
            console.log('Order update received:', data);
            if (data.order_id === id) {
                setOrder(prev => ({ ...prev, status: data.status }));
            }
        });

        socket.on('delivery:location', (data) => {
            console.log('Driver location update:', data);
            if (data.order_id === id) {
                setDriverLocation({ lat: data.lat, lng: data.lng });
            }
        });

        socket.on('new_assignment', (data) => {
            console.log('New driver assigned:', data);
            if (data.order_id === id) {
                fetchOrder(); // Refresh to get full partner details
            }
        });

        return () => {
            if (socket) {
                socket.emit('order:unsubscribe', id);
                socket.disconnect();
            }
        };
    }, [id]);

    const fetchOrder = async () => {
        try {
            const res = await orderAPI.getById(id);
            if (res.success) {
                setOrder({
                    ...res.data.order,
                    delivery_partner: res.data.delivery ? {
                        name: res.data.delivery.partner_name,
                        phone: res.data.delivery.partner_phone,
                    } : null
                });
            }
        } catch {
            // Demo order fallback
            setOrder({
                id,
                order_number: 'DM-20260212-A1B2',
                restaurant_name: 'Biryani Palace',
                status: 'preparing',
                total: 399,
                items: [
                    { item_name: 'Chicken Biryani', quantity: 1, item_price: 249 },
                    { item_name: 'Chicken 65', quantity: 1, item_price: 199 },
                ],
                placed_at: new Date().toISOString(),
                estimated_delivery: '35 min',
                delivery_partner: null,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
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
                            const res = await orderAPI.cancel(id, 'User cancelled from tracking');
                            if (res.success) {
                                Alert.alert('Success', 'Order cancelled successfully');
                                fetchOrder();
                            }
                        } catch (error) {
                            Alert.alert('Error', error.message || 'Failed to cancel order');
                        }
                    }
                }
            ]
        );
    };

    if (!order) return null;

    const currentStepIndex = TRACKING_STEPS.indexOf(order.status);
    const statusConfig = ORDER_STATUS_CONFIG[order.status] || {};

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Tracking</Text>
                <TouchableOpacity>
                    <MaterialIcons name="headset-mic" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Modern Status Card */}
                <View style={styles.statusCardV2}>
                    <View style={[styles.statusIconWrapperV2, { backgroundColor: statusConfig.color + '15' }]}>
                        <MaterialIcons name={statusConfig.icon || 'info'} size={32} color={statusConfig.color} />
                    </View>
                    <View style={styles.statusTextWrapperV2}>
                        <Text style={styles.statusTitleV2}>{statusConfig.label}</Text>
                        <Text style={styles.statusMsgV2}>
                            {order.status === 'preparing' && 'We are cooking your delicious meal 👨‍🍳'}
                            {order.status === 'placed' && 'Order sent to restaurant 🕐'}
                            {order.status === 'confirmed' && 'Restaurant is preparing items ✅'}
                            {order.status === 'ready' && 'Your order is ready for pickup 📦'}
                            {order.status === 'picked_up' && 'Delivery partner is headed your way 🏍️'}
                            {order.status === 'delivered' && 'Order delivered successfully 🎉'}
                            {order.status === 'cancelled' && 'This order was cancelled ❌'}
                        </Text>
                    </View>

                    {order.estimated_delivery && order.status !== 'delivered' && (
                        <View style={styles.etaBadgeV2}>
                            <Text style={styles.etaTimeV2}>{order.estimated_delivery}</Text>
                            <Text style={styles.etaLabelV2}>EST. TIME</Text>
                        </View>
                    )}
                </View>

                {/* Delivery OTP Section (New) */}
                {order.status === 'picked_up' && (
                    <View style={styles.otpCard}>
                        <View style={styles.otpHeader}>
                            <MaterialIcons name="lock-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.otpLabel}>Delivery Verification Code</Text>
                        </View>
                        <View style={styles.otpCodeContainer}>
                            <Text style={styles.otpCode}>{order.delivery_otp || '----'}</Text>
                        </View>
                        <Text style={styles.otpHint}>Please share this code with the delivery partner only after receiving your order.</Text>
                    </View>
                )}

                {/* Refined Timeline */}
                <View style={styles.timelineContainerV2}>
                    <Text style={styles.sectionTitleV2}>Track History</Text>
                    {TRACKING_STEPS.map((step, index) => {
                        const config = ORDER_STATUS_CONFIG[step];
                        const isCompleted = index <= currentStepIndex;
                        const isActive = index === currentStepIndex;

                        return (
                            <View key={step} style={styles.timelineRowV2}>
                                <View style={styles.timelineIndicatorV2}>
                                    <View style={[
                                        styles.timelinePointV2,
                                        isCompleted && { backgroundColor: config.color },
                                        isActive && styles.timelinePointActiveV2,
                                    ]}>
                                        {isCompleted && <MaterialIcons name="check" size={10} color={COLORS.white} />}
                                    </View>
                                    {index < TRACKING_STEPS.length - 1 && (
                                        <View style={[
                                            styles.timelinePathV2,
                                            isCompleted && index < currentStepIndex && { backgroundColor: config.color },
                                        ]} />
                                    )}
                                </View>
                                <View style={styles.timelineLabelWrapperV2}>
                                    <Text style={[
                                        styles.timelineLabelV2,
                                        isCompleted && { color: COLORS.textPrimary, fontFamily: FONTS.bold },
                                        isActive && { color: COLORS.primary }
                                    ]}>
                                        {config.label}
                                    </Text>
                                    {isActive && (
                                        <Text style={styles.timelineNowV2}>In Progress</Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Clean Order Summary */}
                <View style={styles.orderSummaryV2}>
                    <Text style={styles.sectionTitleV2}>Order Summary</Text>
                    <View style={styles.summaryTopV2}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={styles.orderNumberV2}>Order #{order.order_number}</Text>
                                <Text style={styles.restaurantNameSmallV2}>{order.restaurant_name}</Text>
                            </View>
                            {order.restaurant_phone && (
                                <TouchableOpacity
                                    style={styles.contactIconBtn}
                                    onPress={() => Alert.alert('Call Restaurant', `Call ${order.restaurant_name} at ${order.restaurant_phone}?`)}
                                >
                                    <MaterialIcons name="call" size={18} color={COLORS.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.summaryDividerV2} />

                    {(order.items || []).map((item, i) => (
                        <View key={i} style={styles.summaryItemRowV2}>
                            <Text style={styles.summaryItemNameV2}>{item.quantity} x {item.item_name}</Text>
                            <Text style={styles.summaryItemPriceV2}>₹{item.item_price * item.quantity}</Text>
                        </View>
                    ))}

                    <View style={styles.summaryDividerV2} />

                    <View style={styles.totalRowV2}>
                        <Text style={styles.totalLabelV2}>Amount Paid</Text>
                        <Text style={styles.totalValueV2}>₹{order.total}</Text>
                    </View>
                </View>

                {/* Delivery Driver */}
                {order.delivery_partner && (
                    <View style={styles.partnerCardV2}>
                        <View style={styles.partnerAvatarV2}>
                            <MaterialIcons name="delivery-dining" size={28} color={COLORS.white} />
                        </View>
                        <View style={styles.partnerInfoV2}>
                            <Text style={styles.partnerNameV2}>{order.delivery_partner.name || 'Assigning Partner...'}</Text>
                            <Text style={styles.partnerSubV2}>
                                {order.delivery_partner.phone ? order.delivery_partner.phone : 'Contact details available after pickup'}
                            </Text>
                        </View>
                        {order.delivery_partner.phone && (
                            <TouchableOpacity
                                style={styles.partnerCallBtnV2}
                                onPress={() => Alert.alert('Call Partner', `Call ${order.delivery_partner.name} at ${order.delivery_partner.phone}?`)}
                            >
                                <MaterialIcons name="call" size={20} color={COLORS.white} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {['placed', 'confirmed'].includes(order.status) && (
                    <TouchableOpacity style={styles.cancelLinkV2} onPress={handleCancel}>
                        <Text style={styles.cancelLinkTextV2}>Need to cancel? Click here</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 60 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
        backgroundColor: COLORS.white,
        ...SHADOWS.sm,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
    },
    scroll: {
        padding: 16,
    },
    // Updated Styles V2
    statusCardV2: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        ...SHADOWS.md,
    },
    statusIconWrapperV2: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusTextWrapperV2: {
        flex: 1,
        marginLeft: 16,
    },
    statusTitleV2: {
        fontSize: 18,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
    },
    statusMsgV2: {
        fontSize: 12,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    etaBadgeV2: {
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
    },
    etaTimeV2: {
        fontSize: 14,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
    },
    etaLabelV2: {
        fontSize: 8,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
        marginTop: 2,
    },

    timelineContainerV2: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        ...SHADOWS.sm,
    },
    sectionTitleV2: {
        fontSize: 16,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        marginBottom: 20,
    },
    timelineRowV2: {
        flexDirection: 'row',
        minHeight: 50,
    },
    timelineIndicatorV2: {
        width: 30,
        alignItems: 'center',
    },
    timelinePointV2: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.borderLight,
        zIndex: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelinePointActiveV2: {
        borderWidth: 3,
        borderColor: COLORS.primary + '30',
        backgroundColor: COLORS.primary,
    },
    timelinePathV2: {
        width: 2,
        flex: 1,
        backgroundColor: COLORS.borderLight,
        marginVertical: -5,
    },
    timelineLabelWrapperV2: {
        flex: 1,
        marginLeft: 12,
        paddingBottom: 20,
    },
    timelineLabelV2: {
        fontSize: 14,
        fontFamily: FONTS.medium,
        color: COLORS.textLight,
    },
    timelineNowV2: {
        fontSize: 10,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
        marginTop: 4,
    },

    orderSummaryV2: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        ...SHADOWS.sm,
    },
    summaryTopV2: {
        marginBottom: 12,
    },
    orderNumberV2: {
        fontSize: 12,
        fontFamily: FONTS.semiBold,
        color: COLORS.textLight,
    },
    restaurantNameSmallV2: {
        fontSize: 15,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        marginTop: 4,
    },
    summaryDividerV2: {
        height: 1,
        backgroundColor: COLORS.borderLight,
        marginVertical: 12,
    },
    summaryItemRowV2: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryItemNameV2: {
        fontSize: 13,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
    summaryItemPriceV2: {
        fontSize: 13,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
    },
    totalRowV2: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    totalLabelV2: {
        fontSize: 15,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
    },
    totalValueV2: {
        fontSize: 16,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
    },

    partnerCardV2: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 16,
        ...SHADOWS.md,
    },
    partnerAvatarV2: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    partnerInfoV2: {
        flex: 1,
        marginLeft: 16,
    },
    partnerNameV2: {
        fontSize: 15,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
    },
    partnerSubV2: {
        fontSize: 12,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    partnerCallBtnV2: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelLinkV2: {
        marginTop: 20,
        alignItems: 'center',
    },
    cancelLinkTextV2: {
        fontSize: 13,
        fontFamily: FONTS.bold,
        color: COLORS.error,
        textDecorationLine: 'underline',
    },
    contactIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // OTP Card Styles
    otpCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary + '30',
        borderStyle: 'dashed',
        ...SHADOWS.md,
    },
    otpHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    otpLabel: {
        fontSize: 12,
        fontFamily: FONTS.bold,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    otpCodeContainer: {
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    otpCode: {
        fontSize: 32,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
        letterSpacing: 8,
    },
    otpHint: {
        fontSize: 11,
        fontFamily: FONTS.medium,
        color: COLORS.textLight,
        textAlign: 'center',
        lineHeight: 16,
    },
});
