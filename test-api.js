#!/usr/bin/env node
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

let testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, message = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status} - ${name}${message ? ': ' + message : ''}`, color);
    testResults.tests.push({ name, passed, message });
    if (passed) testResults.passed++;
    else testResults.failed++;
}

async function testEndpoint(name, url, method = 'GET', data = null, headers = {}) {
    try {
        const config = { method, url: `${BASE_URL}${url}`, headers };
        if (data) config.data = data;
        
        const response = await axios(config);
        logTest(name, response.status === 200, `Status: ${response.status}`);
        return response.data;
    } catch (error) {
        logTest(name, false, error.response ? `Status: ${error.response.status}` : error.message);
        return null;
    }
}

async function runTests() {
    log('\n🧪 DEGLOOR MART API TEST SUITE', 'blue');
    log('=' .repeat(60), 'blue');

    // Health Check
    log('\n📋 1. HEALTH CHECK', 'yellow');
    await testEndpoint('Health Check', '/health');

    // Restaurant Tests
    log('\n🏪 2. RESTAURANT ENDPOINTS', 'yellow');
    const restaurants = await testEndpoint('List Restaurants', '/restaurants');
    
    if (restaurants && restaurants.data && restaurants.data.restaurants.length > 0) {
        const restaurantId = restaurants.data.restaurants[0].id;
        await testEndpoint('Get Restaurant by ID', `/restaurants/${restaurantId}`);
        await testEndpoint('Get Restaurant Dashboard (No Auth)', `/restaurants/${restaurantId}/dashboard`, 'GET', null, {});
    }

    // Menu Tests
    log('\n📜 3. MENU ENDPOINTS', 'yellow');
    if (restaurants && restaurants.data && restaurants.data.restaurants.length > 0) {
        const restaurantId = restaurants.data.restaurants[0].id;
        await testEndpoint('Get Menu Items', `/menu/${restaurantId}`);
    }

    // Order Tests (will fail without auth - expected)
    log('\n📦 4. ORDER ENDPOINTS (Auth Required)', 'yellow');
    await testEndpoint('Get User Orders (No Auth)', '/orders');
    await testEndpoint('Create Order (No Auth)', '/orders', 'POST', {});

    // Delivery Tests
    log('\n🚚 5. DELIVERY ENDPOINTS', 'yellow');
    await testEndpoint('Get Delivery Zones', '/delivery/zones');

    // Admin Tests
    log('\n👑 6. ADMIN ENDPOINTS (Auth Required)', 'yellow');
    await testEndpoint('Get Platform Stats (No Auth)', '/admin/stats');
    await testEndpoint('Get All Users (No Auth)', '/admin/users');

    // User Tests
    log('\n👤 7. USER ENDPOINTS (Auth Required)', 'yellow');
    await testEndpoint('Get User Profile (No Auth)', '/users/profile');

    // Support Tests
    log('\n💬 8. SUPPORT ENDPOINTS (Auth Required)', 'yellow');
    await testEndpoint('Get Support Tickets (No Auth)', '/support/tickets');

    // Payment Tests
    log('\n💰 9. PAYMENT ENDPOINTS (Auth Required)', 'yellow');
    await testEndpoint('Get Payment Methods (No Auth)', '/payments/methods');

    // Summary
    log('\n' + '=' .repeat(60), 'blue');
    log('📊 TEST SUMMARY', 'blue');
    log('=' .repeat(60), 'blue');
    log(`Total Tests: ${testResults.passed + testResults.failed}`);
    log(`✅ Passed: ${testResults.passed}`, 'green');
    log(`❌ Failed: ${testResults.failed}`, 'red');
    log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`, 'yellow');
    log('=' .repeat(60) + '\n', 'blue');
}

runTests().catch(console.error);
