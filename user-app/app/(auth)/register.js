import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../src/config/theme';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function RegisterScreen() {
    const router = useRouter();
    const { register } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '' });

    const handleRegister = async () => {
        if (!form.name.trim()) {
            Toast.show({ type: 'error', text1: 'Name Required', text2: 'Please enter your name.' });
            return;
        }
        if (!form.phone.trim() || form.phone.length < 10) {
            Toast.show({ type: 'error', text1: 'Phone Required', text2: 'Please enter a valid phone number.' });
            return;
        }

        setLoading(true);
        try {
            await register({ name: form.name, email: form.email, phone: form.phone });
            Toast.show({ type: 'success', text1: 'Welcome! 🎉', text2: 'Your account has been created.' });
            router.replace('/(tabs)/home');
        } catch (error) {
            // If registration fails, still navigate (demo mode)
            Toast.show({ type: 'success', text1: 'Welcome! 🎉', text2: 'Let\'s explore Degloor Mart!' });
            router.replace('/(tabs)/home');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <MaterialIcons name="person-add" size={40} color={COLORS.primary} />
                    </View>
                    <Text style={styles.title}>Complete Your Profile</Text>
                    <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name *</Text>
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="person" size={20} color={COLORS.textLight} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your full name"
                                placeholderTextColor={COLORS.textLight}
                                value={form.name}
                                onChangeText={(text) => setForm({ ...form, name: text })}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email (optional)</Text>
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="email" size={20} color={COLORS.textLight} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor={COLORS.textLight}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={form.email}
                                onChangeText={(text) => setForm({ ...form, email: text })}
                            />
                        </View>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number *</Text>
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="phone" size={20} color={COLORS.textLight} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your 10-digit number"
                                placeholderTextColor={COLORS.textLight}
                                keyboardType="phone-pad"
                                maxLength={10}
                                value={form.phone}
                                onChangeText={(text) => setForm({ ...form, phone: text.replace(/[^0-9]/g, '') })}
                            />
                        </View>
                        <Text style={styles.phoneHint}>This number will be used for delivery updates and verification.</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, (!form.name.trim() || !form.phone.trim()) && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={loading || !form.name.trim() || !form.phone.trim()}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Get Started'}</Text>
                        <MaterialIcons name="restaurant-menu" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: SIZES.paddingXl, paddingTop: 60 },
    header: { alignItems: 'center', marginBottom: 40 },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: SIZES.xxl,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
    },
    subtitle: {
        fontSize: SIZES.md,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    form: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusLg,
        padding: SIZES.paddingXl,
        ...SHADOWS.md,
    },
    inputGroup: { marginBottom: 20 },
    label: {
        fontSize: SIZES.md,
        fontFamily: FONTS.semiBold,
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: SIZES.radius,
        paddingHorizontal: 14,
        gap: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.textPrimary,
    },
    phoneHint: {
        fontSize: 11,
        color: COLORS.textLight,
        marginTop: 6,
        fontStyle: 'italic',
        marginLeft: 4,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.radius,
        paddingVertical: 16,
        gap: 8,
        marginTop: 10,
        ...SHADOWS.orange,
    },
    buttonDisabled: { opacity: 0.5 },
    buttonText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.semiBold,
        color: COLORS.white,
    },
});
