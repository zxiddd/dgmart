import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../src/config/theme';
import { useCartStore } from '../../src/store/cartStore';

function TabIcon({ name, color, focused, badge }) {
    return (
        <View style={styles.tabIconContainer}>
            <MaterialIcons name={name} size={24} color={color} />
            {badge > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
            {focused && <View style={styles.activeIndicator} />}
        </View>
    );
}

import LiveOrderFloat from '../../components/LiveOrderFloat';

export default function TabsLayout() {
    const totalItems = useCartStore((s) => s.getTotalItems());

    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: styles.tabBar,
                    tabBarActiveTintColor: COLORS.primary,
                    tabBarInactiveTintColor: COLORS.textLight,
                    tabBarLabelStyle: styles.tabLabel,
                    tabBarHideOnKeyboard: true,
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} />,
                    }}
                />
                <Tabs.Screen
                    name="search"
                    options={{
                        title: 'Search',
                        tabBarIcon: ({ color, focused }) => <TabIcon name="search" color={color} focused={focused} />,
                    }}
                />
                <Tabs.Screen
                    name="orders"
                    options={{
                        title: 'Orders',
                        tabBarIcon: ({ color, focused }) => <TabIcon name="receipt-long" color={color} focused={focused} />,
                    }}
                />
                <Tabs.Screen
                    name="favorites"
                    options={{
                        title: 'Favorites',
                        tabBarIcon: ({ color, focused }) => <TabIcon name="favorite" color={color} focused={focused} />,
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                        tabBarIcon: ({ color, focused }) => <TabIcon name="person" color={color} focused={focused} />,
                    }}
                />
            </Tabs>
            <LiveOrderFloat />
        </>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: COLORS.white,
        borderTopWidth: 0,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        height: SIZES.tabBarHeight + 8,
        paddingBottom: 8,
        paddingTop: 8,
    },
    tabLabel: {
        fontFamily: FONTS.medium,
        fontSize: 11,
        marginTop: 2,
    },
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    activeIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.primary,
        marginTop: 2,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: COLORS.error,
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 9,
        fontFamily: FONTS.bold,
    },
});
