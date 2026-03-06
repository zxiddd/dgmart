import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_900Black } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../src/store/authStore';
import { COLORS } from '../src/config/theme';

import { registerForPushNotificationsAsync, initNotifications } from '../src/services/notificationService';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { isAuthenticated, isLoading, init, user } = useAuthStore();
    const router = useRouter();
    const segments = useSegments();

    const [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
        Inter_900Black,
    });

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    useEffect(() => {
        // Initialize notification listeners
        const cleanup = initNotifications(router);
        return () => cleanup && cleanup();
    }, [fontsLoaded]);

    useEffect(() => {
        if (isAuthenticated && user?.id) {
            registerForPushNotificationsAsync(user.id);
        }
    }, [isAuthenticated, user?.id]);

    useEffect(() => {
        if (isLoading || !fontsLoaded) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (isAuthenticated && inAuthGroup) {
            // Redirect to home if logged in and in auth group
            router.replace('/(tabs)/home');
        } else if (!isAuthenticated && !inAuthGroup) {
            // Redirect to login if not logged in and not in auth group
            router.replace('/(auth)/login');
        }
    }, [isAuthenticated, isLoading, segments, fontsLoaded]);

    if (!fontsLoaded || isLoading) return null; // Or a loading spinner

    return (
        <>
            <StatusBar style="dark" backgroundColor={COLORS.background} />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: COLORS.background },
                    animation: 'slide_from_right',
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="restaurant/[id]" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                <Stack.Screen name="cart" options={{ headerShown: false, animation: 'slide_from_bottom' }} />

                <Stack.Screen name="tracking/[id]" options={{ headerShown: false }} />
            </Stack>
            <Toast />
        </>
    );
}
