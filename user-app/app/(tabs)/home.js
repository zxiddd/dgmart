import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, StyleSheet, RefreshControl, Dimensions, StatusBar, Animated, Platform, LayoutAnimation, UIManager, Easing, Modal } from 'react-native';
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
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const { width } = Dimensions.get('window');

const CATEGORIES = [
    { id: 'all', name: 'All', icon: 'utensils', type: 'fa' },
    { id: 'biryani', name: 'Biryani', icon: 'utensils', type: 'fa' },
    { id: 'pizza', name: 'Pizza', icon: 'pizza-slice', type: 'fa' },
    { id: 'burger', name: 'Burger', icon: 'hamburger', type: 'fa' },
    { id: 'chinese', name: 'Chinese', icon: 'bacon', type: 'fa' }, // approximating
    { id: 'south_indian', name: 'South Indian', icon: 'leaf', type: 'fa' },
    { id: 'desserts', name: 'Desserts', icon: 'ice-cream', type: 'fa' },
    { id: 'drinks', name: 'Drinks', icon: 'coffee', type: 'fa' },
];

const ScalePress = ({ children, onPress, style, scaleTo = 0.95 }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(scaleValue, {
            toValue: scaleTo,
            useNativeDriver: true,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Animated.View style={[{ transform: [{ scale: scaleValue }] }]}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={1}
                style={style}
            >
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
};

const Shimmer = ({ style }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    return (
        <View style={[style, { backgroundColor: '#E1E9EE', overflow: 'hidden' }]}>
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        transform: [{ translateX }],
                    },
                ]}
            >
                <LinearGradient
                    colors={['#E1E9EE', '#F2F8FC', '#E1E9EE']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                />
            </Animated.View>
        </View>
    );
};

