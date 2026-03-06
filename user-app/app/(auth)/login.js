import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Animated, StatusBar, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { setApiToken } from '../../src/services/api';
import { supabase } from '../../src/config/supabase';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../src/config/theme';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
    const router = useRouter();

    const [isLogin, setIsLogin] = useState(true);
    const [countryCode, setCountryCode] = useState('+91');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    // UI states
    const [step, setStep] = useState('form'); // 'form' or 'otp'
    const [loading, setLoading] = useState(false);
    const [requireVerification, setRequireVerification] = useState(true); // default safe
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://YOUR_LOCAL_IP:3000/api';
            const res = await fetch(`${API_URL}/app/config`);
            const data = await res.json();
            if (data.success && data.data && data.data.require_phone_verification !== undefined) {
                setRequireVerification(data.data.require_phone_verification);
            }
        } catch (error) {
            console.error('Failed to fetch config', error);
        }
    };

    const animateTransition = (callback) => {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
        setTimeout(callback, 150);
    };

    const toggleMode = () => {
        animateTransition(() => {
            setIsLogin(!isLogin);
            setIsForgotPassword(false);
            setStep('form');
            setOtp('');
            setPassword('');
        });
    };

    const toggleForgotPassword = () => {
        animateTransition(() => {
            setIsForgotPassword(!isForgotPassword);
            setIsLogin(false);
            setStep('form');
            setOtp('');
            setPassword('');
            setNewPassword('');
        });
    };

    const handleLogin = async () => {
        if (!phone || phone.length < 10 || !password) {
            Toast.show({ type: 'error', text1: 'Missing Details', text2: 'Please enter phone and password' });
            return;
        }

        setLoading(true);
        try {
            const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`;
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://YOUR_LOCAL_IP:3000/api';
            const res = await fetch(`${API_URL}/auth/login-with-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: fullPhone, password })
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Invalid credentials');
            }

            // INSTANTLY configure the api interceptor to use the token
            setApiToken(data.data.access_token);

            const { error: sessionError } = await supabase.auth.setSession({
                access_token: data.data.access_token,
                refresh_token: data.data.refresh_token,
            });

            if (sessionError) throw new Error('Failed to set local session');

            Toast.show({ type: 'success', text1: 'Welcome back!' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Login Failed', text2: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterAction = async () => {
        const emailValid = /\S+@\S+\.\S+/.test(email);
        if (!name || !email || !emailValid || !phone || phone.length < 10 || !password) {
            Toast.show({ type: 'error', text1: 'Missing Details', text2: 'Please fill all fields correctly to register' });
            return;
        }

        if (requireVerification && step === 'form') {
            handleSendOtp();
        } else {
            handleFinalRegister();
        }
    };

    const handleForgotPasswordAction = async () => {
        if (!phone || phone.length < 10) {
            Toast.show({ type: 'error', text1: 'Phone Required', text2: 'Please enter your phone number' });
            return;
        }

        if (step === 'form') {
            handleSendOtp();
        } else {
            handleResetPassword();
        }
    };

    const handleSendOtp = async () => {
        setLoading(true);
        try {
            const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`;
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://YOUR_LOCAL_IP:3000/api';
            const res = await fetch(`${API_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: fullPhone })
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to send OTP');
            }

            Toast.show({ type: 'success', text1: 'OTP Sent', text2: 'Please check your messages' });
            animateTransition(() => setStep('otp'));
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to send OTP', text2: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleFinalRegister = async () => {
        if (requireVerification && (!otp || otp.length < 6)) {
            Toast.show({ type: 'error', text1: 'Invalid OTP', text2: 'Please enter the 6-digit OTP' });
            return;
        }

        setLoading(true);
        try {
            const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`;
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://YOUR_LOCAL_IP:3000/api';
            const res = await fetch(`${API_URL}/auth/register-with-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone: fullPhone, password, otp: requireVerification ? otp : undefined })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Registration failed');
            }

            // INSTANTLY configure the api interceptor to use the token
            setApiToken(data.data.access_token);

            const { error: sessionError } = await supabase.auth.setSession({
                access_token: data.data.access_token,
                refresh_token: data.data.refresh_token,
            });

            if (sessionError) throw new Error('Failed to set local session');

            // Set flag so home screen knows to route to addresses
            useAuthStore.setState({ justRegistered: true });

            Toast.show({ type: 'success', text1: 'Welcome!', text2: 'Account created successfully' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Registration Failed', text2: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otp || otp.length < 6 || !newPassword || newPassword.length < 6) {
            Toast.show({ type: 'error', text1: 'Invalid Details', text2: 'Enter 6-digit OTP and new password (min 6 chars)' });
            return;
        }

        setLoading(true);
        try {
            const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`;
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://YOUR_LOCAL_IP:3000/api';
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: fullPhone, otp, newPassword })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to reset password');
            }

            Toast.show({ type: 'success', text1: 'Success', text2: 'Password reset! You can now login.' });
            toggleMode(); // Go back to login
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Reset Failed', text2: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    <View style={styles.header}>
                        <View style={styles.logoCircle}>
                            <Image
                                source={require('../../assets/logo.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.appName}>DEGLOOR MART</Text>
                        <Text style={styles.title}>
                            {isForgotPassword ? (step === 'otp' ? 'Set New Password' : 'Reset Password') : step === 'otp' ? 'Verify Phone' : isLogin ? 'Welcome Back' : 'Create Account'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {step === 'otp' ? `Enter the OTP sent to ${countryCode} ${phone}` : isForgotPassword ? 'Enter your phone to receive an OTP' : isLogin ? 'Login with your phone and password' : 'Sign up to get started'}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {step === 'form' ? (
                            <>
                                {!isLogin && !isForgotPassword && (
                                    <View>
                                        <View style={styles.inputContainer}>
                                            <Text style={styles.label}>FULL NAME</Text>
                                            <View style={styles.inputWrapper}>
                                                <MaterialIcons name="person-outline" size={20} color={COLORS.primary} />
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="John Doe"
                                                    placeholderTextColor={COLORS.textLight}
                                                    value={name}
                                                    onChangeText={setName}
                                                    editable={!loading}
                                                />
                                            </View>
                                        </View>
                                        <View style={styles.inputContainer}>
                                            <Text style={styles.label}>EMAIL</Text>
                                            <View style={styles.inputWrapper}>
                                                <MaterialIcons name="mail-outline" size={20} color={COLORS.primary} />
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="john@example.com"
                                                    placeholderTextColor={COLORS.textLight}
                                                    value={email}
                                                    onChangeText={setEmail}
                                                    keyboardType="email-address"
                                                    autoCapitalize="none"
                                                    editable={!loading}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                )}

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>PHONE NUMBER</Text>
                                    <View style={styles.phoneInputWrapper}>
                                        <TouchableOpacity style={styles.countryCodeBtn}>
                                            <Text style={styles.countryCodeText}>{countryCode}</Text>
                                            <MaterialIcons name="arrow-drop-down" size={20} color={COLORS.textSecondary} />
                                        </TouchableOpacity>
                                        <View style={styles.divider} />
                                        <TextInput
                                            style={styles.phoneInput}
                                            placeholder="98765 43210"
                                            placeholderTextColor={COLORS.textLight}
                                            value={phone}
                                            onChangeText={setPhone}
                                            keyboardType="phone-pad"
                                            maxLength={10}
                                            editable={!loading}
                                        />
                                    </View>
                                </View>

                                {!isForgotPassword && (
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>PASSWORD</Text>
                                        <View style={styles.inputWrapper}>
                                            <MaterialIcons name="lock-outline" size={20} color={COLORS.primary} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter your password"
                                                placeholderTextColor={COLORS.textLight}
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry={!showPassword}
                                                editable={!loading}
                                            />
                                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}

                                {isLogin && (
                                    <TouchableOpacity style={styles.forgotPasswordBtn} onPress={toggleForgotPassword} disabled={loading}>
                                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : (
                            <View style={styles.otpResetContainer}>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>OTP CODE</Text>
                                    <View style={styles.inputWrapper}>
                                        <MaterialIcons name="message" size={20} color={COLORS.primary} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter 6-digit OTP"
                                            placeholderTextColor={COLORS.textLight}
                                            value={otp}
                                            onChangeText={setOtp}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            editable={!loading}
                                        />
                                    </View>
                                </View>

                                {isForgotPassword && (
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>NEW PASSWORD</Text>
                                        <View style={styles.inputWrapper}>
                                            <MaterialIcons name="lock-outline" size={20} color={COLORS.primary} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter new password"
                                                placeholderTextColor={COLORS.textLight}
                                                value={newPassword}
                                                onChangeText={setNewPassword}
                                                secureTextEntry={!showPassword}
                                                editable={!loading}
                                            />
                                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={isForgotPassword ? handleForgotPasswordAction : step === 'otp' ? handleFinalRegister : isLogin ? handleLogin : handleRegisterAction}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {isForgotPassword ? (step === 'otp' ? 'RESET PASSWORD' : 'SEND RESET OTP') : step === 'otp' ? 'VERIFY & REGISTER' : isLogin ? 'LOGIN' : (requireVerification ? 'SEND OTP & REGISTER' : 'REGISTER')}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {step === 'form' && (
                            <TouchableOpacity style={styles.switchModeBtn} onPress={toggleMode} disabled={loading}>
                                <Text style={styles.switchModeText}>
                                    {isLogin || isForgotPassword ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {(step === 'otp' || isForgotPassword) && (
                            <TouchableOpacity
                                style={styles.switchModeBtn}
                                onPress={() => animateTransition(() => {
                                    setStep('form');
                                    setIsForgotPassword(false);
                                    setIsLogin(true);
                                    setOtp('');
                                    setNewPassword('');
                                })}
                                disabled={loading}
                            >
                                <Text style={styles.switchModeText}>Back to Login</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
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
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    form: {
        gap: 16,
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
    phoneInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: COLORS.border,
        height: 50,
        ...SHADOWS.sm,
    },
    countryCodeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: '100%',
    },
    countryCodeText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.medium,
        color: COLORS.textPrimary,
    },
    divider: {
        width: 1,
        height: '60%',
        backgroundColor: COLORS.border,
    },
    phoneInput: {
        flex: 1,
        fontFamily: FONTS.medium,
        fontSize: SIZES.base,
        color: COLORS.textPrimary,
        paddingHorizontal: 12,
        height: '100%',
    },
    input: {
        flex: 1,
        fontFamily: FONTS.medium,
        fontSize: SIZES.base,
        color: COLORS.textPrimary,
        marginLeft: 10,
        height: '100%',
    },
    eyeBtn: {
        padding: 5,
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
    switchModeBtn: {
        alignItems: 'center',
        paddingVertical: 10,
        marginTop: 5,
    },
    switchModeText: {
        color: COLORS.textSecondary,
        fontFamily: FONTS.medium,
        fontSize: SIZES.sm,
    },
    forgotPasswordBtn: {
        alignSelf: 'flex-end',
        paddingVertical: 4,
    },
    forgotPasswordText: {
        color: COLORS.primary,
        fontFamily: FONTS.medium,
        fontSize: SIZES.sm,
    },
    otpResetContainer: {
        gap: 16,
    }
});
