import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../src/config/theme';
import { userAPI, paymentAPI } from '../src/services/api';
import { useAuthStore } from '../src/store/authStore';
import Toast from 'react-native-toast-message';
import RazorpayCheckout from 'react-native-razorpay';

export default function WalletScreen() {
    const router = useRouter();
    const { profile } = useAuthStore();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [showRechargeModal, setShowRechargeModal] = useState(false);
    const [rechargeLoading, setRechargeLoading] = useState(false);

    const fetchWalletData = async () => {
        try {
            const res = await userAPI.getWallet();
            if (res.success) {
                setBalance(res.data.balance);
                setTransactions(res.data.transactions);
            }
        } catch (error) {
            console.error('Fetch wallet error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWalletData();
    }, []);

    const handleRecharge = async () => {
        const amt = parseFloat(rechargeAmount);
        if (isNaN(amt) || amt <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount to add.');
            return;
        }

        setRechargeLoading(true);
        try {
            const res = await paymentAPI.recharge(amt);
            if (res.success) {
                const { razorpay_order_id, razorpay_key_id, amount } = res.data;

                const options = {
                    description: 'Wallet Recharge - Degloor Mart',
                    image: 'https://i.imgur.com/3989v9.png', // Logo
                    currency: 'INR',
                    key: razorpay_key_id,
                    amount: amount,
                    name: 'Degloor Mart',
                    order_id: razorpay_order_id,
                    prefill: {
                        email: profile?.email || '',
                        contact: profile?.phone || '',
                        name: profile?.name || 'User'
                    },
                    theme: { color: COLORS.primary }
                };

                try {
                    const paymentData = await RazorpayCheckout.open(options);
                    setShowRechargeModal(false);
                    setRechargeAmount('');

                    // Show success toast - Webhook will credit the balance
                    Toast.show({
                        type: 'success',
                        text1: 'Payment Successful',
                        text2: 'Wallet will be credited in a few moments.'
                    });

                    // Refresh balance after a short delay
                    setTimeout(fetchWalletData, 3000);

                } catch (paymentErr) {
                    console.log('Payment Error:', paymentErr);
                    Alert.alert('Payment Cancelled', 'You cancelled the top-up or it failed.');
                }
            }
        } catch (error) {
            console.error('Recharge error:', error);
            Alert.alert('Error', error.message || 'Failed to initiate recharge');
        } finally {
            setRechargeLoading(false);
        }
    };

    const getTransactionIcon = (type) => {
        return type === 'credit' ? 'add-circle-outline' : 'remove-circle-outline';
    };

    const getTransactionColor = (type) => {
        return type === 'credit' ? COLORS.success : COLORS.error;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Wallet</Text>
            </View>

            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Current Balance</Text>
                <Text style={styles.balanceValue}>₹{parseFloat(balance).toFixed(2)}</Text>
                <TouchableOpacity
                    style={styles.addMoneyBtn}
                    onPress={() => setShowRechargeModal(true)}
                >
                    <Text style={styles.addMoneyText}>+ Add Money</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionTitle}>Recent Transactions</Text>

                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
                ) : transactions.length > 0 ? (
                    transactions.map((item) => (
                        <View key={item.id} style={styles.transactionItem}>
                            <View style={[styles.iconContainer, { backgroundColor: getTransactionColor(item.type) + '15' }]}>
                                <MaterialIcons
                                    name={getTransactionIcon(item.type)}
                                    size={24}
                                    color={getTransactionColor(item.type)}
                                />
                            </View>
                            <View style={styles.transactionDetails}>
                                <Text style={styles.transactionDesc}>{item.description}</Text>
                                <Text style={styles.transactionDate}>
                                    {new Date(item.created_at).toLocaleDateString(undefined, {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </Text>
                            </View>
                            <Text style={[styles.transactionAmount, { color: getTransactionColor(item.type) }]}>
                                {item.type === 'credit' ? '+' : '-'} ₹{parseFloat(item.amount).toFixed(2)}
                            </Text>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="receipt-long" size={60} color={COLORS.border} />
                        <Text style={styles.emptyText}>No transactions yet</Text>
                    </View>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal
                visible={showRechargeModal}
                transparent
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Money</Text>
                            <TouchableOpacity onPress={() => setShowRechargeModal(false)}>
                                <MaterialIcons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Enter Amount (₹)</Text>
                        <TextInput
                            style={styles.amountInput}
                            placeholder="e.g. 500"
                            keyboardType="numeric"
                            value={rechargeAmount}
                            onChangeText={setRechargeAmount}
                            autoFocus
                        />

                        <TouchableOpacity
                            style={[styles.confirmBtn, rechargeLoading && { opacity: 0.7 }]}
                            onPress={handleRecharge}
                            disabled={rechargeLoading}
                        >
                            {rechargeLoading ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text style={styles.confirmBtnText}>Add to Wallet</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: SIZES.padding, paddingTop: 50, backgroundColor: COLORS.primary },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.white },
    balanceCard: { backgroundColor: COLORS.primary, padding: SIZES.paddingLg, paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center', ...SHADOWS.gold },
    balanceLabel: { fontSize: SIZES.sm, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.8)' },
    balanceValue: { fontSize: 40, fontFamily: FONTS.bold, color: COLORS.white, marginVertical: 8 },
    addMoneyBtn: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 12, borderRadius: SIZES.radiusFull, marginTop: 10, ...SHADOWS.light },
    addMoneyText: { fontSize: SIZES.md, fontFamily: FONTS.bold, color: COLORS.primary },
    content: { padding: SIZES.padding },
    sectionTitle: { fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.textPrimary, marginBottom: 16 },
    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyText: { marginTop: 16, color: COLORS.textSecondary, fontFamily: FONTS.medium },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: SIZES.padding,
        borderRadius: SIZES.radius,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    iconContainer: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    transactionDetails: { flex: 1 },
    transactionDesc: { fontSize: SIZES.md, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    transactionDate: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
    transactionAmount: { fontSize: SIZES.md, fontFamily: FONTS.bold },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: SIZES.paddingLg,
        paddingBottom: 40
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    inputLabel: { fontSize: SIZES.sm, fontFamily: FONTS.medium, color: COLORS.textSecondary, marginBottom: 8 },
    amountInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SIZES.radius,
        padding: SIZES.padding,
        fontSize: 24,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
        marginBottom: 20
    },
    confirmBtn: { backgroundColor: COLORS.primary, padding: SIZES.padding, borderRadius: SIZES.radius, alignItems: 'center' },
    confirmBtnText: { color: COLORS.white, fontSize: SIZES.md, fontFamily: FONTS.bold },
});
