import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Animated, StatusBar, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { supabase } from '../../src/config/supabase';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../src/config/theme';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
    const router = useRouter();

    const [countryCode, setCountryCode] = useState('+91');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');

    // UI states
    const [step, setStep] = useState('phone'); // 'phone' or 'otp'
    const [loading, setLoading] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const animateTransition = (callback) => {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
        setTimeout(callback, 150);
    };

    const handleSendOtp = async () => {
        if (!phone || phone.length < 10) {
            Toast.show({ type: 'error', text1: 'Invalid Phone', text2: 'Please enter a valid phone number' });
            return;
        }

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

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 6) {
            Toast.show({ type: 'error', text1: 'Invalid OTP', text2: 'Please enter the 6-digit OTP' });
            return;
        }

        setLoading(true);
        try {
            const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`;

            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://YOUR_LOCAL_IP:3000/api';
            const res = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: fullPhone, otp })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Invalid OTP code');
            }

            // Set the session manually in Supabase client
            const { error: sessionError } = await supabase.auth.setSession({
                access_token: data.data.access_token,
                refresh_token: data.data.refresh_token,
            });

            if (sessionError) {
                console.error("Supabase Set Session Error:", sessionError);
                throw new Error('Failed to initialize local session');
            }

            Toast.show({ type: 'success', text1: 'Success', text2: 'Logged in successfully' });
            // Note: The auth state listener in useAuthStore will catch the session
            // and automatically update the state, redirecting you.

        } catch (error) {
            Toast.show({ type: 'error', text1: 'Verification Failed', text2: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

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
                    <Text style={styles.title}>{step === 'phone' ? 'Welcome' : 'Verify Phone'}</Text>
                    <Text style={styles.subtitle}>
                        {step === 'phone' ? 'Enter your phone number to continue' : `Enter the OTP sent to ${countryCode} ${phone}`}
                    </Text>
                </View>

                <View style={styles.form}>
                    {step === 'phone' ? (
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
                    ) : (
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
                    )}

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={step === 'phone' ? handleSendOtp : handleVerifyOtp}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.buttonText}>{step === 'phone' ? 'SEND OTP' : 'VERIFY & CONTINUE'}</Text>
                        )}
                    </TouchableOpacity>

                    {step === 'otp' && (
                        <TouchableOpacity
                            style={styles.changePhoneBtn}
                            onPress={() => animateTransition(() => {
                                setStep('phone');
                                setOtp('');
                            })}
                            disabled={loading}
                        >
                            <Text style={styles.changePhoneText}>Change Phone Number</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>
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
    changePhoneBtn: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    changePhoneText: {
        color: COLORS.textSecondary,
        fontFamily: FONTS.medium,
        fontSize: SIZES.sm,
    }
});
