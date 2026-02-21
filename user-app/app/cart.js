import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, StyleSheet, LayoutAnimation, Platform, UIManager, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { COLORS, FONTS, SIZES, SHADOWS } from '../src/config/theme';
import { useCartStore } from '../src/store/cartStore';
import { useAuthStore } from '../src/store/authStore';
import { orderAPI, paymentAPI } from '../src/services/api';
import Toast from 'react-native-toast-message';
// Note: This requires react-native-razorpay to be installed and used in a Development Build
import RazorpayCheckout from 'react-native-razorpay';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function CartScreen() {
    const router = useRouter();
    const { items, restaurantId, restaurantName, updateQuantity, removeItem, clearCart, getSubtotal } = useCartStore();
    const { currentAddress, user, profile } = useAuthStore();

    const [itemsLoading, setItemsLoading] = useState(false);
    const [orderLoading, setOrderLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [previewData, setPreviewData] = useState(null);
    const [phone, setPhone] = useState(profile?.phone || '');

    useEffect(() => {
        if (profile?.phone) {
            setPhone(profile.phone);
        }
    }, [profile]);

    useEffect(() => {
        if (items.length > 0 && currentAddress) {
            fetchPreview();
        } else {
            setPreviewData(null);
        }
    }, [items, currentAddress]);

    const fetchPreview = async () => {
        try {
            setItemsLoading(true);
            const res = await orderAPI.preview({
                restaurant_id: restaurantId,
                address_id: currentAddress.id,
                items: items.map(i => ({ item_id: i.id, quantity: i.quantity }))
            });
            if (res.success) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setPreviewData(res.data);
            }
        } catch (error) {
            console.log('Preview error:', error);
        } finally {
            setItemsLoading(false);
        }
    };

    const handleUpdateQuantity = (itemId, change) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        updateQuantity(itemId, change);
    };

    const handleRemoveItem = (itemId) => {
        Alert.alert(
            "Remove Item",
            "Are you sure you want to remove this item?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        removeItem(itemId);
                    }
                }
            ]
        );
    };

    const handleClearCart = () => {
        Alert.alert(
            "Clear Cart",
            "Are you sure you want to clear your cart?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: () => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        clearCart();
                    }
                }
            ]
        );
    };

    const onOrderSuccess = async (orderNumber) => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: 'https://www.soundjay.com/misc/sounds/magic-chime-01.mp3' }
            );
            await sound.playAsync();
        } catch (error) {
            console.log('Error playing sound', error);
        }

        clearCart();
        Toast.show({
            type: 'success',
            text1: 'Order Placed Successfully! ✅',
            text2: `Order #${orderNumber}`,
            visibilityTime: 4000
        });
        router.replace('/(tabs)/orders');
    };

    const handlePlaceOrder = async () => {
        if (!currentAddress) {
            Alert.alert('Address Missing', 'Please select a delivery address.', [
                { text: 'Select Address', onPress: () => router.push('/addresses') },
                { text: 'Cancel', style: 'cancel' }
            ]);
            return;
        }

        if (items.length === 0) return;

        setOrderLoading(true);
        try {
            const orderData = {
                restaurant_id: restaurantId,
                address_id: currentAddress.id,
                payment_method: paymentMethod,
                phone: profile?.phone || phone,
                items: items.map(i => ({
                    item_id: i.id,
                    quantity: i.quantity,
                    customizations: i.customizations ? i.customizations.map(c => ({
                        group_name: c.group_name || 'Default',
                        selected_options: c.selected_options || []
                    })) : []
                })),
                tip: 0,
            };

            const res = await orderAPI.create(orderData);

            if (res.success) {
                // Handle Online Payment
                if (paymentMethod === 'online' && res.data.order.razorpay_order_id) {
                    try {
                        const options = {
                            description: 'Ordering from Degloor Mart',
                            image: 'https://i.imgur.com/3989v9.png', // Logo
                            currency: 'INR',
                            key: res.data.razorpay_key_id,
                            amount: Math.round(res.data.order.total * 100),
                            name: 'Degloor Mart',
                            order_id: res.data.order.razorpay_order_id,
                            prefill: {
                                email: user?.email || '',
                                contact: profile?.phone || '',
                                name: profile?.name || user?.email?.split('@')[0] || 'User'
                            },
                            theme: { color: COLORS.primary }
                        };

                        const paymentData = await RazorpayCheckout.open(options);

                        // Verify on backend
                        const verifyRes = await paymentAPI.verify({
                            razorpay_order_id: paymentData.razorpay_order_id,
                            razorpay_payment_id: paymentData.razorpay_payment_id,
                            razorpay_signature: paymentData.razorpay_signature,
                            order_id: res.data.order.id
                        });

                        if (verifyRes.success) {
                            onOrderSuccess(res.data.order.order_number);
                        } else {
                            Alert.alert('Verification Failed', 'Payment verification failed on server.');
                        }
                    } catch (paymentErr) {
                        console.log('Payment Error:', paymentErr);
                        Alert.alert('Payment Cancelled', 'You cancelled the payment or it failed.');
                        return;
                    }
                } else {
                    onOrderSuccess(res.data.order.order_number);
                }
            } else {
                throw new Error(res.message || 'Failed to place order');
            }

        } catch (err) {
            console.error('Order Error Details:', err.response?.data || err);
            const msg = err.response?.data?.message || err.message || 'Something went wrong';
            Alert.alert('Order Failed', msg);
        } finally {
            setOrderLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <View style={styles.center}>
                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11329/11329060.png' }} style={styles.emptyImage} />
                <Text style={styles.emptyText}>Your cart is empty</Text>
                <Text style={styles.emptySubText}>Add items from restaurants to start ordering</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.exploreBtn}>
                    <Text style={styles.exploreBtnText}>EXPLORE RESTAURANTS</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Checkout</Text>
                    <Text style={styles.headerSubtitle}>{restaurantName}</Text>
                </View>
                <TouchableOpacity onPress={handleClearCart} style={styles.clearBtn}>
                    <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* 1. Items List */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Items</Text>
                </View>
                {items.map((item) => (
                    <View key={item.id} style={styles.itemCard}>
                        <View style={styles.itemInfo}>
                            <View style={[styles.vegIcon, { borderColor: item.is_veg ? COLORS.veg : COLORS.nonVeg }]}>
                                <MaterialIcons name="circle" size={10} color={item.is_veg ? COLORS.veg : COLORS.nonVeg} />
                            </View>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                        </View>
                        <View style={styles.qtyContainer}>
                            <TouchableOpacity
                                onPress={() => item.quantity > 1 ? handleUpdateQuantity(item.id, -1) : handleRemoveItem(item.id)}
                                style={styles.qtyBtn}
                            >
                                <MaterialIcons name="remove" size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{item.quantity}</Text>
                            <TouchableOpacity
                                onPress={() => handleUpdateQuantity(item.id, 1)}
                                style={styles.qtyBtn}
                            >
                                <MaterialIcons name="add" size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                <View style={styles.divider} />

                {/* 2. Address Details */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconCircle}>
                            <MaterialIcons name="home" size={20} color={COLORS.primary} />
                        </View>
                        <Text style={styles.cardTitle}>Deliver To</Text>
                        <TouchableOpacity onPress={() => router.push('/addresses')} style={{ marginLeft: 'auto' }}>
                            <Text style={styles.changeBtnText}>{currentAddress ? 'CHANGE' : 'ADD'}</Text>
                        </TouchableOpacity>
                    </View>
                    {currentAddress ? (
                        <View>
                            <Text style={styles.addressTitle}>{currentAddress.label}</Text>
                            <Text style={styles.addressText}>{currentAddress.full_address}</Text>
                            <Text style={styles.phoneText}>{currentAddress.city}</Text>
                        </View>
                    ) : (
                        <Text style={styles.noAddressText}>Please select a delivery address</Text>
                    )}
                </View>

                {/* 2.5 Contact Details */}
                {!profile?.phone && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.iconCircle}>
                                <MaterialIcons name="phone" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.cardTitle}>Contact Number</Text>
                        </View>
                        <View style={styles.phoneInputContainer}>
                            <Text style={styles.inputLabel}>Enter 10-digit Mobile Number</Text>
                            <View style={styles.phoneInputWrapper}>
                                <Text style={styles.phonePrefix}>+91</Text>
                                <TextInput
                                    style={styles.phoneInput}
                                    placeholder="9876543210"
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    value={phone}
                                    onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
                                />
                            </View>
                            <Text style={styles.phoneHint}>This will be saved to your profile for future orders.</Text>
                        </View>
                    </View>
                )}

                {/* 3. Payment Method */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconCircle}>
                            <MaterialIcons name="payment" size={20} color={COLORS.primary} />
                        </View>
                        <Text style={styles.cardTitle}>Payment Method</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.paymentOption, paymentMethod === 'cod' && styles.selectedPayment]}
                        onPress={() => setPaymentMethod('cod')}
                    >
                        <View style={styles.radioContainer}>
                            <MaterialIcons
                                name={paymentMethod === 'cod' ? "radio-button-checked" : "radio-button-unchecked"}
                                size={22}
                                color={paymentMethod === 'cod' ? COLORS.primary : COLORS.textLight}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.paymentTitle}>Cash on Delivery</Text>
                            <Text style={styles.paymentSubtitle}>Pay cash upon delivery</Text>
                        </View>
                        <MaterialIcons name="money" size={24} color={COLORS.success} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.paymentOption, paymentMethod === 'online' && styles.selectedPayment, { opacity: 0.6 }]}
                        onPress={() => Alert.alert('Notice', 'Online payments are currently unavailable. Please use Cash on Delivery.')}
                    >
                        <View style={styles.radioContainer}>
                            <MaterialIcons
                                name={paymentMethod === 'online' ? "radio-button-checked" : "radio-button-unchecked"}
                                size={22}
                                color={COLORS.textLight}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.paymentTitle}>Pay Online</Text>
                            <Text style={styles.paymentSubtitle}>UPI / Cards (Unavailable)</Text>
                        </View>
                        <MaterialIcons name="qr-code-2" size={24} color={COLORS.textLight} />
                    </TouchableOpacity>
                </View>

                {/* 4. Bill Details */}
                <View style={styles.billCard}>
                    <Text style={styles.sectionTitle}>Bill Details</Text>

                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Item Total</Text>
                        <Text style={styles.billValue}>₹{previewData ? previewData.subtotal : getSubtotal()}</Text>
                    </View>

                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Delivery Fee</Text>
                        <Text style={styles.billValue}>
                            {previewData ? `₹${previewData.delivery_fee}` : (currentAddress ? 'Calculating...' : 'Select Address')}
                        </Text>
                    </View>

                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Taxes & Charges</Text>
                        <Text style={styles.billValue}>
                            {previewData ? `₹${(previewData.taxes + previewData.platform_fee).toFixed(2)}` : 'Calculated at checkout'}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>To Pay</Text>
                        <Text style={styles.totalValue}>
                            ₹{previewData ? previewData.total.toFixed(2) : getSubtotal()}
                        </Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.footerTotal}>
                    <Text style={styles.footerTotalLabel}>TOTAL</Text>
                    <Text style={styles.footerTotalValue}>₹{previewData ? previewData.total.toFixed(2) : getSubtotal()}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.placeOrderBtn, orderLoading && { opacity: 0.7 }]}
                    onPress={handlePlaceOrder}
                    disabled={orderLoading}
                >
                    {orderLoading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <>
                            <Text style={styles.placeOrderText}>PLACE ORDER</Text>
                            <MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyImage: { width: 150, height: 150, marginBottom: 20, opacity: 0.5 },
    emptyText: { fontSize: SIZES.xl, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    emptySubText: { fontSize: SIZES.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 24 },
    exploreBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    exploreBtnText: { color: COLORS.white, fontFamily: FONTS.bold },

    header: { flexDirection: 'row', alignItems: 'center', padding: SIZES.padding, paddingTop: 50, backgroundColor: COLORS.white, ...SHADOWS.sm, zIndex: 10 },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    headerSubtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary },
    clearBtn: { marginLeft: 'auto', padding: 8 },
    clearBtnText: { color: COLORS.error, fontFamily: FONTS.bold },

    scroll: { padding: SIZES.padding },
    sectionHeader: { marginBottom: 10 },
    sectionTitle: { fontSize: SIZES.md, fontFamily: FONTS.bold, color: COLORS.textPrimary },

    itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderRadius: SIZES.radius, marginBottom: 12 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: SIZES.md, fontFamily: FONTS.medium, color: COLORS.textPrimary },
    itemPrice: { fontSize: SIZES.sm, fontFamily: FONTS.bold, color: COLORS.textPrimary, marginTop: 4 },
    vegIcon: { width: 14, height: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },

    qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderRadius: 8, padding: 4 },
    qtyBtn: { padding: 4 },
    qtyText: { fontFamily: FONTS.bold, marginHorizontal: 8, minWidth: 20, textAlign: 'center' },

    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },

    card: { backgroundColor: COLORS.white, padding: 16, borderRadius: SIZES.radius, marginBottom: 16, elevation: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primaryLight + '20', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    cardTitle: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    changeBtnText: { color: COLORS.primary, fontFamily: FONTS.bold, fontSize: 12 },

    addressTitle: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.textPrimary, marginBottom: 2 },
    addressText: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
    phoneText: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.textPrimary },
    noAddressText: { color: COLORS.warning, fontStyle: 'italic' },

    phoneInputContainer: { marginTop: 4 },
    inputLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
    phoneInputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 8 },
    phonePrefix: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.textPrimary, marginRight: 8 },
    phoneInput: { flex: 1, fontSize: 16, fontFamily: FONTS.medium, color: COLORS.textPrimary, padding: 0 },
    phoneHint: { fontSize: 11, color: COLORS.textLight, marginTop: 6, fontStyle: 'italic' },
    phoneValue: { fontSize: 15, fontFamily: FONTS.semiBold, color: COLORS.textPrimary },

    paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
    selectedPayment: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight + '05' },
    radioContainer: { marginRight: 10 },
    paymentTitle: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    paymentSubtitle: { fontSize: 11, color: COLORS.textSecondary },

    billCard: { backgroundColor: COLORS.white, padding: 16, borderRadius: SIZES.radius, marginBottom: 20 },
    billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    billLabel: { color: COLORS.textSecondary, fontFamily: FONTS.medium },
    billValue: { color: COLORS.textPrimary, fontFamily: FONTS.bold },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    totalLabel: { fontSize: SIZES.md, fontFamily: FONTS.bold },
    totalValue: { fontSize: SIZES.md, fontFamily: FONTS.bold, color: COLORS.primary },

    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.white, elevation: 20, borderTopWidth: 1, borderTopColor: '#eee' },
    footerTotal: { flex: 1 },
    footerTotalLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: 'bold' },
    footerTotalValue: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    placeOrderBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 50, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 5 },
    placeOrderText: { color: COLORS.white, fontFamily: FONTS.bold, fontSize: 16 },
});
