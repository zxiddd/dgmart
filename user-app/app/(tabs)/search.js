import { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../src/config/theme';
import { restaurantAPI } from '../../src/services/api';

const FILTERS = ['All', 'Rating 4.0+', 'Pure Veg', 'Free Delivery', 'Fast Delivery'];

export default function SearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [activeFilter, setActiveFilter] = useState('All');
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const search = useCallback(async () => {
        if (!query.trim()) return;
        setLoading(true);
        setSearched(true);
        try {
            const res = await restaurantAPI.list({ search: query });
            if (res.success) setResults(res.data.restaurants);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [query]);

    // Client-side filtering logic
    const applyFilters = (restaurants) => {
        if (!restaurants) return [];
        let filtered = [...restaurants];
        if (activeFilter === 'Rating 4.0+') {
            filtered = filtered.filter(r => r.rating >= 4.0);
        } else if (activeFilter === 'Pure Veg') {
            filtered = filtered.filter(r => r.is_veg);
        } else if (activeFilter === 'Free Delivery') {
            filtered = filtered.filter(r => r.delivery_fee === 0);
        }
        return filtered;
    };

    const displayResults = applyFilters(results);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
            <View style={styles.header}>
                <Text style={styles.title}>Search</Text>
            </View>

            <View style={styles.searchRow}>
                <View style={styles.searchInput}>
                    <MaterialIcons name="search" size={20} color={COLORS.textLight} />
                    <TextInput
                        style={styles.input}
                        placeholder="Search restaurants, cuisines..."
                        placeholderTextColor={COLORS.textLight}
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={search}
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
                            <MaterialIcons name="close" size={18} color={COLORS.textLight} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View>
                <FlatList
                    data={FILTERS}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterList}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
                            onPress={() => setActiveFilter(item)}
                        >
                            <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>{item}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {!searched ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="search" size={60} color={COLORS.borderLight} />
                    <Text style={styles.emptyTitle}>Search for food</Text>
                    <Text style={styles.emptySubtitle}>Find your favorite restaurants and dishes</Text>
                </View>
            ) : displayResults.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="sentiment-dissatisfied" size={60} color={COLORS.borderLight} />
                    <Text style={styles.emptyTitle}>No results found</Text>
                    <Text style={styles.emptySubtitle}>Try a different search term or filter</Text>
                </View>
            ) : (
                <FlatList
                    data={displayResults}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.resultsList}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.resultCard}
                            onPress={() => router.push(`/restaurant/${item.id}`)}
                        >
                            <View style={styles.resultIcon}>
                                <MaterialIcons name="restaurant" size={20} color={COLORS.primary} />
                            </View>
                            <View style={styles.resultInfo}>
                                <Text style={styles.resultName}>{item.name}</Text>
                                <Text style={styles.resultMeta}>{(item.cuisine_type || []).join(' • ')}</Text>
                            </View>
                            <View style={styles.resultRating}>
                                <MaterialIcons name="star" size={12} color={COLORS.warning} />
                                <Text style={styles.resultRatingText}>{item.rating}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { paddingTop: 50, paddingHorizontal: SIZES.padding, paddingBottom: 8, backgroundColor: COLORS.white },
    title: { fontSize: SIZES.xl, fontFamily: FONTS.bold, color: COLORS.textPrimary }, // Slightly smaller title
    searchRow: { paddingHorizontal: SIZES.padding, paddingVertical: 8, backgroundColor: COLORS.white },
    searchInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceLight,
        borderRadius: SIZES.radius,
        paddingHorizontal: 12,
        gap: 8,
        height: 44, // Reduced height
    },
    input: { flex: 1, fontSize: SIZES.md, fontFamily: FONTS.regular, color: COLORS.textPrimary },
    filterList: { paddingHorizontal: SIZES.padding, paddingVertical: 12, gap: 8 },
    filterChip: {
        paddingHorizontal: 12, // Reduced padding
        paddingVertical: 6, // Reduced padding
        borderRadius: 8, // Reduced radius (less round)
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 8,
    },
    filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterText: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.textSecondary }, // Smaller text
    filterTextActive: { color: COLORS.white },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100, marginTop: 40 },
    emptyTitle: { fontSize: SIZES.md, fontFamily: FONTS.semiBold, color: COLORS.textSecondary, marginTop: 16 },
    emptySubtitle: { fontSize: SIZES.sm, fontFamily: FONTS.regular, color: COLORS.textLight, marginTop: 4 },
    resultsList: { padding: SIZES.padding },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        padding: 12,
        marginBottom: 10,
        ...SHADOWS.sm,
    },
    resultIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primaryLight + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultInfo: { flex: 1, marginLeft: 12 },
    resultName: { fontSize: SIZES.md, fontFamily: FONTS.semiBold, color: COLORS.textPrimary },
    resultMeta: { fontSize: SIZES.xs, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 2, textTransform: 'capitalize' },
    resultRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    resultRatingText: { fontSize: SIZES.xs, fontFamily: FONTS.bold, color: COLORS.textPrimary },
});
