import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, StyleSheet, LayoutAnimation, Platform, UIManager, TextInput, Modal, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SHADOWS } from '../src/config/theme';
import { useCartStore } from '../src/store/cartStore';
import { useAuthStore } from '../src/store/authStore';
import { orderAPI, paymentAPI } from '../src/services/api';
import Toast from 'react-native-toast-message';
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

    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [previewData, setPreviewData] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [orderStatus, setOrderStatus] = useState('idle'); // 'idle' | 'processing' | 'success'

    // Verification Modal State
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationStep, setVerificationStep] = useState('phone'); // 'phone' | 'otp'
    const [verificationOtp, setVerificationOtp] = useState('');
    const [verificationLoading, setVerificationLoading] = useState(false);

    // Resolve phone from any available source
    const resolvedPhone = profile?.phone || currentAddress?.phone || user?.user_metadata?.phone || '';
    const [phone, setPhone] = useState(resolvedPhone);
    const showPhoneInput = !resolvedPhone;

    useEffect(() => {
        const p = profile?.phone || currentAddress?.phone || user?.user_metadata?.phone || '';
        if (p) setPhone(p);
    }, [profile, currentAddress, user]);

    useEffect(() => {
        if (items.length > 0 && currentAddress) {
            fetchPreview();
        } else {
            setPreviewData(null);
        }
    }, [items, currentAddress]);

    const fetchPreview = async () => {
        try {
            setPreviewLoading(true);
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
            setPreviewLoading(false);
        }
    };

    const handleUpdateQuantity = (itemId, change) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        updateQuantity(itemId, change);
    };

    const handleRemoveItem = (itemId) => {
        Alert.alert('Remove Item', 'Remove this item from your cart?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive', onPress: () => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    removeItem(itemId);
                }
            }
        ]);
    };

    const onOrderSuccess = async (orderNumber) => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: 'https://www.soundjay.com/misc/sounds/magic-chime-01.mp3' }
            );
            await sound.playAsync();
        } catch (_) { }

        setOrderStatus('success');
        setTimeout(() => {
            clearCart();
            Toast.show({
                type: 'success',
                text1: 'Order Placed! ✅',
                text2: `Order #${orderNumber} is being prepared`,
                visibilityTime: 4000
            });
            setOrderStatus('idle');
            router.replace('/(tabs)/orders');
        }, 2500);
    };

    const handleSendVerificationOtp = async () => {
        const orderPhone = currentAddress?.phone || profile?.phone || user?.user_metadata?.phone || phone;
        if (!orderPhone || orderPhone.length < 10) {
            Toast.show({ type: 'error', text1: 'Invalid Phone Number' });
            return;
        }

        setVerificationLoading(true);
        try {
            // Assume it's an Indian number for now in the UI logic, prepending +91 if needed or just letting backend handle
            const res = await orderAPI.preview({}).catch(() => { }); // Dummy to keep imports same, wait actually we need fetch
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://YOUR_LOCAL_IP:3000/api';
            const reqRes = await fetch(`${API_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: `+91${orderPhone.replace(/\D/g, '')}` })
            });

            const data = await reqRes.json();
            if (!reqRes.ok || !data.success) throw new Error(data.message || 'Failed to send OTP');

            Toast.show({ type: 'success', text1: 'OTP Sent' });
            setVerificationStep('otp');
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to send OTP', text2: error.message });
        } finally {
            setVerificationLoading(false);
        }
    };

    const handleVerifyPhoneOtp = async () => {
        if (!verificationOtp || verificationOtp.length < 6) {
            Toast.show({ type: 'error', text1: 'Enter valid OTP' });
            return;
        }

        const orderPhone = currentAddress?.phone || profile?.phone || user?.user_metadata?.phone || phone;
        setVerificationLoading(true);
        try {
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://YOUR_LOCAL_IP:3000/api';
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const reqRes = await fetch(`${API_URL}/auth/verify-existing-phone`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ phone: `+91${orderPhone.replace(/\D/g, '')}`, otp: verificationOtp })
            });

            const data = await reqRes.json();
            if (!reqRes.ok || !data.success) throw new Error(data.message || 'Invalid OTP');

            Toast.show({ type: 'success', text1: 'Phone Verified successfully' });
            setShowVerificationModal(false);
            setVerificationOtp('');

            // Retry placing order automatically
            handlePlaceOrder();

        } catch (error) {
            Toast.show({ type: 'error', text1: 'Verification Failed', text2: error.message });
        } finally {
            setVerificationLoading(false);
        }
    };

    const handlePlaceOrder = () => {
        if (!currentAddress) {
            Alert.alert('No Address', 'Please add a delivery address first.', [
                { text: 'Add Address', onPress: () => router.push('/addresses?mode=form') },
                { text: 'Cancel', style: 'cancel' }
            ]);
            return;
        }
        if (items.length === 0) return;

        const orderPhone = currentAddress?.phone || profile?.phone || user?.user_metadata?.phone || phone;
        if (!orderPhone || orderPhone.length < 10) {
            Alert.alert('Phone Required', 'Enter a valid 10-digit phone number to place your order.');
            return;
        }

        setOrderStatus('processing');

        setTimeout(async () => {
            try {
                const orderData = {
                    restaurant_id: restaurantId,
                    address_id: currentAddress.id,
                    payment_method: paymentMethod,
                    phone: orderPhone,
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
                    if (paymentMethod === 'online' && res.data.order.razorpay_order_id) {
                        try {
                            setOrderStatus('idle'); // Hide modal to let Razorpay UI show
                            const options = {
                                description: 'Ordering from Degloor Mart',
                                currency: 'INR',
                                key: res.data.razorpay_key_id,
                                amount: Math.round(res.data.order.total * 100),
                                name: 'Degloor Mart',
                                order_id: res.data.order.razorpay_order_id,
                                prefill: {
                                    email: user?.email || '',
                                    contact: orderPhone,
                                    name: profile?.name || user?.user_metadata?.name || 'User'
                                },
                                theme: { color: COLORS.primary }
                            };
                            const paymentData = await RazorpayCheckout.open(options);

                            setOrderStatus('processing'); // Show processing again
                            const verifyRes = await paymentAPI.verify({
                                razorpay_order_id: paymentData.razorpay_order_id,
                                razorpay_payment_id: paymentData.razorpay_payment_id,
                                razorpay_signature: paymentData.razorpay_signature,
                                order_id: res.data.order.id
                            });
                            if (verifyRes.success) {
                                onOrderSuccess(res.data.order.order_number);
                            } else {
                                setOrderStatus('idle');
                                Alert.alert('Verification Failed', 'Payment verification failed. Contact support.');
                            }
                        } catch (paymentErr) {
                            setOrderStatus('idle');
                            Alert.alert('Payment Cancelled', 'You cancelled the payment or it failed.');
                            return;
                        }
                    } else {
                        onOrderSuccess(res.data.order.order_number);
                    }
                } else {
                    setOrderStatus('idle');
                    throw new Error(res.message || 'Failed to place order');
                }
            } catch (err) {
                setOrderStatus('idle');
                if (err.data?.requiresPhoneVerification) {
                    setShowVerificationModal(true);
                    setVerificationStep('phone');
                    return;
                }
                const msg = err.response?.data?.message || err.message || 'Something went wrong';
                Alert.alert('Order Failed', msg);
            }
        }, 50);
    };

    // ─── Empty State ───────────────────────────────────────────────────────────
    if (items.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Image
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11329/11329060.png' }}
                    style={styles.emptyImage}
                />
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.emptySubtitle}>Add items from a restaurant to get started</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.browseBtn}>
                    <Text style={styles.browseBtnText}>Browse Restaurants</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const total = previewData ? previewData.total.toFixed(2) : getSubtotal();

    // ─── Main Cart ─────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            {/* Phone Verification Modal */}
            <Modal visible={showVerificationModal} transparent animationType="slide">
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowVerificationModal(false)}>
                                <MaterialIcons name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>

                            <View style={styles.modalHeader}>
                                <Ionicons name="phone-portrait-outline" size={40} color={COLORS.primary} style={{ marginBottom: 12 }} />
                                <Text style={styles.modalTitle}>Verify Phone Number</Text>
                                <Text style={styles.modalSubtitle}>
                                    {verificationStep === 'phone'
                                        ? `Please verify your phone number (${phone}) to place this order.`
                                        : `Enter the OTP sent to ${phone}`}
                                </Text>
                            </View>

                            {verificationStep === 'otp' && (
                                <View style={styles.modalInputWrapper}>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="Enter 6-digit OTP"
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        value={verificationOtp}
                                        onChangeText={setVerificationOtp}
                                        editable={!verificationLoading}
                                    />
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.modalBtn, verificationLoading && { opacity: 0.7 }]}
                                onPress={verificationStep === 'phone' ? handleSendVerificationOtp : handleVerifyPhoneOtp}
                                disabled={verificationLoading}
                            >
                                {verificationLoading ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <Text style={styles.modalBtnText}>
                                        {verificationStep === 'phone' ? 'Send OTP' : 'Verify & Place Order'}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {verificationStep === 'otp' && (
                                <TouchableOpacity style={{ alignItems: 'center', marginTop: 15 }} onPress={() => setVerificationStep('phone')} disabled={verificationLoading}>
                                    <Text style={{ color: COLORS.textSecondary, fontFamily: FONTS.medium, fontSize: SIZES.sm }}>Resend OTP / Change Number</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Checkout</Text>
                    <Text style={styles.headerSub} numberOfLines={1}>{restaurantName}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Clear', style: 'destructive', onPress: clearCart }
                    ])}
                    style={styles.clearBtn}
                >
                    <MaterialIcons name="delete-outline" size={22} color={COLORS.error} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* ── Items ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Your Items</Text>
                    <View style={styles.card}>
                        {items.map((item, idx) => (
                            <View key={item.id}>
                                <View style={styles.itemRow}>
                                    <View style={[styles.vegDot, { borderColor: item.is_veg ? COLORS.veg : COLORS.nonVeg }]}>
                                        <View style={[styles.vegDotInner, { backgroundColor: item.is_veg ? COLORS.veg : COLORS.nonVeg }]} />
                                    </View>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.itemUnitPrice}>₹{item.price} each</Text>
                                    </View>
                                    <View style={styles.qtyRow}>
                                        <TouchableOpacity
                                            onPress={() => item.quantity > 1 ? handleUpdateQuantity(item.id, -1) : handleRemoveItem(item.id)}
                                            style={styles.qtyBtn}
                                        >
                                            <MaterialIcons name={item.quantity === 1 ? 'delete-outline' : 'remove'} size={16} color={COLORS.primary} />
                                        </TouchableOpacity>
                                        <Text style={styles.qtyNum}>{item.quantity}</Text>
                                        <TouchableOpacity onPress={() => handleUpdateQuantity(item.id, 1)} style={styles.qtyBtn}>
                                            <MaterialIcons name="add" size={16} color={COLORS.primary} />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.itemTotal}>₹{item.price * item.quantity}</Text>
                                </View>
                                {idx < items.length - 1 && <View style={styles.itemDivider} />}
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── Delivery Address ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Deliver To</Text>
                    <View style={styles.card}>
                        {currentAddress ? (
                            <View style={styles.addressContent}>
                                <View style={styles.addressIconCol}>
                                    <View style={styles.addressIconCircle}>
                                        <MaterialIcons
                                            name={currentAddress.label?.toLowerCase() === 'work' ? 'work' : 'home'}
                                            size={18}
                                            color={COLORS.primary}
                                        />
                                    </View>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.addressTopRow}>
                                        <Text style={styles.addressLabel}>
                                            {currentAddress.label
                                                ? currentAddress.label.charAt(0).toUpperCase() + currentAddress.label.slice(1)
                                                : 'Address'}
                                        </Text>
                                        {currentAddress.is_default && (
                                            <View style={styles.defaultChip}>
                                                <Text style={styles.defaultChipText}>DEFAULT</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.addressFull}>{currentAddress.full_address}</Text>
                                    {currentAddress.phone ? (
                                        <View style={styles.addressPhoneRow}>
                                            <MaterialIcons name="phone" size={12} color={COLORS.textSecondary} />
                                            <Text style={styles.addressPhone}>{currentAddress.phone}</Text>
                                        </View>
                                    ) : null}
                                </View>
                                <TouchableOpacity onPress={() => router.push('/addresses')} style={styles.changeBtn}>
                                    <Text style={styles.changeBtnText}>CHANGE</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => router.push('/addresses?mode=form')} style={styles.addAddressRow}>
                                <View style={styles.addAddressIcon}>
                                    <MaterialIcons name="add-location-alt" size={20} color={COLORS.primary} />
                                </View>
                                <Text style={styles.addAddressText}>Add a delivery address</Text>
                                <MaterialIcons name="chevron-right" size={20} color={COLORS.textLight} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* ── Phone (only if no phone anywhere) ── */}
                {showPhoneInput && (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Contact Number</Text>
                        <View style={[styles.card, styles.phoneCard]}>
                            <MaterialIcons name="phone" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
                            <Text style={styles.phonePrefix}>+91</Text>
                            <TextInput
                                style={styles.phoneInput}
                                placeholder="10-digit mobile number"
                                placeholderTextColor={COLORS.textLight}
                                keyboardType="phone-pad"
                                maxLength={10}
                                value={phone}
                                onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ''))}
                            />
                        </View>
                        <Text style={styles.phoneHint}>Used by the delivery partner to reach you</Text>
                    </View>
                )}

                {/* ── Payment Method ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Payment</Text>
                    <View style={styles.card}>
                        <TouchableOpacity
                            style={[styles.payRow, paymentMethod === 'cod' && styles.payRowActive]}
                            onPress={() => setPaymentMethod('cod')}
                        >
                            <View style={[styles.radioOuter, paymentMethod === 'cod' && styles.radioOuterActive]}>
                                {paymentMethod === 'cod' && <View style={styles.radioInner} />}
                            </View>
                            <View style={styles.payIcon}>
                                <MaterialIcons name="money" size={20} color={COLORS.success} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.payTitle}>Cash on Delivery</Text>
                                <Text style={styles.paySubtitle}>Pay cash when your order arrives</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.itemDivider} />

                        <TouchableOpacity
                            style={[styles.payRow, { opacity: 0.45 }]}
                            onPress={() => Alert.alert('Unavailable', 'Online payments are coming soon. Use Cash on Delivery.')}
                        >
                            <View style={styles.radioOuter}>
                                <View style={{ width: 10, height: 10 }} />
                            </View>
                            <View style={styles.payIcon}>
                                <MaterialIcons name="qr-code-2" size={20} color={COLORS.textLight} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.payTitle}>Pay Online</Text>
                                <Text style={styles.paySubtitle}>UPI / Cards — Coming Soon</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Bill Details ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Bill Summary</Text>
                    <View style={styles.card}>
                        <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Item Total</Text>
                            <Text style={styles.billValue}>₹{previewData ? previewData.subtotal : getSubtotal()}</Text>
                        </View>
                        <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Delivery Fee</Text>
                            {previewLoading ? (
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            ) : (
                                <Text style={styles.billValue}>
                                    {previewData
                                        ? (previewData.delivery_fee === 0 ? 'FREE' : `₹${previewData.delivery_fee}`)
                                        : (currentAddress ? '—' : 'Add address')}
                                </Text>
                            )}
                        </View>
                        <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Taxes & Charges</Text>
                            {previewLoading ? (
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            ) : (
                                <Text style={styles.billValue}>
                                    {previewData ? `₹${(previewData.taxes + previewData.platform_fee).toFixed(2)}` : '—'}
                                </Text>
                            )}
                        </View>
                        <View style={styles.billDivider} />
                        <View style={styles.billRow}>
                            <Text style={styles.billTotalLabel}>To Pay</Text>
                            <Text style={styles.billTotalValue}>₹{total}</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 110 }} />
            </ScrollView>

            {/* ── Place Order Footer ── */}
            <View style={styles.footer}>
                <View style={styles.footerLeft}>
                    <Text style={styles.footerTotalLabel}>TOTAL</Text>
                    <Text style={styles.footerTotalValue}>₹{total}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.placeBtn, (!currentAddress || orderStatus !== 'idle') && styles.placeBtnDisabled]}
                    onPress={handlePlaceOrder}
                    disabled={orderStatus !== 'idle' || !currentAddress}
                    activeOpacity={0.85}
                >
                    {orderStatus !== 'idle' ? (
                        <View style={styles.placeBtnContent}>
                            <ActivityIndicator color={COLORS.white} size="small" />
                            <Text style={styles.placeBtnText}>Placing Order...</Text>
                        </View>
                    ) : (
                        <View style={styles.placeBtnContent}>
                            <Text style={styles.placeBtnText}>Place Order</Text>
                            <MaterialIcons name="arrow-forward" size={18} color={COLORS.white} />
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Unified Checkout Modal (Processing -> Success) */}
            <Modal visible={orderStatus !== 'idle'} transparent animationType="fade">
                <View style={styles.successModalContainer}>
                    <View style={styles.successModalBox}>
                        {orderStatus === 'processing' ? (
                            <>
                                <LinearGradient colors={[COLORS.primaryLight, COLORS.primary]} style={[styles.successIconBg, { shadowColor: 'transparent', elevation: 0 }]}>
                                    <ActivityIndicator size="large" color={COLORS.white} />
                                </LinearGradient>
                                <Text style={styles.successModalTitle}>Placing your order...</Text>
                                <Text style={styles.successModalSub}>Confirming details with {restaurantName || 'the restaurant'} 👨‍🍳</Text>
                            </>
                        ) : (
                            <>
                                <LinearGradient colors={[COLORS.primary, '#E67E22']} style={styles.successIconBg}>
                                    <Ionicons name="checkmark-done" size={48} color={COLORS.white} />
                                </LinearGradient>
                                <Text style={styles.successModalTitle}>Order Confirmed!</Text>
                                <Text style={styles.successModalSub}>Your delicious food is being prepared 👩‍🍳</Text>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },

    // Empty
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#F5F6FA' },
    emptyImage: { width: 140, height: 140, opacity: 0.6, marginBottom: 20 },
    emptyTitle: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.textPrimary, marginBottom: 6 },
    emptySubtitle: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
        fontFamily: FONTS.regular,
        textAlign: 'center',
        marginBottom: 24,
    },
    browseBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: SIZES.radius,
    },
    browseBtnText: {
        color: COLORS.white,
        fontSize: SIZES.base,
        fontFamily: FONTS.bold,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: SIZES.radiusLg,
        borderTopRightRadius: SIZES.radiusLg,
        padding: SIZES.paddingLg,
        minHeight: 350,
    },
    modalCloseBtn: {
        alignSelf: 'flex-end',
        padding: 5,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    modalInputWrapper: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SIZES.radius,
        height: 50,
        marginBottom: 20,
        paddingHorizontal: 15,
        justifyContent: 'center',
    },
    modalInput: {
        fontFamily: FONTS.medium,
        fontSize: SIZES.base,
        color: COLORS.textPrimary,
        height: '100%',
    },
    modalBtn: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: SIZES.radius,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.gold,
    },
    modalBtnText: {
        color: COLORS.white,
        fontFamily: FONTS.bold,
        fontSize: SIZES.base,
    },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14, backgroundColor: COLORS.white, ...SHADOWS.sm },
    backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    headerTitle: { fontSize: 17, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    headerSub: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 1 },
    clearBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center' },

    // Scroll & sections
    scroll: { paddingHorizontal: 16, paddingTop: 16 },
    section: { marginBottom: 16 },
    sectionLabel: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.textSecondary, letterSpacing: 0.8, marginBottom: 8, marginLeft: 2 },
    card: { backgroundColor: COLORS.white, borderRadius: 14, overflow: 'hidden', ...SHADOWS.sm },

    // Items
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
    vegDot: { width: 14, height: 14, borderRadius: 3, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    vegDotInner: { width: 7, height: 7, borderRadius: 1.5 },
    itemInfo: { flex: 1, marginRight: 10 },
    itemName: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textPrimary },
    itemUnitPrice: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 2 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF4ED', borderRadius: 8, marginRight: 10 },
    qtyBtn: { padding: 7 },
    qtyNum: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.primary, minWidth: 20, textAlign: 'center' },
    itemTotal: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.textPrimary, minWidth: 44, textAlign: 'right' },
    itemDivider: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 16 },

    // Address
    addressContent: { flexDirection: 'row', alignItems: 'flex-start', padding: 16 },
    addressIconCol: { marginRight: 12, paddingTop: 2 },
    addressIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight + '20', justifyContent: 'center', alignItems: 'center' },
    addressTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    addressLabel: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    defaultChip: { backgroundColor: COLORS.primaryLight + '30', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
    defaultChipText: { fontSize: 9, fontFamily: FONTS.bold, color: COLORS.primaryDark, letterSpacing: 0.5 },
    addressFull: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary, lineHeight: 19 },
    addressPhoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    addressPhone: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textSecondary },
    changeBtn: { paddingLeft: 10, paddingTop: 2 },
    changeBtnText: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.primary },
    addAddressRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    addAddressIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    addAddressText: { flex: 1, fontSize: 14, fontFamily: FONTS.medium, color: COLORS.primary },

    // Phone
    phoneCard: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    phonePrefix: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.textPrimary, marginRight: 8 },
    phoneInput: { flex: 1, fontSize: 16, fontFamily: FONTS.medium, color: COLORS.textPrimary, padding: 0 },
    phoneHint: { fontSize: 11, color: COLORS.textSecondary, marginTop: 6, marginLeft: 4 },

    // Payment
    payRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    payRowActive: { backgroundColor: COLORS.primaryLight + '08' },
    radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    radioOuterActive: { borderColor: COLORS.primary },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
    payIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    payTitle: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    paySubtitle: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 1 },

    // Bill
    billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
    billLabel: { fontSize: 14, fontFamily: FONTS.regular, color: COLORS.textSecondary },
    billValue: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textPrimary },
    billDivider: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 16, marginVertical: 4 },
    billTotalLabel: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    billTotalValue: { fontSize: 17, fontFamily: FONTS.bold, color: COLORS.primary },

    // Footer
    footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 24, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#EBEBEB', ...SHADOWS.lg },
    footerLeft: { flex: 1 },
    footerTotalLabel: { fontSize: 10, fontFamily: FONTS.bold, color: COLORS.textSecondary, letterSpacing: 0.8 },
    footerTotalValue: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    placeBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 50, minWidth: 150, ...SHADOWS.orange },
    placeBtnDisabled: { backgroundColor: COLORS.textLight, elevation: 0, shadowOpacity: 0 },
    placeBtnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    placeBtnText: { color: COLORS.white, fontFamily: FONTS.bold, fontSize: 15 },

    // Loading overlay
    loadingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
    loadingBox: { backgroundColor: COLORS.white, borderRadius: 20, padding: 32, alignItems: 'center', width: 240, ...SHADOWS.lg },
    loadingTitle: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.textPrimary, marginTop: 16, marginBottom: 6 },
    loadingSubtitle: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary, textAlign: 'center' },

    // Success Celebration Modal
    successModalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    successModalBox: { width: Dimensions.get('window').width * 0.85, backgroundColor: COLORS.white, borderRadius: 24, padding: 36, alignItems: 'center', ...SHADOWS.lg },
    successIconBg: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 24, ...SHADOWS.orange },
    successModalTitle: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.textPrimary, marginBottom: 8, textAlign: 'center' },
    successModalSub: { fontSize: 15, fontFamily: FONTS.medium, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
});
