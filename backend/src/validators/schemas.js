const Joi = require('joi');

// ============ AUTH SCHEMAS ============

const registerSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/).optional(),
    role: Joi.string().valid('customer', 'restaurant_owner', 'delivery_partner').default('customer'),
    referralCode: Joi.string().optional(),
});

const adminLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

// ============ USER SCHEMAS ============

const updateProfileSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    avatar_url: Joi.string().uri().optional(),
    notification_preferences: Joi.object({
        orders: Joi.boolean().default(true),
        promotions: Joi.boolean().default(true),
        updates: Joi.boolean().default(true),
    }).optional(),
});

const addressSchema = Joi.object({
    label: Joi.string().valid('home', 'work', 'other').required(),
    full_address: Joi.string().min(5).max(500).required(),
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    landmark: Joi.string().max(200).allow('').optional(),

    is_default: Joi.boolean().default(false),
});

// ============ RESTAURANT SCHEMAS ============

const createRestaurantSchema = Joi.object({
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(1000).optional(),
    address: Joi.string().min(5).max(500).required(),
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    phone: Joi.string().required(),
    cuisine_type: Joi.array().items(Joi.string()).min(1).required(), // Changed from cuisine_types
    image_url: Joi.string().uri().optional(), // Added
    is_veg_only: Joi.boolean().default(false),
    min_order_amount: Joi.number().min(0).default(0),
    avg_prep_time_mins: Joi.number().min(5).max(120).default(20),
    delivery_radius_km: Joi.number().min(1).max(50).default(10),
    operating_hours: Joi.object().pattern(
        Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
        Joi.object({
            open: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
            close: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
            is_closed: Joi.boolean().default(false),
        })
    ).optional(),
    bank_details: Joi.object({
        account_name: Joi.string().required(),
        account_number: Joi.string().required(),
        ifsc_code: Joi.string().required(),
        bank_name: Joi.string().required(),
    }).optional(),
});

const updateRestaurantSchema = createRestaurantSchema.fork(
    ['name', 'address', 'lat', 'lng', 'phone', 'cuisine_type'],
    (field) => field.optional()
);

// ============ MENU SCHEMAS ============

const menuCategorySchema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    sort_order: Joi.number().integer().min(0).default(0),
    is_active: Joi.boolean().default(true),
});

const menuItemSchema = Joi.object({
    category_id: Joi.string().required(),
    name: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(500).optional(),
    price: Joi.number().min(0).required(),
    image_url: Joi.string().uri().optional(),
    is_veg: Joi.boolean().default(true),
    is_available: Joi.boolean().default(true),
    sort_order: Joi.number().integer().min(0).default(0),
    customizations: Joi.array().items(
        Joi.object({
            group_name: Joi.string().required(),
            type: Joi.string().valid('single', 'multiple').required(),
            is_required: Joi.boolean().default(false),
            max_selections: Joi.number().integer().min(1).default(1),
            options: Joi.array().items(
                Joi.object({
                    name: Joi.string().required(),
                    price: Joi.number().min(0).default(0),
                })
            ).min(1).required(),
        })
    ).optional(),
});

// ============ ORDER SCHEMAS ============

const createOrderSchema = Joi.object({
    restaurant_id: Joi.string().required(),
    address_id: Joi.string().required(),
    items: Joi.array().items(
        Joi.object({
            item_id: Joi.string().required(),
            quantity: Joi.number().integer().min(1).required(),
            customizations: Joi.array().items(
                Joi.object({
                    group_name: Joi.string().required(),
                    selected_options: Joi.array().items(
                        Joi.object({
                            name: Joi.string().required(),
                            price: Joi.number().min(0).required(),
                        })
                    ).required(),
                })
            ).optional(),
        })
    ).min(1).required(),
    payment_method: Joi.string().valid('cod', 'razorpay', 'wallet').required(),
    promo_code: Joi.string().optional(),
    tip: Joi.number().min(0).default(0),
    special_instructions: Joi.string().max(500).optional(),
});

const updateOrderStatusSchema = Joi.object({
    status: Joi.string().valid(
        'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way', 'delivered', 'cancelled'
    ).required(),
    estimated_prep_mins: Joi.number().integer().min(1).optional(),
    cancellation_reason: Joi.string().max(500).optional(),
});

// ============ REVIEW SCHEMAS ============

const reviewSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().max(1000).optional(),
});

