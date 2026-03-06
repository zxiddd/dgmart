import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, FlatList, ScrollView,
    StyleSheet, RefreshControl, Dimensions, StatusBar,
    Animated, Platform, UIManager, Easing, Modal, Alert
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../src/config/theme';
import { restaurantAPI, bannerAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { useCartStore } from '../../src/store/cartStore';
import { useRestaurantStore } from '../../src/store/restaurantStore';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const { width } = Dimensions.get('window');

const CATEGORIES = [
    { id: 'all', name: 'All', icon: 'utensils' },
    { id: 'biryani', name: 'Biryani', icon: 'utensils' },
    { id: 'pizza', name: 'Pizza', icon: 'pizza-slice' },
    { id: 'burger', name: 'Burger', icon: 'hamburger' },
    { id: 'chinese', name: 'Chinese', icon: 'bacon' },
    { id: 'south_indian', name: 'South Indian', icon: 'leaf' },
    { id: 'desserts', name: 'Desserts', icon: 'ice-cream' },
    { id: 'drinks', name: 'Drinks', icon: 'coffee' },
];

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

// ─── Shimmer Skeleton ────────────────────────────────────────────────────────
const Shimmer = ({ style }) => {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(anim, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })
        );
        loop.start();
        return () => loop.stop();
    }, []);
    const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [-width, width] });
    return (
        <View style={[style, { backgroundColor: '#EDEDED', overflow: 'hidden' }]}>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx }] }]}>
                <LinearGradient
                    colors={['#EDEDED', '#F8F8F8', '#EDEDED']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                />
            </Animated.View>
        </View>
    );
};

