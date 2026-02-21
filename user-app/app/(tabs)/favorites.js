import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../src/config/theme';
import { userAPI } from '../../src/services/api';

export default function FavoritesScreen() {
    const router = useRouter();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            const res = await userAPI.getFavorites();
            if (res.success) setFavorites(res.data.favorites);
        } catch {
            setFavorites([
                { id: '1', name: 'Biryani Palace', rating: 4.5, cuisine_type: ['biryani'], avg_delivery_time_mins: 35 },
                { id: '3', name: 'Green Leaf Veg', rating: 4.7, cuisine_type: ['south_indian'], avg_delivery_time_mins: 30 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async (id) => {
        try {
            await userAPI.toggleFavorite(id);
            setFavorites(favorites.filter(f => f.id !== id));
        } catch { }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Favorites</Text>
                <Text style={styles.count}>{favorites.length} saved</Text>
            </View>

            {favorites.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="favorite-border" size={80} color={COLORS.borderLight} />
                    <Text style={styles.emptyTitle}>No favorites yet</Text>
                    <Text style={styles.emptySubtitle}>Save your favorite restaurants for quick access</Text>
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => router.push(`/restaurant/${item.id}`)}
                            activeOpacity={0.9}
                        >
                            <View style={styles.cardIcon}>
                                <MaterialIcons name="restaurant" size={28} color={COLORS.primary} />
                            </View>
                            <View style={styles.cardInfo}>
                                <Text style={styles.cardName}>{item.name}</Text>
                                <Text style={styles.cardMeta}>{(item.cuisine_type || []).join(' • ')} • {item.avg_delivery_time_mins} min</Text>
                                <View style={styles.ratingRow}>
                                    <MaterialIcons name="star" size={14} color={COLORS.warning} />
                                    <Text style={styles.ratingText}>{item.rating}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.heartButton} onPress={() => removeFavorite(item.id)}>
                                <MaterialIcons name="favorite" size={24} color={COLORS.error} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: 50,
        paddingHorizontal: SIZES.padding,
        paddingBottom: 12,
        backgroundColor: COLORS.white,
    },
    title: { fontSize: SIZES.xxl, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    count: { fontSize: SIZES.sm, fontFamily: FONTS.medium, color: COLORS.textSecondary },
    list: { padding: SIZES.padding },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusLg,
        padding: 16,
        marginBottom: 10,
        ...SHADOWS.sm,
    },
    cardIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primaryLight + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardInfo: { flex: 1, marginLeft: 14 },
    cardName: { fontSize: SIZES.base, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    cardMeta: { fontSize: SIZES.sm, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 3, textTransform: 'capitalize' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
    ratingText: { fontSize: SIZES.sm, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    heartButton: { padding: 8 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
    emptyTitle: { fontSize: SIZES.lg, fontFamily: FONTS.semiBold, color: COLORS.textSecondary, marginTop: 16 },
    emptySubtitle: { fontSize: SIZES.md, fontFamily: FONTS.regular, color: COLORS.textLight, marginTop: 4 },
});
