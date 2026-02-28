// Order statuses
const ORDER_STATUS = {
    PLACED: 'placed',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY: 'ready',
    PICKED_UP: 'picked_up',
    ON_THE_WAY: 'on_the_way',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
    SEARCHING_RIDER: 'searching_rider',
};

// Payment statuses
const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
};

// Payment methods
const PAYMENT_METHOD = {
    COD: 'cod',
    RAZORPAY: 'razorpay',
    WALLET: 'wallet',
    ONLINE: 'online',
};

// User roles
const USER_ROLES = {
    CUSTOMER: 'customer',
    RESTAURANT_OWNER: 'restaurant_owner',
    DELIVERY_PARTNER: 'delivery_partner',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin',
};

// Delivery statuses
const DELIVERY_STATUS = {
    PENDING: 'pending',
    ASSIGNED: 'assigned',
    ACCEPTED: 'accepted',
    PICKED_UP: 'picked_up',
    ON_THE_WAY: 'on_the_way',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
};

// Restaurant statuses
const RESTAURANT_STATUS = {
    PENDING_APPROVAL: 'pending_approval',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
};

// Payout statuses
const PAYOUT_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
};

// Ticket statuses
const TICKET_STATUS = {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
};

// Firebase collections
const COLLECTIONS = {
    USERS: 'users',
    RESTAURANTS: 'restaurants',
    MENU_CATEGORIES: 'menu_categories',
    MENU_ITEMS: 'menu_items',
    ORDERS: 'orders',
    ORDER_ITEMS: 'order_items',
    DELIVERY_PARTNERS: 'delivery_partners',
    DELIVERY_ASSIGNMENTS: 'delivery_assignments',
    ADDRESSES: 'addresses',
    PAYMENTS: 'payments',
    REVIEWS: 'reviews',
    PROMO_CODES: 'promo_codes',
    WALLET_TRANSACTIONS: 'wallet_transactions',
    PAYOUTS: 'payouts',
    SUPPORT_TICKETS: 'support_tickets',
    TICKET_MESSAGES: 'ticket_messages',
    NOTIFICATIONS: 'notifications',
    FAVORITES: 'favorites',
    BANNERS: 'banners',
    PLATFORM_SETTINGS: 'platform_settings',
};

module.exports = {
    ORDER_STATUS,
    PAYMENT_STATUS,
    PAYMENT_METHOD,
    USER_ROLES,
    DELIVERY_STATUS,
    RESTAURANT_STATUS,
    PAYOUT_STATUS,
    TICKET_STATUS,
    COLLECTIONS,
};
