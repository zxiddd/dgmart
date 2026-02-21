import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../src/config/theme';
import { useAuthStore } from '../src/store/authStore';

export default function AddressesScreen() {
    const router = useRouter();
    const { addresses, currentAddress, fetchAddresses, setCurrentAddress } = useAuthStore();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleSelect = (item) => {
        setCurrentAddress(item);
        router.back();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Saved Addresses</Text>
            </View>

            <FlatList
                data={addresses}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>No addresses found</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.card, currentAddress?.id === item.id && styles.activeCard]}
                        onPress={() => handleSelect(item)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.iconBg}>
                            <MaterialIcons
                                name={item.label === 'Work' ? 'work' : 'home'}
                                size={24}
                                color={currentAddress?.id === item.id ? COLORS.primary : COLORS.textSecondary}
                            />
                        </View>
                        <View style={styles.info}>
                            <Text style={styles.type}>{item.label ? item.label.charAt(0).toUpperCase() + item.label.slice(1) : 'Address'}</Text>
                            <Text style={styles.address}>{item.full_address}</Text>
                        </View>
                        {item.is_default && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>DEFAULT</Text>
                            </View>
                        )}
                        {currentAddress?.id === item.id && (
                            <MaterialIcons name="check-circle" size={24} color={COLORS.primary} />
                        )}
                    </TouchableOpacity>
                )}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/add-address')}
            >
                <MaterialIcons name="add" size={24} color={COLORS.white} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: SIZES.padding, paddingTop: 50, backgroundColor: COLORS.white, ...SHADOWS.sm },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    list: { padding: SIZES.padding },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderRadius: SIZES.radius, marginBottom: 16, ...SHADOWS.sm, borderWidth: 1, borderColor: 'transparent' },
    activeCard: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight + '10' },
    iconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    info: { flex: 1 },
    type: { fontSize: SIZES.md, fontFamily: FONTS.bold, color: COLORS.textPrimary, textTransform: 'capitalize' },
    address: { fontSize: SIZES.sm, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 4 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: COLORS.primaryLight + '40', borderRadius: 4, marginRight: 8 },
    badgeText: { fontSize: 10, fontFamily: FONTS.bold, color: COLORS.primaryDark },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.gold },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    emptyText: { fontSize: SIZES.md, color: COLORS.textSecondary, fontFamily: FONTS.medium },
});
