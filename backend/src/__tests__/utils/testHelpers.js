const db = require('../config/db');
const { calculateDistance } = require('../utils/helpers');

/**
 * Test Utilities for Delivery Partner Assignment Tests
 * Following TDD principles: Real database, minimal mocking
 */

class TestDataBuilder {
    constructor() {
        this.client = null;
    }

    async init() {
        this.client = await db.getClient();
        await this.client.query('BEGIN');
    }

    async cleanup() {
        if (this.client) {
            await this.client.query('ROLLBACK');
            this.client.release();
        }
    }

    /**
     * Create a test restaurant
     */
    async createRestaurant({ lat, lng, name = 'Test Restaurant' }) {
        const result = await this.client.query(`
            INSERT INTO restaurants (name, lat, lng, address, phone, cuisine_type, is_active, is_verified)
            VALUES ($1, $2, $3, '123 Test St', '1234567890', 'Test Cuisine', true, true)
            RETURNING *
        `, [name, lat, lng]);
        return result.rows[0];
    }

    /**
     * Create a test user
     */
    async createUser({ email, role = 'delivery_partner' }) {
        const result = await this.client.query(`
            INSERT INTO users (email, name, phone, role, is_verified)
            VALUES ($1, 'Test User', '1234567890', $2, true)
            RETURNING *
        `, [email, role]);
        return result.rows[0];
    }

    /**
     * Create a test delivery partner
     */
    async createDeliveryPartner({
        userId,
        lat,
        lng,
        isOnline = true,
        isVerified = true
    }) {
        const result = await this.client.query(`
            INSERT INTO delivery_partners (
                user_id, vehicle_type, vehicle_number, current_lat, current_lng,
                is_online, is_verified, total_deliveries, total_earnings
            )
            VALUES ($1, 'bike', 'TEST123', $2, $3, $4, $5, 0, 0)
            RETURNING *
        `, [userId, lat, lng, isOnline, isVerified]);
        return result.rows[0];
    }

    /**
     * Create a test order
     */
    async createOrder({
        userId,
        restaurantId,
        deliveryLat,
        deliveryLng,
        status = 'confirmed'
    }) {
        const orderNumber = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const result = await this.client.query(`
            INSERT INTO orders (
                user_id, restaurant_id, order_number, status,
                delivery_address, delivery_lat, delivery_lng,
                total, delivery_fee, distance_km, payment_status
            )
            VALUES ($1, $2, $3, $4, '123 Delivery St', $5, $6, 500, 50, 5, 'completed')
            RETURNING *
        `, [userId, restaurantId, orderNumber, status, deliveryLat, deliveryLng]);
        return result.rows[0];
    }

    /**
     * Create a delivery assignment
     */
    async createAssignment({ orderId, partnerId, status = 'assigned' }) {
        const result = await this.client.query(`
            INSERT INTO delivery_assignments (order_id, partner_id, status)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [orderId, partnerId, status]);
        return result.rows[0];
    }

    /**
     * Get assignment count for a partner
     */
    async getAssignmentCount(partnerId, statuses = ['assigned', 'accepted', 'picked_up']) {
        const result = await this.client.query(`
            SELECT COUNT(*) as count
            FROM delivery_assignments
            WHERE partner_id = $1 AND status = ANY($2)
        `, [partnerId, statuses]);
        return parseInt(result.rows[0].count);
    }

    /**
     * Get all assignments for an order
     */
    async getAssignmentsForOrder(orderId) {
        const result = await this.client.query(`
            SELECT * FROM delivery_assignments WHERE order_id = $1
        `, [orderId]);
        return result.rows;
    }

    /**
     * Get notification for a user
     */
    async getNotifications(userId, type = 'new_assignment') {
        const result = await this.client.query(`
            SELECT * FROM notifications 
            WHERE user_id = $1 AND type = $2
            ORDER BY created_at DESC
        `, [userId, type]);
        return result.rows;
    }
}

/**
 * Mock Socket.IO for testing
 */
class MockSocketIO {
    constructor() {
        this.emissions = [];
    }

    to(room) {
        return {
            emit: (event, data) => {
                this.emissions.push({ room, event, data });
            }
        };
    }

    getEmissions(room = null, event = null) {
        let filtered = this.emissions;
        if (room) filtered = filtered.filter(e => e.room === room);
        if (event) filtered = filtered.filter(e => e.event === event);
        return filtered;
    }

    clear() {
        this.emissions = [];
    }
}

module.exports = {
    TestDataBuilder,
    MockSocketIO
};
