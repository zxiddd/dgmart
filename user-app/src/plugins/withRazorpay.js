const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin for Razorpay Android SDK
 * 
 * Note: Proguard rules are handled via app.json's "proguardRules" field.
 * Note: Checkout.preload() is NOT injected into MainActivity because the
 *       Razorpay SDK is a transitive dependency through react-native-razorpay
 *       and is not directly available to the app module at compile time.
 *       Razorpay works correctly without preloading.
 */
const withRazorpay = (config) => {
    return config;
};

module.exports = withRazorpay;