// ============ PROMO SCHEMAS ============

const promoCodeSchema = Joi.object({
    code: Joi.string().min(3).max(20).uppercase().required(),
    type: Joi.string().valid('percentage', 'flat').required(),
    value: Joi.number().positive().required(),
    min_order: Joi.number().min(0).default(0),
    max_discount: Joi.number().min(0).default(0),
    usage_limit: Joi.number().integer().min(0).default(0),
    valid_from: Joi.date().iso().required(),
    valid_until: Joi.date().iso().greater(Joi.ref('valid_from')).required(),
    is_active: Joi.boolean().default(true),
    applicable_restaurants: Joi.array().items(Joi.string()).optional(),
    first_order_only: Joi.boolean().default(false),
    description: Joi.string().max(500).optional(),
});

// ============ DELIVERY PARTNER SCHEMAS ============

const deliveryPartnerSchema = Joi.object({
    vehicle_type: Joi.string().valid('bicycle', 'motorcycle', 'scooter', 'car').required(),
    vehicle_number: Joi.string().required(),
    license_url: Joi.string().optional().allow(''), // Allow text/number for now
    id_proof_url: Joi.string().optional().allow(''),
    zone: Joi.string().optional(),
    bank_details: Joi.object({
        account_name: Joi.string().required(),
        account_number: Joi.string().required(),
        ifsc_code: Joi.string().required(),
        bank_name: Joi.string().required(),
    }).optional(),
});

const updateLocationSchema = Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
});

// ============ SUPPORT SCHEMAS ============

const supportTicketSchema = Joi.object({
    order_id: Joi.string().optional(),
    subject: Joi.string().min(5).max(200).required(),
    message: Joi.string().min(10).max(2000).required(),
    category: Joi.string().valid('order', 'payment', 'delivery', 'app', 'other').required(),
});

const ticketReplySchema = Joi.object({
    message: Joi.string().min(1).max(2000).required(),
});

// ============ QUERY SCHEMAS ============

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort_by: Joi.string().optional(),
    sort_order: Joi.string().valid('asc', 'desc').default('desc'),
});

const restaurantFilterSchema = paginationSchema.keys({
    search: Joi.string().optional(),
    cuisine: Joi.string().optional(),
    is_veg_only: Joi.boolean().optional(),
    rating_min: Joi.number().min(0).max(5).optional(),
    lat: Joi.number().min(-90).max(90).optional(),
    lng: Joi.number().min(-180).max(180).optional(),
    radius_km: Joi.number().min(1).max(50).default(10),
});

const orderFilterSchema = paginationSchema.keys({
    status: Joi.string().optional(),
    restaurant_id: Joi.string().optional(),
    from_date: Joi.date().iso().optional(),
    to_date: Joi.date().iso().optional(),
});

// ============ BANNER SCHEMA ============

const bannerSchema = Joi.object({
    title: Joi.string().max(200).required(),
    image_url: Joi.string().uri().required(),
    link_type: Joi.string().valid('restaurant', 'promo', 'external', 'none').default('none'),
    link_value: Joi.string().optional(),
    sort_order: Joi.number().integer().min(0).default(0),
    is_active: Joi.boolean().default(true),
});

// ============ PLATFORM SETTINGS SCHEMA ============

const platformSettingsSchema = Joi.object({
    commission_percentage: Joi.number().min(0).max(100).optional(),
    delivery_base_fee: Joi.number().min(0).optional(),
    delivery_per_km_fee: Joi.number().min(0).optional(),
    max_delivery_radius_km: Joi.number().min(1).optional(),
    tax_percentage: Joi.number().min(0).max(100).optional(),
    min_order_amount: Joi.number().min(0).optional(),
    referral_bonus: Joi.number().min(0).optional(),
    wallet_max_balance: Joi.number().min(0).optional(),
});

module.exports = {
    registerSchema,
    adminLoginSchema,
    updateProfileSchema,
    addressSchema,
    createRestaurantSchema,
    updateRestaurantSchema,
    menuCategorySchema,
    menuItemSchema,
    createOrderSchema,
    updateOrderStatusSchema,
    reviewSchema,
    promoCodeSchema,
    deliveryPartnerSchema,
    updateLocationSchema,
    supportTicketSchema,
    ticketReplySchema,
    paginationSchema,
    restaurantFilterSchema,
    orderFilterSchema,
    bannerSchema,
    platformSettingsSchema,
};
