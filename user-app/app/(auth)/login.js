import { useState, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
    Animated, Alert, ScrollView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS } from '../../src/config/theme';
import Toast from 'react-native-toast-message';
import auth from '@react-native-firebase/auth';
import { useAuthStore } from '../../src/store/authStore';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.2:5000';
const STEPS = { PHONE: 'phone', OTP: 'otp', NAME: 'name' };

export default function LoginScreen() {
    const router = useRouter();
    const { loginWithFirebase, updateProfile } = useAuthStore();

    const [step, setStep] = useState(STEPS.PHONE);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    // Firebase confirmation result (from signInWithPhoneNumber)
    const confirmRef = useRef(null);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const animateTo = (fn) => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
            fn();
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        });
    };

    // ── Step 1: Send OTP via Firebase ────────────────────────────────────────
    const handleSendOtp = async () => {
        const clean = phone.replace(/\D/g, '').replace(/^0/, '').replace(/^91/, '');
        if (clean.length !== 10) {
            Toast.show({ type: 'error', text1: 'Invalid Number', text2: 'Enter a valid 10-digit mobile number.' });
            return;
        }

        setLoading(true);
        try {
            // Firebase SMS OTP — handles all SMS delivery automatically
            const confirmation = await auth().signInWithPhoneNumber(`+91${clean}`);
            confirmRef.current = confirmation;
            animateTo(() => setStep(STEPS.OTP));
            Toast.show({ type: 'success', text1: 'OTP Sent!', text2: `Code sent to +91 ${clean}` });
        } catch (err) {
            console.error('Firebase signInWithPhoneNumber error:', err);
            Toast.show({
                type: 'error',
                text1: 'Failed to send OTP',
                text2: err.message?.replace(/\[.*?\]/g, '').trim() || 'Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Verify OTP & get Firebase ID token → Supabase session ────────
    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            Toast.show({ type: 'error', text1: 'Invalid OTP', text2: 'Enter the 6-digit code.' });
            return;
        }
        if (!confirmRef.current) {
            Toast.show({ type: 'error', text1: 'Session expired', text2: 'Please resend OTP.' });
            animateTo(() => setStep(STEPS.PHONE));
            return;
        }

        setLoading(true);
        try {
            // Confirm OTP on Firebase
            const userCredential = await confirmRef.current.confirm(otp);
            const idToken = await userCredential.user.getIdToken();

            // Exchange Firebase ID token for a Supabase session via our backend
            const res = await fetch(`${API_BASE}/api/auth/firebase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firebase_token: idToken }),
            });
            const data = await res.json();

            if (!data.success) throw new Error(data.message || 'Authentication failed');

            // Set Supabase session in authStore
            await loginWithFirebase(data.data.access_token, data.data.refresh_token);

            if (data.data.is_new_user) {
                // New user — collect name then redirect to mandatory address
                animateTo(() => setStep(STEPS.NAME));
            } else {
                Toast.show({ type: 'success', text1: '🎉 Welcome back!' });
                router.replace('/(tabs)/home');
            }
        } catch (err) {
            console.error('OTP verify error:', err);
            Toast.show({
                type: 'error',
                text1: 'Wrong OTP',
                text2: err.message?.replace(/\[.*?\]/g, '').trim() || 'Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    // ── Step 3: Save name → mandatory address ────────────────────────────────
    const handleSaveName = async () => {
        const trimmed = name.trim();
        if (trimmed.length < 2) {
            Toast.show({ type: 'error', text1: 'Name Required', text2: 'Enter your full name.' });
            return;
        }
        try {
            await updateProfile({ name: trimmed });
        } catch (_) { }
        router.replace('/addresses?onboarding=true');
    };

    // ─────────────────────────────────────────────────────────────────────────
    const renderPhone = () => (
        <>
            <Text style={styles.stepTitle}>Enter your mobile number</Text>
            <Text style={styles.stepSub}>We'll send you a verification code via SMS</Text>
            <View style={styles.phoneRow}>
                <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                </View>
                <TextInput
                    style={styles.phoneInput}
                    placeholder="10-digit number"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
                    autoFocus
                />
            </View>
            <TouchableOpacity
                style={[styles.primaryBtn, (loading || phone.length !== 10) && styles.primaryBtnDisabled]}
                onPress={handleSendOtp}
                disabled={loading || phone.length !== 10}
            >
                {loading
                    ? <ActivityIndicator color={COLORS.white} />
                    : <Text style={styles.primaryBtnText}>SEND OTP</Text>}
            </TouchableOpacity>
        </>
    );

    const renderOtp = () => (
        <>
            <Text style={styles.stepTitle}>Enter verification code</Text>
            <Text style={styles.stepSub}>Sent to +91 {phone.replace(/\D/g, '').replace(/^0/, '').replace(/^91/, '')}</Text>
            <TextInput
                style={styles.otpInput}
                placeholder="• • • • • •"
                placeholderTextColor={COLORS.textLight}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                textAlign="center"
                autoFocus
            />
            <TouchableOpacity
                style={[styles.primaryBtn, (loading || otp.length !== 6) && styles.primaryBtnDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
            >
                {loading
                    ? <ActivityIndicator color={COLORS.white} />
                    : <Text style={styles.primaryBtnText}>VERIFY & LOGIN</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={() => animateTo(() => setStep(STEPS.PHONE))}>
                <Text style={styles.linkBtnText}>← Change number</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={handleSendOtp} disabled={loading}>
                <Text style={[styles.linkBtnText, { textDecorationLine: 'underline' }]}>Resend OTP</Text>
            </TouchableOpacity>
        </>
    );

    const renderName = () => (
        <>
            <Text style={styles.stepTitle}>What's your name? 👋</Text>
            <Text style={styles.stepSub}>This shows on your orders</Text>
            <TextInput
                style={styles.nameInput}
                placeholder="Your full name"
                placeholderTextColor={COLORS.textLight}
                value={name}
                onChangeText={setName}
                autoFocus
            />
            <TouchableOpacity
                style={[styles.primaryBtn, name.trim().length < 2 && styles.primaryBtnDisabled]}
                onPress={handleSaveName}
                disabled={name.trim().length < 2}
            >
                <Text style={styles.primaryBtnText}>CONTINUE →</Text>
            </TouchableOpacity>
        </>
    );

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Logo */}
                <View style={styles.logoSection}>
                    <View style={styles.logoCircle}>
                        <Image source={require('../../assets/logo.jpg')} style={styles.logoImage} resizeMode="contain" />
                    </View>
                    <Text style={styles.appName}>DEGLOOR MART</Text>
                    <Text style={styles.appTagline}>Fresh food, delivered fast 🍔</Text>
                </View>

                {/* Step card */}
                <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                    {step === STEPS.PHONE && renderPhone()}
                    {step === STEPS.OTP && renderOtp()}
                    {step === STEPS.NAME && renderName()}
                </Animated.View>

                {/* Step dots */}
                <View style={styles.dotRow}>
                    {[STEPS.PHONE, STEPS.OTP, STEPS.NAME].map((s) => (
                        <View key={s} style={[styles.dot, step === s && styles.dotActive]} />
                    ))}
                </View>

                <Text style={styles.terms}>
                    By continuing, you agree to our{' '}
                    <Text style={{ color: COLORS.primary }}>Terms of Service</Text>
                    {' '}&amp;{' '}
                    <Text style={{ color: COLORS.primary }}>Privacy Policy</Text>
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },

    logoSection: { alignItems: 'center', marginBottom: 32 },
    logoCircle: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden', backgroundColor: COLORS.white, ...SHADOWS.md, marginBottom: 12 },
    logoImage: { width: 90, height: 90 },
    appName: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.textPrimary, letterSpacing: 3 },
    appTagline: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 4 },

    card: { backgroundColor: COLORS.white, borderRadius: 24, padding: 24, ...SHADOWS.md, marginBottom: 20 },

    stepTitle: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.textPrimary, marginBottom: 6 },
    stepSub: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginBottom: 24 },

    phoneRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    countryCode: {
        backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14,
        paddingVertical: 14, justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border,
    },
    countryCodeText: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    phoneInput: {
        flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16,
        paddingVertical: 14, fontSize: 18, fontFamily: FONTS.bold, color: COLORS.textPrimary,
        borderWidth: 1, borderColor: COLORS.border, letterSpacing: 2,
    },

    otpInput: {
        backgroundColor: '#F5F5F5', borderRadius: 12, paddingVertical: 18,
        fontSize: 30, fontFamily: FONTS.bold, color: COLORS.textPrimary,
        borderWidth: 1, borderColor: COLORS.border, marginBottom: 20, letterSpacing: 16,
    },

    nameInput: {
        backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
        fontSize: 16, fontFamily: FONTS.regular, color: COLORS.textPrimary,
        borderWidth: 1, borderColor: COLORS.border, marginBottom: 20,
    },

    primaryBtn: {
        backgroundColor: COLORS.primary, borderRadius: 50, paddingVertical: 15,
        alignItems: 'center', ...SHADOWS.orange,
    },
    primaryBtnDisabled: { opacity: 0.5 },
    primaryBtnText: { color: COLORS.white, fontSize: 15, fontFamily: FONTS.bold, letterSpacing: 1 },

    linkBtn: { alignItems: 'center', marginTop: 12 },
    linkBtnText: { fontSize: 14, color: COLORS.primary, fontFamily: FONTS.medium },

    dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#DDD' },
    dotActive: { backgroundColor: COLORS.primary, width: 24 },

    terms: { textAlign: 'center', fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textLight, lineHeight: 18 },
});