// ─── Scale-on-press wrapper ──────────────────────────────────────────────────
const ScalePress = ({ children, onPress, onPressIn, onLongPress, style, scaleTo = 0.96 }) => {
    const scale = useRef(new Animated.Value(1)).current;
    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={onPress}
                onLongPress={onLongPress}
                onPressIn={() => {
                    onPressIn?.();
                    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 50 }).start();
                }}
                onPressOut={() => {
                    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
                }}
            >
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function HomeScreen() {
    const router = useRouter();
    const profile = useAuthStore(s => s.profile);
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const fetchProfile = useAuthStore(s => s.fetchProfile);
    const user = useAuthStore(s => s.user);
    const currentAddress = useAuthStore(s => s.currentAddress);
    const addresses = useAuthStore(s => s.addresses);
    const addressesFetched = useAuthStore(s => s.addressesFetched);
    const justRegistered = useAuthStore(s => s.justRegistered);
    const cartCount = useCartStore(s => s.getTotalItems());

    const hasRedirected = useRef(false);

    const setCachedRestaurant = useRestaurantStore(s => s.setRestaurant);
    const getCachedRestaurant = useRestaurantStore(s => s.getRestaurant);

    // Self-healing: If somehow profile fetch failed during login, retry here
    useEffect(() => {
        if (isAuthenticated && !profile) {
            console.log('🔄 Profile missing on Home mount. Retrying fetch...');
            fetchProfile();
        }
    }, [isAuthenticated, profile]);

    useEffect(() => {
        // Only redirect if profile is loaded, addresses are fetched and empty, 
        // AND we haven't already redirected in this component mount.
        if (profile && addressesFetched && !hasRedirected.current && addresses.length === 0) {
            hasRedirected.current = true;
            useAuthStore.setState({ justRegistered: false });

            console.log('🚀 No addresses found. Redirecting to address setup...');
            setTimeout(() => {
                router.push('/addresses');
            }, 800);
        }
    }, [profile, addressesFetched, addresses.length, router]);

    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [banners, setBanners] = useState([]);
    const [bannerIdx, setBannerIdx] = useState(0);
    const [selectedRest, setSelectedRest] = useState(null);
    const [showActions, setShowActions] = useState(false);
    const bannerRef = useRef(null);

    // Single entry fade-in — no parallax/scroll animation to keep 60 fps
    const fadeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, []);

    const firstName = profile?.name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || 'there';

    // ── Data fetching ────────────────────────────────────────────────────────
    const fetchRestaurants = useCallback(async () => {
        try {
            const params = {};
            if (activeCategory !== 'all') params.cuisine = activeCategory;
            const res = await restaurantAPI.list(params);
            if (res.success) setRestaurants(res.data.restaurants);
        } catch {
            setRestaurants([
                { id: '1', name: 'Biryani Palace', cuisine_type: ['biryani'], rating: 4.5, total_reviews: 234, avg_prep_time_mins: 35, delivery_fee: 20, min_order_amount: 149, banner_url: 'https://placehold.co/600x400/D4AF37/FFFFFF?text=Biryani+Palace' },
                { id: '2', name: 'Pizza Corner', cuisine_type: ['pizza'], rating: 4.2, total_reviews: 156, avg_prep_time_mins: 25, delivery_fee: 15, min_order_amount: 199, banner_url: 'https://placehold.co/600x400/B4941F/FFFFFF?text=Pizza+Corner' },
                { id: '3', name: 'Green Leaf Veg', cuisine_type: ['south_indian'], rating: 4.7, total_reviews: 389, avg_prep_time_mins: 30, delivery_fee: 0, min_order_amount: 99, banner_url: 'https://placehold.co/600x400/F3E5AB/333333?text=Green+Leaf', is_veg: true },
                { id: '4', name: 'Burger Hub', cuisine_type: ['burger'], rating: 4.0, total_reviews: 98, avg_prep_time_mins: 20, delivery_fee: 25, min_order_amount: 149, banner_url: 'https://placehold.co/600x400/D4AF37/FFFFFF?text=Burger+Hub' },
                { id: '5', name: 'Chai & Snacks', cuisine_type: ['drinks'], rating: 4.6, total_reviews: 512, avg_prep_time_mins: 15, delivery_fee: 0, min_order_amount: 49, banner_url: 'https://placehold.co/600x400/B4941F/FFFFFF?text=Chai+Snacks', is_veg: true },
            ]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeCategory]);

    const fetchBanners = useCallback(async () => {
        try {
            const res = await bannerAPI.list();
            if (res.success) setBanners(res.data);
        } catch { }
    }, []);

    useEffect(() => {
        Promise.all([fetchRestaurants(), fetchBanners()]);
    }, [fetchRestaurants]);

    const onRefresh = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRefreshing(true);
        Promise.all([fetchRestaurants(), fetchBanners()]);
    };

    const prefetch = async (id) => {
        if (!id || getCachedRestaurant(id)) return;
        try {
            const res = await restaurantAPI.getById(id);
            if (res.success) setCachedRestaurant(id, res.data.restaurant);
        } catch { }
    };

    // ── Header ───────────────────────────────────────────────────────────────
    const renderHeader = () => (
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            {/* Row 1 — greeting + profile */}
            <View style={styles.headerRow1}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.greeting}>{getGreeting()}, {firstName}! 👋</Text>
                    <Text style={styles.greetingSub}>What would you like to eat?</Text>
                </View>
                <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(tabs)/profile')}>
                    <LinearGradient colors={['#D4AF37', '#B4941F']} style={styles.profileGradient}>
                        <Text style={styles.profileInitial}>
                            {(profile?.name || user?.user_metadata?.name || 'U')[0].toUpperCase()}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Row 2 — address */}
            <TouchableOpacity style={styles.addressBar} onPress={() => router.push('/addresses')} activeOpacity={0.7}>
                <View style={styles.addressIconWrap}>
                    <MaterialIcons name="location-on" size={16} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.addressLabel}>DELIVERING TO</Text>
                    <Text style={styles.addressName} numberOfLines={1}>
                        {currentAddress
                            ? `${currentAddress.label ? currentAddress.label.charAt(0).toUpperCase() + currentAddress.label.slice(1) : 'Address'} · ${currentAddress.full_address}`
                            : 'Set your delivery address'}
                    </Text>
                </View>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={COLORS.primary} />
            </TouchableOpacity>

            {/* Row 3 — search */}
            <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(tabs)/search')} activeOpacity={0.8}>
                <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.searchPlaceholder}>Search restaurants or dishes…</Text>
                <View style={styles.searchDivider} />
                <MaterialIcons name="tune" size={18} color={COLORS.primary} />
            </TouchableOpacity>
        </Animated.View>
    );

    // ── Category chips ────────────────────────────────────────────────────────
    const renderCategory = ({ item }) => {
        const active = activeCategory === item.id;
        return (
            <TouchableOpacity
                onPress={() => { Haptics.selectionAsync(); setActiveCategory(item.id); }}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.75}
            >
                <FontAwesome5 name={item.icon} size={12} color={active ? COLORS.white : COLORS.primary} style={{ marginRight: 5 }} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.name}</Text>
            </TouchableOpacity>
        );
    };

    // ── Banner ────────────────────────────────────────────────────────────────
    const renderBanner = () => {
        if (banners.length > 0) {
            return (
                <View style={styles.bannerWrap}>
                    <ScrollView
                        ref={bannerRef}
                        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={e => setBannerIdx(Math.round(e.nativeEvent.contentOffset.x / (width - 32)))}
                    >
                        {banners.map((b, i) => (
                            <LinearGradient
                                key={b.id || i}
                                colors={b.gradient_colors || ['#D4AF37', '#8B6508']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={styles.bannerCard}
                            >
                                <View style={{ flex: 1 }}>
                                    <View style={styles.bannerBadge}>
                                        <Text style={styles.bannerBadgeText}>{b.badge_text || '🎉 OFFER'}</Text>
                                    </View>
                                    <Text style={styles.bannerTitle}>{b.title}</Text>
                                    <Text style={styles.bannerSub}>{b.subtitle}</Text>
                                    <TouchableOpacity style={styles.bannerBtn}>
                                        <Text style={styles.bannerBtnText}>{b.button_text || 'Order Now'}</Text>
                                    </TouchableOpacity>
                                </View>
                                {b.image_url ? (
                                    <ExpoImage source={{ uri: b.image_url }} style={styles.bannerImg} contentFit="contain" />
                                ) : null}
                            </LinearGradient>
                        ))}
                    </ScrollView>
                    {banners.length > 1 && (
                        <View style={styles.dotsRow}>
                            {banners.map((_, i) => (
                                <View key={i} style={[styles.dot, i === bannerIdx && styles.dotActive]} />
                            ))}
                        </View>
                    )}
                </View>
            );
        }

        // Default brand banner
        return (
            <LinearGradient
                colors={['#D4AF37', '#A07810', '#7A5C00']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.bannerCard, styles.defaultBanner]}
            >
                <View style={{ flex: 1 }}>
                    <View style={styles.bannerBadge}>
                        <Text style={styles.bannerBadgeText}>🛍️ DEGLOOR MART</Text>
                    </View>
                    <Text style={styles.bannerTitle}>Fresh Food,{'\n'}Fast Delivery</Text>
                    <Text style={styles.bannerSub}>Order from the best restaurants in Degloor</Text>
                </View>
                <View style={styles.bannerIconBlock}>
                    <Text style={{ fontSize: 64 }}>🍛</Text>
                </View>
            </LinearGradient>
        );
    };

    // ── Trending (horizontal) ────────────────────────────────────────────────
    const renderTrending = () => {
        if (loading || restaurants.length === 0) return null;
        return (
            <View style={{ marginBottom: 8 }}>
                <View style={styles.rowHeader}>
                    <Text style={styles.sectionTitle}>Popular Near You</Text>
                </View>
                <FlatList
                    data={restaurants.slice(0, 6)}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                    keyExtractor={item => `tr-${item.id}`}
                    renderItem={({ item }) => (
                        <ScalePress
                            onPressIn={() => prefetch(item.id)}
                            onPress={() => { Haptics.selectionAsync(); router.push(`/restaurant/${item.id}`); }}
                        >
                            <View style={styles.trendCard}>
                                <ExpoImage
                                    source={{ uri: item.image_url || item.banner_url }}
                                    style={styles.trendImg}
                                    contentFit="cover"
                                    transition={200}
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.72)']}
                                    style={StyleSheet.absoluteFill}
                                />
                                {item.is_veg && (
                                    <View style={styles.vegBadge}>
                                        <Text style={styles.vegBadgeText}>VEG</Text>
                                    </View>
                                )}
                                <View style={styles.trendFooter}>
                                    <Text style={styles.trendName} numberOfLines={1}>{item.name}</Text>
                                    <View style={styles.trendMeta}>
                                        <MaterialIcons name="star" size={11} color="#FFD700" />
                                        <Text style={styles.trendRating}>{item.rating}</Text>
                                        <Text style={styles.trendDot}>·</Text>
                                        <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.8)" />
                                        <Text style={styles.trendTime}>{item.avg_prep_time_mins || 30}m</Text>
                                    </View>
                                </View>
                            </View>
                        </ScalePress>
                    )}
                />
            </View>
        );
    };

    // ── Skeleton card ─────────────────────────────────────────────────────────
    const renderSkeleton = () => (
        <View style={styles.restCard}>
            <Shimmer style={{ height: 160, width: '100%' }} />
            <View style={{ padding: 14 }}>
                <Shimmer style={{ height: 18, width: '55%', borderRadius: 4, marginBottom: 8 }} />
                <Shimmer style={{ height: 13, width: '35%', borderRadius: 4, marginBottom: 12 }} />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Shimmer style={{ height: 12, width: 60, borderRadius: 4 }} />
                    <Shimmer style={{ height: 12, width: 60, borderRadius: 4 }} />
                    <Shimmer style={{ height: 12, width: 60, borderRadius: 4 }} />
                </View>
            </View>
        </View>
    );

    // ── Restaurant card (vertical list) ───────────────────────────────────────
    const RestaurantCard = ({ item, index }) => {
        const isDish = item.result_type === 'dish';
        const isOffline = item.is_active === false;
        const anim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.timing(anim, {
                toValue: 1, duration: 400,
                delay: Math.min(index, 4) * 80,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }).start();
        }, []);

        const handlePress = () => {
            if (isOffline) {
                Alert.alert(
                    '⛔ Not Delivering',
                    `${item.name} is currently not accepting orders. Check back later!`,
                    [{ text: 'OK' }]
                );
                return;
            }
            Haptics.selectionAsync();
            router.push(`/restaurant/${item.restaurant_id || item.id}`);
        };

        return (
            <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
                <ScalePress
                    onPressIn={() => !isOffline && prefetch(item.restaurant_id || item.id)}
                    onPress={handlePress}
                    onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setSelectedRest(item); setShowActions(true); }}
                    style={[styles.restCard, isOffline && { opacity: 0.7 }]}
                >
                    {/* Image */}
                    <View style={styles.restImgWrap}>
                        <ExpoImage
                            source={{ uri: item.image_url || item.banner_url || 'https://placehold.co/600x300/D4AF37/FFFFFF?text=Restaurant' }}
                            style={styles.restImg}
                            contentFit="cover"
                            transition={250}
                        />
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.28)']} style={StyleSheet.absoluteFill} />

                        {/* Top-left: veg badge */}
                        {item.is_veg && (
                            <View style={styles.restVegBadge}>
                                <Text style={styles.restVegText}>PURE VEG</Text>
                            </View>
                        )}
                        {isDish && (
                            <View style={[styles.restVegBadge, { backgroundColor: COLORS.primary }]}>
                                <Text style={styles.restVegText}>DISH</Text>
                            </View>
                        )}
                        {item.is_featured && (
                            <View style={[styles.restVegBadge, { left: item.is_veg || isDish ? 85 : 10, backgroundColor: '#FFD700' }]}>
                                <Text style={[styles.restVegText, { color: '#000' }]}>POPULAR</Text>
                            </View>
                        )}

                        {/* Offline overlay */}
                        {isOffline && (
                            <View style={styles.unavailableOverlay}>
                                <View style={styles.unavailableBadge}>
                                    <MaterialIcons name="block" size={14} color="#fff" />
                                    <Text style={styles.unavailableBadgeText}>Currently Unavailable</Text>
                                </View>
                            </View>
                        )}

                        {/* Bottom-left: rating */}
                        <View style={styles.ratingBadge}>
                            <MaterialIcons name="star" size={11} color="#fff" />
                            <Text style={styles.ratingText}>{item.rating}</Text>
                            <Text style={styles.ratingCount}>({item.total_reviews || 0})</Text>
                        </View>
                    </View>

                    {/* Content */}
                    <View style={styles.restContent}>
                        <View style={styles.restRow1}>
                            <Text style={styles.restName} numberOfLines={1}>{item.name}</Text>
                            {item.min_order_amount ? (
                                <Text style={styles.restMinOrder}>Min ₹{item.min_order_amount}</Text>
                            ) : null}
                        </View>
                        <Text style={styles.restCuisine} numberOfLines={1}>
                            {isDish ? `from ${item.restaurant_name}` : (item.cuisine_type || []).join(' · ')}
                        </Text>
                        {isOffline ? (
                            <Text style={styles.closedText}>🔴 Not delivering right now</Text>
                        ) : (
                            <View style={styles.restMetaRow}>
                                <View style={styles.metaItem}>
                                    <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
                                    <Text style={styles.metaText}>{item.avg_prep_time_mins || 30} min</Text>
                                </View>
                                <View style={styles.metaDot} />
                                <View style={styles.metaItem}>
                                    <Ionicons name="bicycle-outline" size={13} color={COLORS.textSecondary} />
                                    <Text style={styles.metaText}>
                                        {item.delivery_fee === 0 ? 'Free delivery' : `₹${item.delivery_fee} delivery`}
                                    </Text>
                                </View>
                                {isDish && item.price ? (
                                    <>
                                        <View style={styles.metaDot} />
                                        <Text style={styles.metaPrice}>₹{item.price}</Text>
                                    </>
                                ) : null}
                            </View>
                        )}
                    </View>
                </ScalePress>
            </Animated.View>
        );
    };

    // ── Main render ───────────────────────────────────────────────────────────

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {renderHeader()}

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
                }
            >
                {/* Category chips */}
                <FlatList
                    data={CATEGORIES}
                    renderItem={renderCategory}
                    keyExtractor={i => i.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipList}
                    style={{ marginBottom: 20 }}
                />

                {/* Banner */}
                <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
                    {renderBanner()}
                </View>

                {/* Popular / Trending */}
                {renderTrending()}

                {/* All Restaurants */}
                <View style={{ paddingHorizontal: 16 }}>
                    <View style={styles.rowHeader}>
                        <Text style={styles.sectionTitle}>
                            {activeCategory === 'all' ? 'All Restaurants' : `${CATEGORIES.find(c => c.id === activeCategory)?.name} Places`}
                        </Text>
                        <Text style={styles.restCount}>{loading ? '…' : `${restaurants.length} places`}</Text>
                    </View>

                    {loading ? (
                        <>{renderSkeleton()}{renderSkeleton()}</>
                    ) : restaurants.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyIcon}>🍽️</Text>
                            <Text style={styles.emptyText}>No restaurants found</Text>
                            <Text style={styles.emptySub}>Try a different category</Text>
                        </View>
                    ) : (
                        restaurants.map((item, index) => (
                            <RestaurantCard key={item.id} item={item} index={index} />
                        ))
                    )}
                </View>

                <View style={{ height: 110 }} />
            </ScrollView>

            {/* Floating cart button */}
            {cartCount > 0 && (
                <TouchableOpacity
                    style={styles.cartFab}
                    onPress={() => router.push('/cart')}
                    activeOpacity={0.9}
                >
                    <LinearGradient colors={['#D4AF37', '#A07810']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cartFabGradient}>
                        <View style={styles.cartCount}>
                            <Text style={styles.cartCountText}>{cartCount}</Text>
                        </View>
                        <Text style={styles.cartFabText}>View Cart</Text>
                        <Ionicons name="cart" size={20} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* Quick actions sheet */}
            <Modal visible={showActions} transparent animationType="slide" onRequestClose={() => setShowActions(false)}>
                <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setShowActions(false)}>
                    <View style={styles.sheet} onStartShouldSetResponder={() => true}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle} numberOfLines={1}>{selectedRest?.name}</Text>
                        {[
                            { icon: 'restaurant-menu', color: COLORS.primary, label: 'View Menu', onPress: () => { setShowActions(false); router.push(`/restaurant/${selectedRest?.id}`); } },
                            { icon: 'favorite-border', color: '#EF4444', label: 'Add to Favourites', onPress: () => setShowActions(false) },
                        ].map(a => (
                            <TouchableOpacity key={a.label} style={styles.sheetItem} onPress={a.onPress}>
                                <View style={[styles.sheetItemIcon, { backgroundColor: a.color + '18' }]}>
                                    <MaterialIcons name={a.icon} size={20} color={a.color} />
                                </View>
                                <Text style={styles.sheetItemText}>{a.label}</Text>
                                <MaterialIcons name="chevron-right" size={20} color={COLORS.textLight} />
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.sheetClose} onPress={() => setShowActions(false)}>
                            <Text style={styles.sheetCloseText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    scrollContent: { paddingTop: 8 },

    // ─ Header ─
    header: {
        backgroundColor: COLORS.white,
        paddingTop: 52,
        paddingHorizontal: 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        ...SHADOWS.sm,
    },
    headerRow1: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    greeting: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    greetingSub: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 2 },
    profileBtn: { marginLeft: 12 },
    profileGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    profileInitial: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.white },

    // Address bar
    addressBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FBF7EC',
        borderRadius: 12, borderWidth: 1, borderColor: COLORS.primaryLight,
        paddingHorizontal: 12, paddingVertical: 10,
        marginBottom: 12,
    },
    addressIconWrap: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: COLORS.primaryLight + '60',
        justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    addressLabel: { fontSize: 9, fontFamily: FONTS.bold, color: COLORS.primary, letterSpacing: 0.8 },
    addressName: { fontSize: 13, fontFamily: FONTS.medium, color: COLORS.textPrimary, marginTop: 1 },

    // Search bar
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12, borderWidth: 1, borderColor: '#EBEBEB',
        paddingHorizontal: 14, height: 46,
        ...SHADOWS.sm,
    },
    searchPlaceholder: { flex: 1, marginLeft: 10, fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textLight },
    searchDivider: { width: 1, height: 18, backgroundColor: '#E5E5E5', marginHorizontal: 10 },

    // ─ Category chips ─
    chipList: { paddingHorizontal: 16, gap: 8 },
    chip: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border,
        paddingHorizontal: 14, paddingVertical: 8,
        ...SHADOWS.sm,
    },
    chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipText: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
    chipTextActive: { color: COLORS.white },

    // ─ Banner ─
    bannerWrap: { marginBottom: 4 },
    bannerCard: {
        width: width - 32,
        borderRadius: 18,
        flexDirection: 'row', alignItems: 'center',
        padding: 20, minHeight: 150,
        overflow: 'hidden',
        ...SHADOWS.gold,
    },
    defaultBanner: { width: '100%' },
    bannerBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.22)',
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20, marginBottom: 10,
    },
    bannerBadgeText: { color: '#fff', fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 0.5 },
    bannerTitle: { color: '#fff', fontSize: 22, fontFamily: FONTS.black, lineHeight: 28, marginBottom: 6 },
    bannerSub: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontFamily: FONTS.regular, marginBottom: 14 },
    bannerBtn: { backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    bannerBtnText: { color: COLORS.primaryDark, fontFamily: FONTS.bold, fontSize: 12 },
    bannerImg: { width: 100, height: 100 },
    bannerIconBlock: { justifyContent: 'center', alignItems: 'center', width: 100 },
    dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 5 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
    dotActive: { width: 20, backgroundColor: COLORS.primary },

    // ─ Section headers ─
    rowHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, marginBottom: 12,
    },
    sectionTitle: { fontSize: 17, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    restCount: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.textSecondary },

    // ─ Trending cards ─
    trendCard: {
        width: 200, height: 130, borderRadius: 14,
        overflow: 'hidden', backgroundColor: '#eee',
        ...SHADOWS.md,
    },
    trendImg: { width: '100%', height: '100%' },
    vegBadge: {
        position: 'absolute', top: 8, left: 8,
        backgroundColor: COLORS.success,
        paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
    },
    vegBadgeText: { color: '#fff', fontSize: 9, fontFamily: FONTS.bold },
    trendFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
    trendName: { color: '#fff', fontSize: 14, fontFamily: FONTS.bold, marginBottom: 3 },
    trendMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    trendRating: { color: '#fff', fontSize: 11, fontFamily: FONTS.bold },
    trendDot: { color: 'rgba(255,255,255,0.6)', marginHorizontal: 2 },
    trendTime: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: FONTS.regular },

    // ─ Restaurant cards ─
    restCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16, overflow: 'hidden',
        marginBottom: 16, ...SHADOWS.md,
    },
    restImgWrap: { width: '100%', height: 160, position: 'relative' },
    restImg: { width: '100%', height: '100%' },
    restVegBadge: {
        position: 'absolute', top: 10, left: 10,
        backgroundColor: COLORS.success,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    },
    restVegText: { color: '#fff', fontSize: 9, fontFamily: FONTS.bold, letterSpacing: 0.5 },
    ratingBadge: {
        position: 'absolute', bottom: 10, left: 10,
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: COLORS.success,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    ratingText: { color: '#fff', fontSize: 12, fontFamily: FONTS.bold },
    ratingCount: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontFamily: FONTS.regular },
    restContent: { padding: 14 },
    restRow1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
    restName: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.textPrimary, flex: 1 },
    restMinOrder: { fontSize: 11, fontFamily: FONTS.medium, color: COLORS.textLight, marginLeft: 8 },
    restCuisine: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginBottom: 10, textTransform: 'capitalize' },
    restMetaRow: { flexDirection: 'row', alignItems: 'center' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.textSecondary },
    metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.textLight, marginHorizontal: 8 },
    metaPrice: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.primary },

    // ─ Offline restaurant overlay ─
    unavailableOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    unavailableBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(0,0,0,0.75)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    unavailableBadgeText: { color: '#fff', fontSize: 12, fontFamily: FONTS.bold },
    closedText: { fontSize: 12, fontFamily: FONTS.medium, color: '#E53935', marginTop: 2 },

    // ─ Empty state ─
    emptyWrap: { alignItems: 'center', paddingVertical: 48 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    emptySub: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 4 },

    // ─ Cart FAB ─
    cartFab: {
        position: 'absolute', bottom: 28, alignSelf: 'center',
        borderRadius: 30, overflow: 'hidden',
        ...SHADOWS.gold,
    },
    cartFabGradient: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 22, paddingVertical: 14, gap: 10,
    },
    cartCount: {
        backgroundColor: 'rgba(255,255,255,0.28)',
        width: 24, height: 24, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
    },
    cartCountText: { color: '#fff', fontSize: 12, fontFamily: FONTS.bold },
    cartFabText: { color: '#fff', fontSize: 15, fontFamily: FONTS.bold },

    // ─ Quick actions sheet ─
    sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 20, paddingBottom: 36,
    },
    sheetHandle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16,
    },
    sheetTitle: { fontSize: 17, fontFamily: FONTS.bold, color: COLORS.textPrimary, marginBottom: 16 },
    sheetItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
    },
    sheetItemIcon: {
        width: 38, height: 38, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center', marginRight: 14,
    },
    sheetItemText: { flex: 1, fontSize: 15, fontFamily: FONTS.medium, color: COLORS.textPrimary },
    sheetClose: { marginTop: 14, alignItems: 'center', paddingVertical: 12 },
    sheetCloseText: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.textSecondary },
});
