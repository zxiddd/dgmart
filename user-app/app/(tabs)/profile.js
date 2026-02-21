import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, StatusBar, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../src/config/theme';
import { useAuthStore } from '../../src/store/authStore';

const MENU_ITEMS = [
    { icon: 'location-on', label: 'Saved Addresses', route: '/addresses', color: COLORS.info },
    { icon: 'account-balance-wallet', label: 'Wallet', route: '/wallet', color: COLORS.warning },
    { icon: 'receipt-long', label: 'Order History', route: '/(tabs)/orders', color: COLORS.primary },
    { icon: 'headset-mic', label: 'Help & Support', route: '/support', color: COLORS.success },
    { icon: 'info', label: 'About', route: '/about', color: COLORS.textSecondary },
];

export default function ProfileScreen() {
    const router = useRouter();
    const { profile, signOut, updateProfile } = useAuthStore();
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editName, setEditName] = useState(profile?.name || '');
    const [editPhone, setEditPhone] = useState(profile?.phone || '');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (profile) {
            setEditName(profile.name || '');
            setEditPhone(profile.phone || '');
        }
    }, [profile]);

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    await signOut();
                    router.replace('/');
                },
            },
        ]);
    };

    const handleUpdateProfile = async () => {
        if (!editName.trim() || !editPhone.trim()) {
            Alert.alert('Error', 'Name and Phone are required');
            return;
        }

        if (editPhone.length !== 10) {
            Alert.alert('Error', 'Phone number must be 10 digits');
            return;
        }

        setUpdating(true);
        try {
            const res = await updateProfile({ name: editName, phone: editPhone });
            if (res.success) {
                Alert.alert('Success', 'Profile updated successfully');
                setEditModalVisible(false);
            } else {
                Alert.alert('Error', res.message || 'Failed to update profile');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            {/* Profile Card - Gold Background */}
            <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <MaterialIcons name="person" size={40} color={COLORS.primary} />
                    </View>
                    <TouchableOpacity style={styles.editAvatarButton}>
                        <MaterialIcons name="camera-alt" size={14} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.userName}>{profile?.name || 'Guest User'}</Text>
                <Text style={styles.userPhone}>{profile?.phone || '+91 XXXXXXXXXX'}</Text>
                {profile?.email && <Text style={styles.userEmail}>{profile.email}</Text>}

                <TouchableOpacity
                    style={styles.editProfileButton}
                    onPress={() => setEditModalVisible(true)}
                >
                    <Text style={styles.editProfileText}>EDIT PROFILE</Text>
                    <MaterialIcons name="edit" size={14} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{profile?.total_orders || 0}</Text>
                        <Text style={styles.statLabel}>Orders</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>₹{profile?.wallet_balance || 0}</Text>
                        <Text style={styles.statLabel}>Wallet</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{profile?.referral_code || 'N/A'}</Text>
                        <Text style={styles.statLabel}>Referral</Text>
                    </View>
                </View>
            </View>

            {/* Menu */}
            <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>YOUR ACCOUNT</Text>
                {MENU_ITEMS.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.menuItem}
                        onPress={() => item.route && router.push(item.route)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                            <MaterialIcons name={item.icon} size={20} color={item.color} />
                        </View>
                        <Text style={styles.menuLabel}>{item.label}</Text>
                        <MaterialIcons name="chevron-right" size={20} color={COLORS.textLight} />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Sign Out */}
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <MaterialIcons name="logout" size={20} color={COLORS.error} />
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.version}>Degloor Mart v1.0.0</Text>
                <Text style={styles.madeWith}>Made with ❤️ for Degloor</Text>
            </View>

            {/* Edit Profile Modal */}
            <Modal
                visible={editModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.editModalContent}>
                        <Text style={styles.modalTitle}>Update Profile</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Enter your name"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <View style={styles.phoneInputWrapper}>
                                <Text style={styles.phonePrefix}>+91</Text>
                                <TextInput
                                    style={styles.phoneInput}
                                    value={editPhone}
                                    onChangeText={(text) => setEditPhone(text.replace(/[^0-9]/g, ''))}
                                    placeholder="10-digit number"
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                />
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>CANCEL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleUpdateProfile}
                                disabled={updating}
                            >
                                {updating ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    profileCard: {
        backgroundColor: COLORS.primary, // Gold
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        ...SHADOWS.gold,
    },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
        ...SHADOWS.md,
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    userName: { fontSize: SIZES.xxl, fontFamily: FONTS.bold, color: COLORS.white, letterSpacing: 0.5, marginBottom: 4 },
    userPhone: { fontSize: SIZES.md, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.9)' },
    userEmail: { fontSize: SIZES.sm, fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    editProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: SIZES.radiusFull,
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    editProfileText: { fontSize: SIZES.xs, fontFamily: FONTS.bold, color: COLORS.white, letterSpacing: 1 },

    statsContainer: {
        paddingHorizontal: SIZES.padding,
        marginTop: -30,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusLg,
        padding: 20,
        ...SHADOWS.md,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    statLabel: { fontSize: SIZES.xs, fontFamily: FONTS.bold, color: COLORS.textSecondary, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    statDivider: { width: 1, backgroundColor: COLORS.borderLight, height: '80%', alignSelf: 'center' },

    menuSection: {
        marginTop: 24,
        paddingHorizontal: SIZES.padding,
    },
    sectionTitle: { fontSize: SIZES.sm, fontFamily: FONTS.bold, color: COLORS.textSecondary, marginBottom: 12, marginLeft: 4, letterSpacing: 1 },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: SIZES.radius,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.sm,
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuLabel: { flex: 1, fontSize: SIZES.md, fontFamily: FONTS.semiBold, color: COLORS.textPrimary },

    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: SIZES.padding,
        marginTop: 12,
        paddingVertical: 14,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        backgroundColor: COLORS.white,
    },
    signOutText: { fontSize: SIZES.md, fontFamily: FONTS.bold, color: COLORS.error },

    footer: { alignItems: 'center', marginTop: 30, paddingBottom: 20 },
    version: { fontSize: SIZES.xs, fontFamily: FONTS.regular, color: COLORS.textLight },
    madeWith: { fontSize: SIZES.xs, fontFamily: FONTS.bold, color: COLORS.textSecondary, marginTop: 4 },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    editModalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 24,
        ...SHADOWS.lg,
    },
    modalTitle: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        marginBottom: 20,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 12,
        fontSize: SIZES.md,
        fontFamily: FONTS.regular,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    phoneInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingLeft: 12,
    },
    phonePrefix: {
        fontSize: SIZES.md,
        fontFamily: FONTS.semiBold,
        color: COLORS.textSecondary,
        marginRight: 8,
    },
    phoneInput: {
        flex: 1,
        padding: 12,
        fontSize: SIZES.md,
        fontFamily: FONTS.regular,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
    },
    cancelButtonText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.bold,
        color: COLORS.textSecondary,
    },
    saveButtonText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.bold,
        color: COLORS.white,
    },
});