export default function HomeScreen() {
    const router = useRouter();
    const profile = useAuthStore((s) => s.profile);
    const currentAddress = useAuthStore((s) => s.currentAddress);
    const cartItems = useCartStore((s) => s.getTotalItems());

    const scrollY = useRef(new Animated.Value(0)).current;

    // Theme Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideDownAnim = useRef(new Animated.Value(-50)).current;
    const searchScaleAnim = useRef(new Animated.Value(0.8)).current;
    const searchFadeAnim = useRef(new Animated.Value(0)).current;

    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [banners, setBanners] = useState([]);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const bannerScrollRef = useRef(null);
    const welcomeFade = useRef(new Animated.Value(0)).current;
    const searchPulseAnim = useRef(new Animated.Value(1)).current;
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const setCachedRestaurant = useRestaurantStore(s => s.setRestaurant);
    const getCachedRestaurant = useRestaurantStore(s => s.getRestaurant);

    const prefetchRestaurant = async (restaurantId) => {
        if (!restaurantId || getCachedRestaurant(restaurantId)) return;
        try {
            const res = await restaurantAPI.getById(restaurantId);
            if (res.success) {
                setCachedRestaurant(restaurantId, res.data.restaurant);
            }
        } catch (err) {
            console.log('Prefetch Error:', err);
        }
    };

    const fetchBanners = async () => {
        try {
            const res = await bannerAPI.list();
            if (res.success) {
                setBanners(res.data);
            }
        } catch (err) {
            console.log('Fetch Banners Error:', err);
        }
    };

    const fetchRestaurants = useCallback(async () => {
        try {
            const params = {};
            if (activeCategory !== 'all') params.cuisine = activeCategory;
            if (searchQuery) params.search = searchQuery;
            const res = await restaurantAPI.list(params);
            if (res.success) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setRestaurants(res.data.restaurants);
            }
        } catch (err) {
            console.error('Fetch Restaurants Error:', err);
            // Fallback data
            setRestaurants([
                { id: '1', name: 'Biryani Palace', cuisine_type: ['biryani', 'north_indian'], rating: 4.5, total_reviews: 234, avg_delivery_time_mins: 35, delivery_fee: 20, min_order_amount: 149, is_veg: false, banner_url: 'https://placehold.co/600x400/D4AF37/FFFFFF?text=Biryani+Palace' },
                { id: '2', name: 'Pizza Corner', cuisine_type: ['pizza', 'italian'], rating: 4.2, total_reviews: 156, avg_delivery_time_mins: 25, delivery_fee: 15, min_order_amount: 199, is_veg: false, banner_url: 'https://placehold.co/600x400/B4941F/FFFFFF?text=Pizza+Corner' },
                { id: '3', name: 'Green Leaf Veg', cuisine_type: ['south_indian', 'chinese'], rating: 4.7, total_reviews: 389, avg_delivery_time_mins: 30, delivery_fee: 10, min_order_amount: 99, is_veg: true, banner_url: 'https://placehold.co/600x400/F3E5AB/333333?text=Green+Leaf' },
                { id: '4', name: 'Burger Hub', cuisine_type: ['burger', 'fast_food'], rating: 4.0, total_reviews: 98, avg_delivery_time_mins: 20, delivery_fee: 25, min_order_amount: 149, is_veg: false, banner_url: 'https://placehold.co/600x400/D4AF37/FFFFFF?text=Burger+Hub' },
                { id: '5', name: 'Chai & Snacks', cuisine_type: ['drinks', 'snacks'], rating: 4.6, total_reviews: 512, avg_delivery_time_mins: 15, delivery_fee: 0, min_order_amount: 49, is_veg: true, banner_url: 'https://placehold.co/600x400/B4941F/FFFFFF?text=Chai+Snacks' },
            ]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeCategory, searchQuery]);

    useEffect(() => {
        // Start Entry Animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true
            }),
            Animated.timing(slideDownAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true
            }),
            Animated.parallel([
                Animated.timing(searchFadeAnim, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }),
                Animated.spring(searchScaleAnim, { toValue: 1, friction: 6, tension: 40, delay: 300, useNativeDriver: true })
            ])
        ]).start();

        const loadData = async () => {
            try {
                // Parallelize all initial fetches
                await Promise.all([
                    fetchRestaurants(),
                    fetchBanners()
                ]);
            } catch (err) {
                console.error('Initial Load Error:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
        Animated.timing(welcomeFade, { toValue: 1, duration: 800, useNativeDriver: true }).start();

        // Search pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(searchPulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
                Animated.timing(searchPulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
            ])
        ).start();
    }, [fetchRestaurants]);

    // --- Parallax Interpolations ---
    const headerTranslateY = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -30],
        extrapolate: 'clamp',
    });

    const headerContentOpacity = scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const searchTranslateY = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -25],
        extrapolate: 'clamp',
    });

    const searchScale = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0.95],
        extrapolate: 'clamp',
    });

    const onRefresh = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRefreshing(true);
        Promise.all([fetchRestaurants(), fetchBanners()]).finally(() => setRefreshing(false));
    };

    const handleCategoryPress = (id) => {
        Haptics.selectionAsync();
        setActiveCategory(id);
    };

    // --- Render Components ---

    const renderBanners = () => {
        // When promos exist — full-width swipeable with dots
        if (banners.length > 0) {
            return (
                <View style={styles.bannerSection}>
                    <ScrollView
                        ref={bannerScrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                            setCurrentBannerIndex(idx);
                        }}
                    >
                        {banners.map((banner, index) => (
                            <View key={banner.id || index} style={styles.promoBannerCard}>
                                <LinearGradient
                                    colors={banner.gradient_colors || ['#D4AF37', '#B8860B']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    style={styles.promoBannerGradient}
                                >
                                    <View style={styles.promoBannerContent}>
                                        <View style={styles.promoBadge}>
                                            <Text style={styles.promoBadgeText}>{banner.badge_text || '🎉 PROMO'}</Text>
                                        </View>
                                        <Text style={styles.promoTitle}>{banner.title}</Text>
                                        <Text style={styles.promoSubtitle}>{banner.subtitle}</Text>
                                        <TouchableOpacity style={styles.promoBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}>
                                            <Text style={styles.promoBtnText}>{banner.button_text || 'Order Now'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {banner.image_url ? (
                                        <ExpoImage
                                            source={{ uri: banner.image_url }}
                                            style={styles.promoImage}
                                            contentFit="contain"
                                        />
                                    ) : null}
                                </LinearGradient>
                            </View>
                        ))}
                    </ScrollView>
                    <View style={styles.dotsRow}>
                        {banners.map((_, i) => (
                            <View key={i} style={[styles.dot2, i === currentBannerIndex && styles.dotActive]} />
                        ))}
                    </View>
                </View>
            );
        }

        // No promos — Welcome banner
        return (
            <Animated.View style={[styles.bannerSection, { opacity: welcomeFade }]}>
                <LinearGradient
                    colors={['#0f0c29', '#302b63', '#24243e']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.welcomeCard}
                >
                    {/* Stars */}
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        {[{ top: 12, left: 20 }, { top: 18, left: 120 }, { top: 8, left: 220 }, { top: 22, right: 30 }, { top: 10, right: 90 }].map((pos, i) => (
                            <Text key={i} style={[styles.starDot, pos]}>{i % 2 === 0 ? '✦' : '✧'}</Text>
                        ))}
                    </View>

                    <View style={styles.welcomeTextBlock}>
                        <Text style={styles.welcomeEyebrow}>🛍️  YOUR FAVOURITE FOOD APP</Text>
                        <Text style={styles.welcomeHeading}>Welcome to{`\n`}Degloor Mart</Text>
                        <Text style={styles.welcomeCaption}>Fresh food · Fast delivery · Always on time</Text>
                    </View>
                </LinearGradient>
            </Animated.View>
        );
    };

    const renderCategory = ({ item }) => {
        const isActive = activeCategory === item.id;
        return (
            <ScalePress
                style={styles.categoryCircleWrapper}
                onPress={() => handleCategoryPress(item.id)}
            >
                <View style={[styles.categoryCircle, isActive && styles.categoryCircleActive]}>
                    <FontAwesome5 name={item.icon} size={22} color={isActive ? '#fff' : COLORS.primary} />
                </View>
                <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]} numberOfLines={1}>
                    {item.name}
                </Text>
            </ScalePress>
        );
    };

    const RestaurantCard = ({ item, index }) => {
        const isDish = item.result_type === 'dish';
        const translateY = useRef(new Animated.Value(50)).current;
        const opacity = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 600,
                    delay: (index % 5) * 100,
                    easing: Easing.out(Easing.back(1)),
                    useNativeDriver: true
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 500,
                    delay: (index % 5) * 100,
                    useNativeDriver: true
                })
            ]).start();
        }, []);

        return (
            <Animated.View style={{ opacity, transform: [{ translateY }] }}>
                <ScalePress
                    style={styles.restaurantCardV2}
                    onPressIn={() => prefetchRestaurant(item.restaurant_id || item.id)}
                    onPress={() => {
                        Haptics.selectionAsync();
                        router.push(`/restaurant/${item.restaurant_id || item.id}`);
                    }}
                    onLongPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        setSelectedRestaurant(item);
                        setShowQuickActions(true);
                    }}
                    scaleTo={0.98}
                >
                    <View style={styles.cardImageContainerV2}>
                        <ExpoImage
                            source={{ uri: item.image_url || item.banner_url || 'https://placehold.co/600x400/D4AF37/FFFFFF?text=Item' }}
                            style={styles.cardImageV2}
                            contentFit="cover"
                            transition={200}
                        />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.4)']}
                            style={styles.cardImageOverlayV2}
                        />
                        <View style={styles.ratingBadgeV2}>
                            <Text style={styles.ratingTextV2}>{item.rating}</Text>
                            <MaterialIcons name="star" size={10} color="#fff" />
                        </View>
                        {isDish && (
                            <View style={styles.dishBadgeV2}>
                                <Text style={styles.dishBadgeTextV2}>DISH</Text>
                            </View>
                        )}
                        <TouchableOpacity style={styles.favBtnV2}>
                            <Ionicons name="heart-outline" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.cardContentV2}>
                        <View style={styles.cardHeaderV2}>
                            <Text style={styles.cardTitleV2} numberOfLines={1}>{item.name}</Text>
                        </View>

                        <Text style={styles.cardSubtitleV2} numberOfLines={1}>
                            {isDish ? `from ${item.restaurant_name}` : (item.cuisine_type || []).join(', ')}
                        </Text>

                        <View style={styles.cardMetricsV2}>
                            <View style={styles.metricItemV2}>
                                <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                                <Text style={styles.metricTextV2}>{item.avg_prep_time_mins || 30} min</Text>
                            </View>
                            <View style={styles.metricDotV2} />
                            <View style={styles.metricItemV2}>
                                <Ionicons name="bicycle-outline" size={14} color={COLORS.textSecondary} />
                                <Text style={styles.metricTextV2}>{item.delivery_fee === 0 ? 'FREE' : `₹${item.delivery_fee}`}</Text>
                            </View>
                            {isDish && (
                                <>
                                    <View style={styles.metricDotV2} />
                                    <View style={styles.metricItemV2}>
                                        <Text style={styles.priceTextV2}>₹{item.price}</Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </ScalePress>
            </Animated.View>
        );
    };

    const renderHeader = () => (
        <Animated.View style={[
            styles.headerV2,
            {
                opacity: fadeAnim,
                transform: [
                    { translateY: Animated.add(slideDownAnim, headerTranslateY) }
                ]
            }
        ]}>
            <Animated.View style={[styles.topRowV2, { opacity: headerContentOpacity }]}>
                <View style={styles.addressContainerV2}>
                    <View style={styles.locationCircleV2}>
                        <MaterialIcons name="location-on" size={18} color={COLORS.white} />
                    </View>
                    <TouchableOpacity style={styles.addressTextWrapperV2} onPress={() => router.push('/addresses')}>
                        <Text style={styles.deliverToV2}>DELIVERING TO</Text>
                        <View style={styles.locationNameRowV2}>
                            <Text style={styles.locationNameV2} numberOfLines={1}>
                                {currentAddress?.label || 'Set Location'}
                            </Text>
                            <MaterialIcons name="keyboard-arrow-down" size={20} color={COLORS.primary} />
                        </View>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.profileBtnV2} onPress={() => router.push('/profile')}>
                    <Ionicons name="person-circle-outline" size={32} color={COLORS.textPrimary} />
                </TouchableOpacity>
            </Animated.View>

            <Animated.View
                style={{
                    transform: [
                        { translateY: searchTranslateY },
                        { scale: searchScale }
                    ]
                }}
            >
                <TouchableOpacity
                    style={styles.searchBarV2}
                    onPress={() => router.push('/(tabs)/search')}
                    activeOpacity={0.9}
                >
                    <Ionicons name="search" size={20} color={COLORS.primary} />
                    <Animated.Text
                        style={[
                            styles.placeholderV2,
                            { transform: [{ scale: searchPulseAnim }] }
                        ]}
                    >
                        Search for "Biryani" or "Pizza"
                    </Animated.Text>
                    <View style={styles.searchDividerV2} />
                    <MaterialIcons name="mic" size={20} color={COLORS.primary} />
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );

    const renderRestaurantSkeleton = () => (
        <View style={styles.restaurantCardV2}>
            <Shimmer style={styles.cardImageContainerV2} />
            <View style={styles.cardContentV2}>
                <Shimmer style={{ height: 20, width: '60%', borderRadius: 4, marginBottom: 8 }} />
                <Shimmer style={{ height: 14, width: '40%', borderRadius: 4, marginBottom: 12 }} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Shimmer style={{ height: 14, width: 60, borderRadius: 4 }} />
                    <Shimmer style={{ height: 14, width: 60, borderRadius: 4 }} />
                </View>
            </View>
        </View>
    );

    const renderTrending = () => {
        const trendingItems = restaurants.slice(0, 5);
        if (loading || trendingItems.length === 0) return null;

        return (
            <View style={styles.trendingSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Trending Near You</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={trendingItems}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.trendingList}
                    keyExtractor={item => `trending-${item.id}`}
                    renderItem={({ item, index }) => (
                        <ScalePress
                            style={styles.trendingCard}
                            onPressIn={() => prefetchRestaurant(item.id)}
                            onPress={() => router.push(`/restaurant/${item.id}`)}
                            scaleTo={0.96}
                        >
                            <ExpoImage
                                source={{ uri: item.image_url || item.banner_url }}
                                style={styles.trendingImage}
                                contentFit="cover"
                                transition={200}
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.7)']}
                                style={styles.trendingOverlay}
                            />
                            <View style={styles.trendingContent}>
                                <Text style={styles.trendingName} numberOfLines={1}>{item.name}</Text>
                                <View style={styles.trendingMeta}>
                                    <MaterialIcons name="star" size={12} color="#FFD700" />
                                    <Text style={styles.trendingRating}>{item.rating}</Text>
                                    <Text style={styles.trendingTime}> • {item.avg_prep_time_mins || 30} mins</Text>
                                </View>
                            </View>
                            <View style={styles.trendingBadge}>
                                <Text style={styles.trendingBadgeText}>POPULAR</Text>
                            </View>
                        </ScalePress>
                    )}
                />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {renderHeader()}

            {/* MAIN SCROLL CONTENT */}
            <Animated.ScrollView
                style={styles.mainScroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
            >

                {/* Categories */}
                <View style={styles.section}>
                    <FlatList
                        data={CATEGORIES}
                        renderItem={renderCategory}
                        keyExtractor={item => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.catList}
                    />
                </View>

                {/* Banners */}
                {renderBanners()}

                {/* Trending Section */}
                {renderTrending()}

                {/* Restaurants */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>All Restaurants</Text>
                    {loading ? (
                        <>
                            {renderRestaurantSkeleton()}
                            {renderRestaurantSkeleton()}
                            {renderRestaurantSkeleton()}
                        </>
                    ) : (
                        restaurants.map((item, index) => (
                            <RestaurantCard key={item.id} item={item} index={index} />
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
            </Animated.ScrollView>

            {/* FLOATING CART BUTTON */}
            {cartItems.length > 0 && (
                <TouchableOpacity
                    style={styles.fabCart}
                    activeOpacity={0.8}
                    onPress={() => router.push('/cart')}
                >
                    <View style={styles.fabContent}>
                        <View style={styles.fabCount}>
                            <Text style={styles.fabCountText}>{cartItems.length}</Text>
                        </View>
                        <Text style={styles.fabText}>View Cart</Text>
                    </View>
                    <Ionicons name="cart" size={24} color="#fff" />
                </TouchableOpacity>
            )}

            {/* QUICK ACTIONS MODAL */}
            <Modal
                visible={showQuickActions}
                transparent
                animationType="fade"
                onRequestClose={() => setShowQuickActions(false)}
            >
                <TouchableOpacity
                    style={styles.quickModalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowQuickActions(false)}
                >
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                    <Animated.View style={styles.quickActionsContainer}>
                        <Text style={styles.quickActionsTitle}>{selectedRestaurant?.name}</Text>
                        <View style={styles.quickActionsList}>
                            <TouchableOpacity style={styles.quickActionItem} onPress={() => {
                                setShowQuickActions(false);
                                router.push(`/restaurant/${selectedRestaurant?.id}`);
                            }}>
                                <Ionicons name="restaurant" size={20} color={COLORS.primary} />
                                <Text style={styles.quickActionText}>View Menu</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.quickActionItem} onPress={() => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                setShowQuickActions(false);
                            }}>
                                <Ionicons name="heart" size={20} color="#FF4B4B" />
                                <Text style={styles.quickActionText}>Add to Favorites</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.quickActionItem, { borderBottomWidth: 0 }]} onPress={() => setShowQuickActions(false)}>
                                <Ionicons name="share-social" size={20} color="#4B7BFF" />
                                <Text style={styles.quickActionText}>Share Restaurant</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.quickCloseBtn} onPress={() => setShowQuickActions(false)}>
                            <Text style={styles.quickCloseText}>Close</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F2',
    },
    headerBackground: {
        paddingBottom: 30, // Space for search bar overlap
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...SHADOWS.md,
    },
    headerSafeArea: {
        paddingHorizontal: 16,
        paddingBottom: 60,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    locationBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    locationIconBg: {
        backgroundColor: '#fff',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    locationValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        maxWidth: 200,
    },
    profileBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    profileInitials: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    searchContainer: {
        position: 'absolute',
        bottom: -24, // Half overlap
        left: 16,
        right: 16,
        zIndex: 10,
    },
    searchBar: {
        backgroundColor: '#fff',
        borderRadius: 16,
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        height: '100%',
    },
    mainScroll: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 10,
    },
    section: {
        marginBottom: 24,
    },
    catList: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
    },
    categoryItem: {
        alignItems: 'center',
        marginRight: 16,
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        minWidth: 80,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    categoryItemActive: {
        backgroundColor: COLORS.primary,
    },
    categoryIcon: {
        marginBottom: 8,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    categoryTextActive: {
        color: '#fff',
    },
    bannerSection: {
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
    },
    // Promo banner (when admin adds promos)
    promoBannerCard: {
        width: width - 32,
        height: 170,
        overflow: 'hidden',
    },
    promoBannerGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingVertical: 18,
    },
    promoBannerContent: {
        flex: 1,
    },
    promoBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    promoBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    promoTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 4,
    },
    promoSubtitle: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13,
        marginBottom: 14,
    },
    promoBtn: {
        backgroundColor: '#fff',
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    promoBtnText: {
        color: '#B8860B',
        fontWeight: '800',
        fontSize: 13,
    },
    promoImage: {
        width: 110,
        height: 110,
        resizeMode: 'contain',
    },
    // Welcome banner (no promos)
    welcomeCard: {
        height: 170,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    welcomeTextBlock: {
        padding: 20,
        paddingBottom: 36,
        zIndex: 2,
    },
    welcomeEyebrow: {
        color: 'rgba(255,215,0,0.85)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 6,
    },
    welcomeHeading: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '900',
        lineHeight: 31,
        marginBottom: 5,
    },
    welcomeCaption: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '500',
    },
    starDot: {
        position: 'absolute',
        color: '#fff',
        fontSize: 10,
        opacity: 0.4,
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 6,
    },
    dot2: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    dotActive: {
        width: 20,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        marginLeft: 16,
        marginBottom: 16,
    },
    // Category Circle Styles
    categoryCircleWrapper: {
        alignItems: 'center',
        marginRight: 20,
        width: 65,
    },
    categoryCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.sm,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        marginBottom: 8,
    },
    categoryCircleActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    categoryLabel: {
        fontSize: 11,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    categoryLabelActive: {
        color: COLORS.primary,
        fontFamily: FONTS.bold,
    },

    // Restaurant Card V2 (Swiggy Style)
    restaurantCardV2: {
        marginHorizontal: 16,
        marginBottom: 24,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        ...SHADOWS.md,
        overflow: 'hidden',
    },
    cardImageContainerV2: {
        width: '100%',
        height: 160,
    },
    cardImageV2: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cardImageOverlayV2: {
        ...StyleSheet.absoluteFillObject,
    },
    ratingBadgeV2: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.success,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 2,
    },
    ratingTextV2: {
        color: COLORS.white,
        fontSize: 12,
        fontFamily: FONTS.bold,
    },
    dishBadgeV2: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    dishBadgeTextV2: {
        color: COLORS.white,
        fontSize: 10,
        fontFamily: FONTS.bold,
    },
    // Updated Header V2
    headerV2: {
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 20,
        backgroundColor: COLORS.white,
        ...SHADOWS.sm,
    },
    topRowV2: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    addressContainerV2: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    locationCircleV2: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    addressTextWrapperV2: {
        flex: 1,
    },
    deliverToV2: {
        fontSize: 10,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
        letterSpacing: 0.5,
    },
    locationNameRowV2: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    locationNameV2: {
        fontSize: 16,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        maxWidth: '80%',
    },
    profileBtnV2: {
        padding: 2,
    },
    searchBarV2: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.sm,
    },
    placeholderV2: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        fontFamily: FONTS.medium,
        color: COLORS.textLight,
    },
    searchDividerV2: {
        width: 1,
        height: 20,
        backgroundColor: COLORS.borderLight,
        marginHorizontal: 10,
    },
    favBtnV2: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.3)',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContentV2: {
        padding: 16,
    },
    cardHeaderV2: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardTitleV2: {
        fontSize: 18,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        flex: 1,
    },
    cardSubtitleV2: {
        fontSize: 13,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
        marginBottom: 12,
    },
    cardMetricsV2: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cartViewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    // Trending Section
    trendingSection: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 14,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
    },
    trendingList: {
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    trendingCard: {
        width: 260,
        height: 160,
        marginRight: 16,
        borderRadius: 20,
        overflow: 'hidden',
        ...SHADOWS.md,
        backgroundColor: COLORS.white,
    },
    trendingImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    trendingOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    trendingContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
    },
    trendingName: {
        color: COLORS.white,
        fontSize: 18,
        fontFamily: FONTS.bold,
        marginBottom: 4,
    },
    trendingMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trendingRating: {
        color: COLORS.white,
        fontSize: 12,
        fontFamily: FONTS.bold,
        marginLeft: 4,
    },
    trendingTime: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontFamily: FONTS.regular,
    },
    trendingBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    trendingBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontFamily: FONTS.bold,
    },
    metricItemV2: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metricTextV2: {
        fontSize: 12,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
    },
    metricDotV2: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: COLORS.textLight,
        marginHorizontal: 10,
    },
    priceTextV2: {
        fontSize: 14,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
    },

    fabCart: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
        ...SHADOWS.gold,
        gap: 12,
    },
    fabContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    fabCount: {
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    fabCountText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 12,
    },
    fabText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Quick Actions
    quickModalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    quickActionsContainer: {
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 20,
        ...SHADOWS.lg,
    },
    quickActionsTitle: {
        fontSize: 18,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 20,
    },
    quickActionsList: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
    },
    quickActionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    quickActionText: {
        fontSize: 16,
        fontFamily: FONTS.medium,
        color: COLORS.textPrimary,
    },
    quickCloseBtn: {
        padding: 12,
        alignItems: 'center',
    },
    quickCloseText: {
        fontSize: 16,
        fontFamily: FONTS.bold,
        color: COLORS.textSecondary,
    },
});
