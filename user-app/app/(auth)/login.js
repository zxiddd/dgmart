import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Animated, StatusBar, Modal, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../src/config/theme';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as WebBrowser from 'expo-web-browser';

// Dashboard URLs (Update with production URLs when deploying)
const DASHBOARDS = [
    { id: 'restaurant', name: 'Restaurant Partner', url: process.env.EXPO_PUBLIC_RESTAURANT_URL || 'http://172.20.10.2:3003', icon: 'store', color: '#f97316' },
    { id: 'delivery', name: 'Delivery Partner', url: process.env.EXPO_PUBLIC_DELIVERY_URL || 'http://172.20.10.2:3001', icon: 'delivery-dining', color: '#10b981' },
];

export default function LoginScreen() {
    const router = useRouter();
    const { signIn, signUp } = useAuthStore();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [showPartnerModal, setShowPartnerModal] = useState(false);

    const [loading, setLoading] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const toggleMode = () => {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
        setTimeout(() => setIsLogin(!isLogin), 150);
    };

    const handleAuth = async () => {
        if (!email || !password) {
            Toast.show({ type: 'error', text1: 'Missing fields', text2: 'Please fill in all fields' });
            return;
        }

        if (!isLogin && (!name || !phone)) {
            Toast.show({ type: 'error', text1: 'Missing fields', text2: 'Name and Phone are required for signup' });
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                await signIn(email, password);
                Toast.show({ type: 'success', text1: 'Welcome back!', text2: 'Logged in successfully' });
            } else {
                await signUp(email, password, { name, phone, role: 'customer' });
                Toast.show({ type: 'success', text1: 'Account created!', text2: 'Welcome to Degloor Mart' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Auth Error', text2: error.message });
        } finally {
            setLoading(false);
        }
    };

    const openDashboard = async (url) => {
        try {
            await WebBrowser.openBrowserAsync(url);
            setShowPartnerModal(false);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to open dashboard' });
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <Image
                            source={require('../../assets/logo.jpg')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.appName}>DEGLOOR MART</Text>
                    <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Get Started'}</Text>
                    <Text style={styles.subtitle}>{isLogin ? 'Sign in to continue' : 'Create an account to order food'}</Text>
                </View>

                <View style={styles.form}>
                    {!isLogin && (
                        <>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>FULL NAME</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialIcons name="person" size={20} color={COLORS.primary} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="John Doe"
                                        placeholderTextColor={COLORS.textLight}
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>PHONE NUMBER</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialIcons name="phone" size={20} color={COLORS.primary} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="+91 98765 43210"
                                        placeholderTextColor={COLORS.textLight}
                                        value={phone}
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>
                        </>
                    )}

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>EMAIL ADDRESS</Text>
                        <View style={styles.inputWrapper}>
                            <MaterialIcons name="email" size={20} color={COLORS.primary} />
                            <TextInput
                                style={styles.input}
                                placeholder="name@example.com"
                                placeholderTextColor={COLORS.textLight}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>PASSWORD</Text>
                        <View style={styles.inputWrapper}>
                            <MaterialIcons name="lock" size={20} color={COLORS.primary} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={COLORS.textLight}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    {isLogin && (
                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleAuth}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>{loading ? 'Please wait...' : (isLogin ? 'SIGN IN' : 'CREATE ACCOUNT')}</Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                        </Text>
                        <TouchableOpacity onPress={toggleMode}>
                            <Text style={styles.signupText}> {isLogin ? 'Sign Up' : 'Sign In'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Partner Access Button */}
                    <TouchableOpacity
                        style={styles.partnerButton}
                        onPress={() => setShowPartnerModal(true)}
                    >
                        <MaterialIcons name="business-center" size={16} color={COLORS.primary} />
                        <Text style={styles.partnerButtonText}>Partner Access</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Partner Access Modal */}
            <Modal
                visible={showPartnerModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowPartnerModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Partner Dashboard Access</Text>
                            <TouchableOpacity onPress={() => setShowPartnerModal(false)}>
                                <MaterialIcons name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>Select a dashboard to open:</Text>

                        <View style={styles.dashboardList}>
                            {DASHBOARDS.map(dash => (
                                <TouchableOpacity
                                    key={dash.id}
                                    style={styles.dashboardItem}
                                    onPress={() => openDashboard(dash.url)}
                                >
                                    <View style={[styles.dashboardIcon, { backgroundColor: dash.color + '20' }]}>
                                        <MaterialIcons name={dash.icon} size={24} color={dash.color} />
                                    </View>
                                    <View>
                                        <Text style={styles.dashboardName}>{dash.name}</Text>
                                        <Text style={styles.dashboardUrl}>{dash.url}</Text>
                                    </View>
                                    <MaterialIcons name="open-in-new" size={20} color={COLORS.textLight} style={{ marginLeft: 'auto' }} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
    },
    content: {
        padding: SIZES.paddingLg,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        ...SHADOWS.gold,
        borderWidth: 1,
        borderColor: COLORS.primaryLight,
        overflow: 'hidden',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    appName: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
        letterSpacing: 4,
        marginBottom: 8,
    },
    title: {
        fontSize: SIZES.xxl,
        fontFamily: FONTS.black,
        color: COLORS.textPrimary, // Dark text
        marginBottom: 8,
    },
    subtitle: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    form: {
        gap: 20,
    },
    inputContainer: {
        gap: 8,
    },
    label: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.bold,
        color: COLORS.textSecondary,
        letterSpacing: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: COLORS.border,
        height: 50,
        paddingHorizontal: 14,
        ...SHADOWS.sm,
    },
    input: {
        flex: 1,
        fontFamily: FONTS.medium,
        fontSize: SIZES.base,
        color: COLORS.textPrimary,
        marginLeft: 10,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
    },
    forgotPasswordText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.primary,
    },
    button: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: SIZES.radius,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        ...SHADOWS.gold,
    },
    buttonDisabled: {
        backgroundColor: COLORS.primaryLight,
        opacity: 0.7,
    },
    buttonText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.bold,
        color: COLORS.white,
        letterSpacing: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        gap: 4,
    },
    footerText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    signupText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
    },
    partnerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 20,
        padding: 10,
    },
    partnerButtonText: {
        color: COLORS.primary,
        fontFamily: FONTS.bold,
        fontSize: SIZES.sm,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: SIZES.xl,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
    },
    modalSubtitle: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginBottom: 24,
    },
    dashboardList: {
        gap: 16,
    },
    dashboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 16,
    },
    dashboardIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dashboardName: {
        fontSize: SIZES.md,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
    },
    dashboardUrl: {
        fontSize: SIZES.xs,
        color: COLORS.textLight,
    },
});
