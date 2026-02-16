const crypto = require('crypto');

/**
 * Format timestamp (keep generic)
 */
const formatTimestamp = (date) => {
    return new Date(date).toISOString();
};

/**
 * Calculate distance between two points in km
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return null;

    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return parseFloat(d.toFixed(2));
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

/**
 * Generate a referral code from name
 */
const generateReferralCode = (name) => {
    const prefix = name ? name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X') : 'USER';
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
};

/**
 * Generate a unique order number like DM-20260212-XXXX
 */
const generateOrderNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `DM-${dateStr}-${random}`;
};

/**
 * Generate a unique promo code
 */
const generatePromoCode = (prefix = 'DEGLOOR') => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${random}`;
};

/**
 * Calculate delivery fee based on distance
 */
const calculateDeliveryFee = (distanceKm) => {
    const baseFee = 20; // ₹20 base
    const perKmRate = 8; // ₹8 per km
    const fee = baseFee + (distanceKm * perKmRate);
    return Math.round(fee * 100) / 100;
};

/**
 * Calculate estimated delivery time in minutes
 */
const estimateDeliveryTime = (distanceKm, prepTimeMins = 15) => {
    const avgSpeedKmPerMin = 0.5; // ~30 km/h
    const travelTime = Math.ceil(distanceKm / avgSpeedKmPerMin);
    return prepTimeMins + travelTime + 5; // +5 buffer
};

/**
 * Format currency
 */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
};

module.exports = {
    formatTimestamp,
    calculateDistance,
    generateReferralCode,
    generateOrderNumber,
    generatePromoCode,
    calculateDeliveryFee,
    estimateDeliveryTime,
    formatCurrency
};
