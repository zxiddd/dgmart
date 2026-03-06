import React, { useState, useEffect, useRef, memo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, StatusBar, Animated, Alert, Modal, Platform } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../src/config/theme';
import { restaurantAPI } from '../../src/services/api';
import { useCartStore } from '../../src/store/cartStore';
import { useRestaurantStore } from '../../src/store/restaurantStore';
import Toast from 'react-native-toast-message';

const MenuItem = memo(({ item, count, onAdd, onRemove }) => (
    <View style={styles.menuItemV2}>
        <View style={styles.menuItemInfoV2}>
            <View style={styles.itemMetaRowV3}>
                <View style={[styles.vegIconV2, { borderColor: item.is_veg ? COLORS.veg : COLORS.nonVeg }]}>
                    <View style={[styles.vegCircleV2, { backgroundColor: item.is_veg ? COLORS.veg : COLORS.nonVeg }]} />
                </View>
                {item.is_bestseller && (
                    <View style={styles.badgeV3}>
                        <MaterialIcons name="star" size={10} color="#FFC107" />
                        <Text style={[styles.badgeTextV3, { color: '#FFC107' }]}>Bestseller</Text>
                    </View>
                )}
                {item.is_spicy && (
                    <View style={[styles.badgeV3, { backgroundColor: '#FFF5F5', borderColor: '#FFEBEE' }]}>
                        <MaterialIcons name="whatshot" size={10} color="#F44336" />
                        <Text style={[styles.badgeTextV3, { color: '#F44336' }]}>Spicy</Text>
                    </View>
                )}
                {item.is_new && (
                    <View style={[styles.badgeV3, { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' }]}>
                        <MaterialIcons name="fiber-new" size={12} color="#4CAF50" />
                        <Text style={[styles.badgeTextV3, { color: '#4CAF50' }]}>New</Text>
                    </View>
                )}
            </View>
            <Text style={styles.menuItemNameV2}>{item.name}</Text>
            <Text style={styles.menuItemPriceV2}>₹{item.price}</Text>
            {item.description ? (
                <Text style={styles.menuItemDescV2} numberOfLines={2}>{item.description}</Text>
            ) : null}
        </View>
        <View style={styles.menuItemImageContainerV2}>
            <ExpoImage
                source={{ uri: item.image_url || 'https://placehold.co/200x200/F3E5AB/D4AF37?text=Food' }}
                style={styles.menuItemImageV2}
                contentFit="cover"
                transition={200}
            />
            <View style={styles.addBtnContainerV2}>
                {count > 0 ? (
                    <View style={styles.qtySelectorV2}>
                        <TouchableOpacity onPress={onRemove} style={styles.qtyActionV2}>
                            <MaterialIcons name="remove" size={18} color={COLORS.white} />
                        </TouchableOpacity>
                        <Text style={styles.qtyValueV2}>{count}</Text>
                        <TouchableOpacity onPress={onAdd} style={styles.qtyActionV2}>
                            <MaterialIcons name="add" size={18} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity onPress={onAdd} style={styles.addBtnV2}>
                        <MaterialIcons name="add" size={18} color={COLORS.white} />
                        <Text style={styles.addBtnTextV2}>ADD</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    </View>
));

export default function RestaurantDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    // Correct Store Usage
    const cartItems = useCartStore(state => state.items);
    const cartRestaurantId = useCartStore(state => state.restaurantId);
    const addItem = useCartStore(state => state.addItem);
    const updateQuantity = useCartStore(state => state.updateQuantity);
    const removeItem = useCartStore(state => state.removeItem);
    const clearCart = useCartStore(state => state.clearCart);

    // Cache Store
    const setCachedRestaurant = useRestaurantStore(state => state.setRestaurant);
    const getCachedRestaurant = useRestaurantStore(state => state.getRestaurant);

    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState(null);
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [categoryLayouts, setCategoryLayouts] = useState({});
    const scrollY = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef(null);

    useEffect(() => {
        const fetchRestaurant = async (isBackground = false) => {
            if (!isBackground) setLoading(true);
            try {
                // Check Cache first
                const cache = getCachedRestaurant(id);
                if (cache && !isBackground) {
                    setRestaurant(cache);
                    setLoading(false);
                    // Still fetch in background to refresh
                    fetchRestaurant(true);
                    return;
                }

                const res = await restaurantAPI.getById(id);
                if (res.success && res.data) {
                    const { restaurant: restData, menu } = res.data;

                    const formattedRestaurant = {
                        ...restData,
                        menu_categories: menu || [],
                        menu_items: menu ? menu.flatMap(cat => cat.items || []) : [],
                        avg_delivery_time_mins: restData.avg_prep_time_mins || 30,
                        delivery_fee: restData.delivery_fee ?? 20,
                        rating: restData.rating || 'New'
                    };

                    setRestaurant(formattedRestaurant);
                    setCachedRestaurant(id, formattedRestaurant);
                    if (menu && menu.length > 0) {
                        setActiveCategory(menu[0].name);
                    }
                } else {
                    throw new Error(res.message || 'Failed to load');
                }
            } catch (err) {
                if (!isBackground) {
                    // Mock data fallback...
                    const mock = {
                        id: id,
                        name: 'Biryani Palace',
                        rating: 4.5,
                        total_reviews: '1K+',
                        cuisine_type: ['Biryani', 'North Indian'],
                        address: 'Near Bus Stand, Degloor',
                        delivery_fee: 20,
                        avg_delivery_time_mins: 35,
                        image_url: 'https://placehold.co/600x400/D4AF37/FFFFFF?text=Biryani+Palace',
                        menu_categories: [
                            { id: 'c1', name: 'Recommended' },
                            { id: 'c2', name: 'Biryani' },
                            { id: 'c3', name: 'Starters' },
                        ],
                        menu_items: [
                            { id: 'm1', category_id: 'c1', name: 'Chicken Dum Biryani', price: 240, is_veg: false, description: 'Authentic Hyderabadi spices', image_url: 'https://placehold.co/200x200/D4AF37/FFFFFF?text=Biryani' },
                            { id: 'm2', category_id: 'c1', name: 'Paneer Tikka', price: 180, is_veg: true, description: 'Spicy cottage cheese', image_url: 'https://placehold.co/200x200/D4AF37/FFFFFF?text=Paneer' },
                            { id: 'm3', category_id: 'c2', name: 'Mutton Biryani', price: 320, is_veg: false, description: 'Tender mutton with basmati rice', image_url: 'https://placehold.co/200x200/D4AF37/FFFFFF?text=Mutton' },
                        ]
                    };
                    setRestaurant(mock);
                }
            } finally {
                if (!isBackground) setLoading(false);
            }
        };
        if (id) fetchRestaurant();
    }, [id]);

    const handleAddItem = (item) => {
        // Check if cart has items from another restaurant
        if (cartRestaurantId && cartRestaurantId !== restaurant.id) {
            Alert.alert(
                'Start new cart?',
                'You have items from another restaurant. Clear cart to add this?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Yes, Clear Cart',
                        onPress: () => {
                            clearCart();
                            addItem(item, restaurant);
                            Toast.show({ type: 'success', text1: 'Cart cleared and item added' });
                        }
                    }
                ]
            );
            return;
        }

        addItem(item, restaurant);
        Toast.show({ type: 'success', text1: 'Item added to cart' });
    };

    const handleRemoveItem = (itemId) => {
        const index = cartItems.findIndex(i => i.id === itemId);
        if (index >= 0) {
            updateQuantity(index, -1);
        }
    };

    const getItemCount = (itemId) => {
        const item = cartItems.find(i => i.id === itemId);
        return item ? item.quantity : 0;
    };

    const cartTotalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);

    const headerHeight = scrollY.interpolate({
        inputRange: [0, 200],
        outputRange: [200, 60],
        extrapolate: 'clamp',
    });

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 150],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const scrollToCategory = (categoryName) => {
        const y = categoryLayouts[categoryName];
        if (y !== undefined) {
            scrollViewRef.current?.scrollTo({
                y: y - 80, // Offset for sticky header
                animated: true,
            });
            setActiveCategory(categoryName);
            setShowMenuModal(false);
        }
    };



    const handleScroll = (event) => {
        const y = event.nativeEvent.contentOffset.y;

        // Find visible category based on layout positions
        let currentCategory = activeCategory;
        Object.keys(categoryLayouts).forEach((catName) => {
            const layoutY = categoryLayouts[catName];
            if (y >= layoutY - 120) { // 120 offset for better detection
                currentCategory = catName;
            }
        });

        if (currentCategory !== activeCategory) {
            setActiveCategory(currentCategory);
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    if (!restaurant) return <View style={styles.center}><Text style={styles.errorText}>Restaurant not found</Text></View>;

    const menuCategories = restaurant.menu_categories || [];
    const menuItems = restaurant.menu_items || [];

    // Group items by category for the full menu view
    const groupedMenu = menuCategories.map(cat => ({
        ...cat,
        items: menuItems.filter(item => item.category_id === cat.id)
    })).filter(group => group.items.length > 0);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Header Image */}
            <Animated.View style={[styles.headerImageContainer, { height: headerHeight }]}>
                <ExpoImage
                    source={{ uri: restaurant.image_url }}
                    style={styles.headerImage}
                    contentFit="cover"
                    transition={300}
                />
                <View style={styles.headerOverlay} />
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
            </Animated.View>

            {/* Sticky Header Title */}
            <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.stickyHeaderTitle} numberOfLines={1}>{restaurant.name}</Text>
                <View style={{ width: 40 }} />
            </Animated.View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                scrollEventThrottle={16}
                onScroll={(e) => {
                    Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })(e);
                    handleScroll(e);
                }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ height: 200 }} />

                <View style={styles.contentContainer}>
                    {/* Restaurant Info */}
                    <View style={styles.infoCard}>
                        <View style={styles.rowBetween}>
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.restaurantName} numberOfLines={1}>{restaurant.name}</Text>
                                {restaurant.is_featured && (
                                    <View style={{ backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                        <Text style={{ fontSize: 10, fontFamily: FONTS.bold, color: '#000' }}>POPULAR</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.ratingBox}>
                                <Text style={styles.ratingText}>{restaurant.rating}</Text>
                                <MaterialIcons name="star" size={14} color={COLORS.white} />
                            </View>
                        </View>
                        <Text style={styles.cuisineText}>{(restaurant.cuisine_type || []).join(' • ')}</Text>
                        <Text style={styles.addressText}>{restaurant.address}</Text>

                        <View style={styles.divider} />

                        <View style={styles.deliveryInfo}>
                            <View style={styles.deliveryItem}>
                                <MaterialIcons name="schedule" size={18} color={COLORS.primary} />
                                <Text style={styles.deliveryText}>{restaurant.avg_delivery_time_mins || 30} mins</Text>
                            </View>
                            <View style={styles.deliveryItem}>
                                <MaterialIcons name="delivery-dining" size={18} color={COLORS.primary} />
                                <Text style={styles.deliveryText}>{restaurant.delivery_fee === 0 ? 'Free Delivery' : `₹${restaurant.delivery_fee} Delivery`}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Menu Categories (Sticky Pills) */}
                    <View style={styles.categoryContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
                            {groupedMenu.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => scrollToCategory(cat.name)}
                                    style={[styles.categoryPill, activeCategory === cat.name && styles.categoryPillActive]}
                                >
                                    <Text style={[styles.categoryText, activeCategory === cat.name && styles.categoryTextActive]}>
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Grouped Menu Sections */}
                    {groupedMenu.map((category) => (
                        <View
                            key={category.id}
                            onLayout={(event) => {
                                const { y } = event.nativeEvent.layout;
                                setCategoryLayouts(prev => ({ ...prev, [category.name]: y + 200 })); // 200 is the header spacer
                            }}
                        >
                            <View style={styles.categoryHeaderV3}>
                                <Text style={styles.categoryTitleV3}>{category.name}</Text>
                                <View style={styles.categoryCountBadgeV3}>
                                    <Text style={styles.categoryCountTextV3}>{category.items?.length || 0}</Text>
                                </View>
                            </View>

                            {category.items.map((item) => (
                                <MenuItem
                                    key={item.id}
                                    item={item}
                                    count={getItemCount(item.id)}
                                    onAdd={() => handleAddItem(item)}
                                    onRemove={() => handleRemoveItem(item.id)}
                                />
                            ))}
                        </View>
                    ))}
                    <View style={{ height: 120 }} />
                </View>
            </ScrollView>

            {/* FLOATING MENU BUTTON */}
            <TouchableOpacity
                style={[styles.menuFloatingBtn, cartTotalItems > 0 && { bottom: 95 }]}
                onPress={() => setShowMenuModal(true)}
                activeOpacity={0.9}
            >
                <BlurView intensity={80} tint="dark" style={styles.menuBtnBlur}>
                    <MaterialIcons name="restaurant-menu" size={20} color={COLORS.white} />
                    <Text style={styles.menuBtnText}>MENU</Text>
                </BlurView>
            </TouchableOpacity>

            {/* CATEGORY JUMP MODAL */}
            <Modal
                visible={showMenuModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowMenuModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMenuModal(false)}
                >
                    <View style={styles.menuModalContent}>
                        <View style={styles.menuModalHeader}>
                            <Text style={styles.menuModalTitle}>Browse Menu</Text>
                            <TouchableOpacity onPress={() => setShowMenuModal(false)}>
                                <MaterialIcons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {groupedMenu.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={styles.menuModalItem}
                                    onPress={() => scrollToCategory(cat.name)}
                                >
                                    <Text style={[styles.menuModalItemText, activeCategory === cat.name && styles.menuModalItemActive]}>
                                        {cat.name}
                                    </Text>
                                    <Text style={styles.menuModalItemCount}>{cat.items.length}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {cartTotalItems > 0 && (
                <TouchableOpacity style={styles.floatingCart} onPress={() => router.push('/cart')}>
                    <View>
                        <Text style={styles.cartCount}>{cartTotalItems} ITEMS</Text>
                        <Text style={styles.cartSubtext}>Extra charges may apply</Text>
                    </View>
                    <View style={styles.cartViewBtn}>
                        <Text style={styles.cartViewText}>View Cart</Text>
                        <MaterialIcons name="arrow-right" size={20} color={COLORS.white} />
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    errorText: { color: COLORS.error, fontFamily: FONTS.medium },
    headerImageContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
    },
    headerImage: { width: '100%', height: '100%' },
    headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
    backButton: { position: 'absolute', top: 40, left: 20, zIndex: 2, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: COLORS.white,
        zIndex: 10,
        paddingTop: 40,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
        ...SHADOWS.sm,
    },
    stickyHeaderTitle: { color: COLORS.textPrimary, fontFamily: FONTS.bold, fontSize: SIZES.md, flex: 1, textAlign: 'center' },
    scrollView: { flex: 1 },
    contentContainer: {
        backgroundColor: COLORS.background, // Off-white
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
        paddingTop: 24,
        minHeight: 800,
    },
    infoCard: { paddingHorizontal: SIZES.padding, marginBottom: 20 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    restaurantName: { fontSize: SIZES.xxl, fontFamily: FONTS.bold, color: COLORS.textPrimary, flex: 1 },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.success,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    ratingText: { color: COLORS.white, fontFamily: FONTS.bold, fontSize: SIZES.md },
    cuisineText: { fontSize: SIZES.sm, fontFamily: FONTS.medium, color: COLORS.textSecondary, marginTop: 4 },
    addressText: { fontSize: SIZES.sm, fontFamily: FONTS.regular, color: COLORS.textLight, marginTop: 2 },
    divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 16 },
    deliveryInfo: { flexDirection: 'row', gap: 20 },
    deliveryItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    deliveryText: { color: COLORS.textPrimary, fontFamily: FONTS.bold, fontSize: SIZES.sm },
    categoryContainer: { marginBottom: 20 },
    categoryList: { paddingHorizontal: SIZES.padding, gap: 10 },
    categoryPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        backgroundColor: COLORS.white,
        ...SHADOWS.sm,
    },
    categoryPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    categoryText: { color: COLORS.textSecondary, fontFamily: FONTS.medium, fontSize: SIZES.sm },
    categoryTextActive: { color: COLORS.white, fontFamily: FONTS.bold },
    // Menu Item V2
    menuItemV2: {
        flexDirection: 'row',
        paddingHorizontal: SIZES.padding,
        paddingVertical: 20,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
        justifyContent: 'space-between',
    },
    menuItemInfoV2: {
        flex: 1,
        paddingRight: 16,
    },
    vegIconV2: {
        width: 14,
        height: 14,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    vegCircleV2: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    menuItemNameV2: {
        fontSize: 16,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    menuItemPriceV2: {
        fontSize: 14,
        fontFamily: FONTS.medium,
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    menuItemDescV2: {
        fontSize: 12,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    menuItemImageContainerV2: {
        width: 120,
        height: 120,
        position: 'relative',
    },
    menuItemImageV2: {
        width: 120,
        height: 120,
        borderRadius: 16,
        backgroundColor: COLORS.surfaceLight,
    },
    addBtnContainerV2: {
        position: 'absolute',
        bottom: -12,
        alignSelf: 'center',
        width: 105,
        height: 40,
        backgroundColor: COLORS.success,
        borderRadius: 12,
        ...SHADOWS.lg,
        shadowColor: COLORS.success, // Glowing effect
        shadowOpacity: 0.3,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
    },
    addBtnV2: {
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    addBtnTextV2: {
        color: COLORS.white,
        fontFamily: FONTS.black,
        fontSize: 15,
        letterSpacing: 0.5,
    },
    qtySelectorV2: {
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    qtyActionV2: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyValueV2: {
        fontSize: 16,
        fontFamily: FONTS.black,
        color: COLORS.white,
    },
    cartViewText: { color: COLORS.white, fontFamily: FONTS.bold, fontSize: 14 },

    // Premium Menu V3 Styles
    categoryHeaderV3: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        paddingVertical: 15,
        backgroundColor: '#f8f9fa',
        gap: 12,
    },
    categoryTitleV3: {
        fontSize: 18,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        letterSpacing: 0.5,
    },
    categoryCountBadgeV3: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    categoryCountTextV3: {
        fontSize: 12,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
    itemMetaRowV3: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    badgeV3: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 3,
        borderWidth: 0.5,
        borderColor: '#FFE082',
    },
    badgeTextV3: {
        fontSize: 10,
        fontFamily: FONTS.bold,
        textTransform: 'uppercase',
    },
    menuFloatingBtn: {
        position: 'absolute',
        bottom: 25,
        alignSelf: 'center',
        borderRadius: 30,
        overflow: 'hidden',
        ...SHADOWS.lg,
        elevation: 10,
        zIndex: 100,
    },
    menuBtnBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 12,
        gap: 8,
    },
    menuBtnText: {
        color: COLORS.white,
        fontFamily: FONTS.bold,
        fontSize: 14,
        letterSpacing: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    menuModalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        maxHeight: '70%',
    },
    menuModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 5,
    },
    menuModalTitle: {
        fontSize: 20,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
    },
    menuModalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    menuModalItemText: {
        fontSize: 16,
        fontFamily: FONTS.medium,
        color: COLORS.textPrimary,
    },
    menuModalItemActive: {
        color: COLORS.primary,
        fontFamily: FONTS.bold,
    },
    menuModalItemCount: {
        fontSize: 14,
        fontFamily: FONTS.regular,
        color: COLORS.textLight,
    },
    floatingCart: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: COLORS.success,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...SHADOWS.lg,
    },
    cartCount: { color: COLORS.white, fontFamily: FONTS.bold, fontSize: 12 },
    cartSubtext: { color: 'rgba(255,255,255,0.8)', fontFamily: FONTS.regular, fontSize: 10 },
    cartViewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
