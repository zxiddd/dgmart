/**
 * TDD Tests for Delivery Partner Assignment Logic
 * Following @test-driven-development skill principles
 * 
 * Test Strategy:
 * - Use real database (no DB mocking)
 * - Each test is independent
 * - Tests written BEFORE implementation changes
 * - One behavior per test
 */

const { TestDataBuilder, MockSocketIO } = require('./utils/testHelpers');
const { calculateDistance } = require('../utils/helpers');

// Import the function we're testing
// Note: We'll need to export assignDeliveryPartner from orderController
const orderController = require('../controllers/orderController');

describe('Delivery Partner Assignment Logic', () => {
    let testBuilder;
    let mockSocket;
    let originalIO;

    beforeEach(async () => {
        testBuilder = new TestDataBuilder();
        await testBuilder.init();

        // Mock socket.io
        mockSocket = new MockSocketIO();
        originalIO = global.io;
        global.io = mockSocket;
    });

    afterEach(async () => {
        await testBuilder.cleanup();
        global.io = originalIO;
    });

    describe('Core Assignment Logic', () => {
        test('assigns order to nearest idle rider when multiple idle riders available', async () => {
            // ARRANGE: Create restaurant and 3 idle riders at different distances
            const restaurant = await testBuilder.createRestaurant({
                lat: 18.0,
                lng: 77.0,
                name: 'Test Restaurant'
            });

            const customer = await testBuilder.createUser({
                email: 'customer@test.com',
                role: 'customer'
            });

            const order = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: restaurant.id,
                deliveryLat: 18.05,
                deliveryLng: 77.05
            });

            // Create 3 idle riders at 2km, 5km, and 8km from restaurant
            const rider1User = await testBuilder.createUser({ email: 'rider1@test.com' });
            const rider1 = await testBuilder.createDeliveryPartner({
                userId: rider1User.id,
                lat: 18.018, // ~2km from restaurant
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });

            const rider2User = await testBuilder.createUser({ email: 'rider2@test.com' });
            const rider2 = await testBuilder.createDeliveryPartner({
                userId: rider2User.id,
                lat: 18.045, // ~5km from restaurant
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });

            const rider3User = await testBuilder.createUser({ email: 'rider3@test.com' });
            const rider3 = await testBuilder.createDeliveryPartner({
                userId: rider3User.id,
                lat: 18.072, // ~8km from restaurant
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });

            // ACT: Call assignment function
            await orderController.assignDeliveryPartner(order.id, order, testBuilder.client);

            // ASSERT: Should assign to nearest rider (rider1)
            const assignments = await testBuilder.getAssignmentsForOrder(order.id);
            expect(assignments).toHaveLength(1);
            expect(assignments[0].partner_id).toBe(rider1User.id);
            expect(assignments[0].status).toBe('assigned');
        });

        test('prioritizes idle rider over busy rider even if busy rider is closer', async () => {
            // ARRANGE
            const restaurant = await testBuilder.createRestaurant({ lat: 18.0, lng: 77.0 });
            const customer = await testBuilder.createUser({ email: 'customer@test.com', role: 'customer' });
            const order = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: restaurant.id,
                deliveryLat: 18.05,
                deliveryLng: 77.05
            });

            // Idle rider at 5km
            const idleRiderUser = await testBuilder.createUser({ email: 'idle@test.com' });
            const idleRider = await testBuilder.createDeliveryPartner({
                userId: idleRiderUser.id,
                lat: 18.045, // ~5km
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });

            // Busy rider at 2km (closer but has 1 active order)
            const busyRiderUser = await testBuilder.createUser({ email: 'busy@test.com' });
            const busyRider = await testBuilder.createDeliveryPartner({
                userId: busyRiderUser.id,
                lat: 18.018, // ~2km (closer!)
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });

            // Create active order for busy rider (0.5km from dropoff)
            const busyOrder = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: restaurant.id,
                deliveryLat: 18.0225, // 0.5km from busy rider's current location
                deliveryLng: 77.0,
                status: 'picked_up'
            });
            await testBuilder.createAssignment({
                orderId: busyOrder.id,
                partnerId: busyRiderUser.id,
                status: 'picked_up'
            });

            // ACT
            await orderController.assignDeliveryPartner(order.id, order, testBuilder.client);

            // ASSERT: Should assign to idle rider despite being farther
            const assignments = await testBuilder.getAssignmentsForOrder(order.id);
            expect(assignments).toHaveLength(1);
            expect(assignments[0].partner_id).toBe(idleRiderUser.id);
        });

        test('skips riders with 2 or more active orders', async () => {
            // ARRANGE
            const restaurant = await testBuilder.createRestaurant({ lat: 18.0, lng: 77.0 });
            const customer = await testBuilder.createUser({ email: 'customer@test.com', role: 'customer' });
            const order = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: restaurant.id,
                deliveryLat: 18.05,
                deliveryLng: 77.05
            });

            // Rider with 2 active orders at 1km (very close!)
            const busyRiderUser = await testBuilder.createUser({ email: 'verybusy@test.com' });
            const busyRider = await testBuilder.createDeliveryPartner({
                userId: busyRiderUser.id,
                lat: 18.009, // ~1km
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });

            // Create 2 active orders
            const order1 = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: restaurant.id,
                deliveryLat: 18.01,
                deliveryLng: 77.0,
                status: 'picked_up'
            });
            const order2 = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: restaurant.id,
                deliveryLat: 18.02,
                deliveryLng: 77.0,
                status: 'accepted'
            });
            await testBuilder.createAssignment({ orderId: order1.id, partnerId: busyRiderUser.id, status: 'picked_up' });
            await testBuilder.createAssignment({ orderId: order2.id, partnerId: busyRiderUser.id, status: 'accepted' });

            // Idle rider at 10km (far!)
            const idleRiderUser = await testBuilder.createUser({ email: 'idle@test.com' });
            const idleRider = await testBuilder.createDeliveryPartner({
                userId: idleRiderUser.id,
                lat: 18.09, // ~10km
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });

            // ACT
            await orderController.assignDeliveryPartner(order.id, order, testBuilder.client);

            // ASSERT: Should skip busy rider and assign to idle rider
            const assignments = await testBuilder.getAssignmentsForOrder(order.id);
            expect(assignments).toHaveLength(1);
            expect(assignments[0].partner_id).toBe(idleRiderUser.id);
        });
    });

    describe('"Almost There" Logic', () => {
        test('assigns to busy rider within 1.5km of current dropoff when no idle riders available', async () => {
            // ARRANGE
            const restaurant = await testBuilder.createRestaurant({ lat: 18.0, lng: 77.0 });
            const customer = await testBuilder.createUser({ email: 'customer@test.com', role: 'customer' });
            const newOrder = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: restaurant.id,
                deliveryLat: 18.05,
                deliveryLng: 77.05
            });

            // Busy rider at 3km from restaurant, 1km from current dropoff
            const busyRiderUser = await testBuilder.createUser({ email: 'busy@test.com' });
            const busyRider = await testBuilder.createDeliveryPartner({
                userId: busyRiderUser.id,
                lat: 18.027, // ~3km from restaurant
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });

            // Create active order with dropoff 1km away from rider
            const activeOrder = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: restaurant.id,
                deliveryLat: 18.036, // ~1km from rider's current position
                deliveryLng: 77.0,
                status: 'picked_up'
            });
            await testBuilder.createAssignment({
                orderId: activeOrder.id,
                partnerId: busyRiderUser.id,
                status: 'picked_up'
            });

            // ACT
            await orderController.assignDeliveryPartner(newOrder.id, newOrder, testBuilder.client);

            // ASSERT: Should assign to busy rider (score = 3 + 2 = 5km)
            const assignments = await testBuilder.getAssignmentsForOrder(newOrder.id);
            expect(assignments).toHaveLength(1);
            expect(assignments[0].partner_id).toBe(busyRiderUser.id);
        });

        test('skips busy rider more than 1.5km from current dropoff', async () => {
            // ARRANGE
            const restaurant = await testBuilder.createRestaurant({ lat: 18.0, lng: 77.0 });
            const customer = await testBuilder.createUser({ email: 'customer@test.com', role: 'customer' });
            const newOrder = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: restaurant.id,
                deliveryLat: 18.05,
                deliveryLng: 77.05
            });

            // Busy rider at 2km from restaurant, but 2km from current dropoff (too far!)
            const busyRiderUser = await testBuilder.createUser({ email: 'busy@test.com' });
            const busyRider = await testBuilder.createDeliveryPartner({
                userId: busyRiderUser.id,
                lat: 18.018, // ~2km from restaurant
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });

            // Create active order with dropoff 2km away (exceeds 1.5km threshold)
            const activeOrder = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: restaurant.id,
                deliveryLat: 18.036, // ~2km from rider
                deliveryLng: 77.0,
                status: 'picked_up'
            });
            await testBuilder.createAssignment({
                orderId: activeOrder.id,
                partnerId: busyRiderUser.id,
                status: 'picked_up'
            });

            // Idle rider at 10km
            const idleRiderUser = await testBuilder.createUser({ email: 'idle@test.com' });
            const idleRider = await testBuilder.createDeliveryPartner({
                userId: idleRiderUser.id,
                lat: 18.09, // ~10km
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });

            // ACT
            await orderController.assignDeliveryPartner(newOrder.id, newOrder, testBuilder.client);

            // ASSERT: Should skip busy rider and assign to idle rider
            const assignments = await testBuilder.getAssignmentsForOrder(newOrder.id);
            expect(assignments).toHaveLength(1);
            expect(assignments[0].partner_id).toBe(idleRiderUser.id);
        });

        test('applies 2km penalty to busy riders who are almost done', async () => {
            // ARRANGE
            const restaurant = await testBuilder.createRestaurant({ lat: 18.0, lng: 77.0 });
            const customer = await testBuilder.createUser({ email: 'customer@test.com', role: 'customer' });
            const newOrder = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: restaurant.id,
                deliveryLat: 18.05,
                deliveryLng: 77.05
            });

            // Busy rider at 3km from restaurant, 1km from dropoff (score = 3 + 2 = 5km)
            const busyRiderUser = await testBuilder.createUser({ email: 'busy@test.com' });
            const busyRider = await testBuilder.createDeliveryPartner({
                userId: busyRiderUser.id,
                lat: 18.027, // ~3km from restaurant
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });
            const activeOrder = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: restaurant.id,
                deliveryLat: 18.036, // ~1km from rider
                deliveryLng: 77.0,
                status: 'picked_up'
            });
            await testBuilder.createAssignment({
                orderId: activeOrder.id,
                partnerId: busyRiderUser.id,
                status: 'picked_up'
            });

            // Idle rider at 4.5km (should win: 4.5km < 5km)
            const idleRiderUser = await testBuilder.createUser({ email: 'idle@test.com' });
            const idleRider = await testBuilder.createDeliveryPartner({
                userId: idleRiderUser.id,
                lat: 18.0405, // ~4.5km
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });

            // ACT
            await orderController.assignDeliveryPartner(newOrder.id, newOrder, testBuilder.client);

            // ASSERT: Should assign to idle rider (4.5km < 5km)
            const assignments = await testBuilder.getAssignmentsForOrder(newOrder.id);
            expect(assignments).toHaveLength(1);
            expect(assignments[0].partner_id).toBe(idleRiderUser.id);
        });
    });

    describe('Edge Cases', () => {
        test('handles case when no riders are online and verified', async () => {
            // ARRANGE
            const restaurant = await testBuilder.createRestaurant({ lat: 18.0, lng: 77.0 });
            const customer = await testBuilder.createUser({ email: 'customer@test.com', role: 'customer' });
            const order = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: restaurant.id,
                deliveryLat: 18.05,
                deliveryLng: 77.05
            });

            // Create offline rider
            const offlineRiderUser = await testBuilder.createUser({ email: 'offline@test.com' });
            await testBuilder.createDeliveryPartner({
                userId: offlineRiderUser.id,
                lat: 18.01,
                lng: 77.0,
                isOnline: false, // OFFLINE
                isVerified: true
            });

            // Create unverified rider
            const unverifiedRiderUser = await testBuilder.createUser({ email: 'unverified@test.com' });
            await testBuilder.createDeliveryPartner({
                userId: unverifiedRiderUser.id,
                lat: 18.01,
                lng: 77.0,
                isOnline: true,
                isVerified: false // NOT VERIFIED
            });

            // ACT
            await orderController.assignDeliveryPartner(order.id, order, testBuilder.client);

            // ASSERT: No assignment created
            const assignments = await testBuilder.getAssignmentsForOrder(order.id);
            expect(assignments).toHaveLength(0);
        });

        test('returns early when restaurant does not exist', async () => {
            // ARRANGE
            const customer = await testBuilder.createUser({ email: 'customer@test.com', role: 'customer' });
            const order = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: '00000000-0000-0000-0000-000000000000', // Invalid ID
                deliveryLat: 18.05,
                deliveryLng: 77.05
            });

            const riderUser = await testBuilder.createUser({ email: 'rider@test.com' });
            await testBuilder.createDeliveryPartner({
                userId: riderUser.id,
                lat: 18.01,
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });

            // ACT
            await orderController.assignDeliveryPartner(order.id, order, testBuilder.client);

            // ASSERT: No assignment created
            const assignments = await testBuilder.getAssignmentsForOrder(order.id);
            expect(assignments).toHaveLength(0);
        });

        test('assigns to first rider when multiple riders have identical scores', async () => {
            // ARRANGE
            const restaurant = await testBuilder.createRestaurant({ lat: 18.0, lng: 77.0 });
            const customer = await testBuilder.createUser({ email: 'customer@test.com', role: 'customer' });
            const order = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: restaurant.id,
                deliveryLat: 18.05,
                deliveryLng: 77.05
            });

            // Two riders at exactly 5km
            const rider1User = await testBuilder.createUser({ email: 'rider1@test.com' });
            const rider1 = await testBuilder.createDeliveryPartner({
                userId: rider1User.id,
                lat: 18.045, // ~5km
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });

            const rider2User = await testBuilder.createUser({ email: 'rider2@test.com' });
            const rider2 = await testBuilder.createDeliveryPartner({
                userId: rider2User.id,
                lat: 18.045, // ~5km (same!)
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });

            // ACT
            await orderController.assignDeliveryPartner(order.id, order, testBuilder.client);

            // ASSERT: Should assign to one of them (first in query results)
            const assignments = await testBuilder.getAssignmentsForOrder(order.id);
            expect(assignments).toHaveLength(1);
            expect([rider1User.id, rider2User.id]).toContain(assignments[0].partner_id);
        });
    });

    describe('Database Integration', () => {
        test('creates delivery_assignment record with correct status', async () => {
            // ARRANGE
            const restaurant = await testBuilder.createRestaurant({ lat: 18.0, lng: 77.0 });
            const customer = await testBuilder.createUser({ email: 'customer@test.com', role: 'customer' });
            const order = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: restaurant.id,
                deliveryLat: 18.05,
                deliveryLng: 77.05
            });

            const riderUser = await testBuilder.createUser({ email: 'rider@test.com' });
            await testBuilder.createDeliveryPartner({
                userId: riderUser.id,
                lat: 18.01,
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });

            // ACT
            await orderController.assignDeliveryPartner(order.id, order, testBuilder.client);

            // ASSERT
            const assignments = await testBuilder.getAssignmentsForOrder(order.id);
            expect(assignments).toHaveLength(1);
            expect(assignments[0]).toMatchObject({
                order_id: order.id,
                partner_id: riderUser.id,
                status: 'assigned'
            });
            expect(assignments[0].id).toBeDefined();
        });

        test('creates persistent notification for assigned partner', async () => {
            // ARRANGE
            const restaurant = await testBuilder.createRestaurant({ lat: 18.0, lng: 77.0 });
            const customer = await testBuilder.createUser({ email: 'customer@test.com', role: 'customer' });
            const order = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: restaurant.id,
                deliveryLat: 18.05,
                deliveryLng: 77.05
            });

            const riderUser = await testBuilder.createUser({ email: 'rider@test.com' });
            await testBuilder.createDeliveryPartner({
                userId: riderUser.id,
                lat: 18.01,
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });

            // ACT
            await orderController.assignDeliveryPartner(order.id, order, testBuilder.client);

            // ASSERT
            const notifications = await testBuilder.getNotifications(riderUser.id, 'new_assignment');
            expect(notifications).toHaveLength(1);
            expect(notifications[0]).toMatchObject({
                user_id: riderUser.id,
                title: 'New Order Assigned!',
                type: 'new_assignment'
            });
            expect(notifications[0].body).toContain(restaurant.name);
        });
    });

    describe('Socket Notifications', () => {
        test('emits new_assignment socket event to assigned partner', async () => {
            // ARRANGE
            const restaurant = await testBuilder.createRestaurant({ lat: 18.0, lng: 77.0 });
            const customer = await testBuilder.createUser({ email: 'customer@test.com', role: 'customer' });
            const order = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: restaurant.id,
                deliveryLat: 18.05,
                deliveryLng: 77.05
            });

            const riderUser = await testBuilder.createUser({ email: 'rider@test.com' });
            await testBuilder.createDeliveryPartner({
                userId: riderUser.id,
                lat: 18.01,
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });

            // ACT
            await orderController.assignDeliveryPartner(order.id, order, testBuilder.client);

            // ASSERT
            const emissions = mockSocket.getEmissions(`user_${riderUser.id}`, 'new_assignment');
            expect(emissions).toHaveLength(1);
            expect(emissions[0].data).toMatchObject({
                order_id: order.id,
                order_number: order.order_number,
                restaurant_name: restaurant.name,
                delivery_address: order.delivery_address
            });
            expect(emissions[0].data.assignment_id).toBeDefined();
        });

        test('completes assignment even when socket.io is unavailable', async () => {
            // ARRANGE
            global.io = null; // Simulate missing socket.io

            const restaurant = await testBuilder.createRestaurant({ lat: 18.0, lng: 77.0 });
            const customer = await testBuilder.createUser({ email: 'customer@test.com', role: 'customer' });
            const order = await testBuilder.createOrder({
                userId: customer.id,
                restaurantId: restaurant.id,
                deliveryLat: 18.05,
                deliveryLng: 77.05
            });

            const riderUser = await testBuilder.createUser({ email: 'rider@test.com' });
            await testBuilder.createDeliveryPartner({
                userId: riderUser.id,
                lat: 18.01,
                lng: 77.0,
                isOnline: true,
                isVerified: true
            });

            // ACT & ASSERT: Should not throw
            await expect(
                orderController.assignDeliveryPartner(order.id, order, testBuilder.client)
            ).resolves.not.toThrow();

            // Assignment should still be created
            const assignments = await testBuilder.getAssignmentsForOrder(order.id);
            expect(assignments).toHaveLength(1);
        });
    });
});
