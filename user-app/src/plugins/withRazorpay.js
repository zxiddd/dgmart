const { withAppBuildGradle, withMainActivity } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to integrate Razorpay Android SDK requirements
 */
const withRazorpay = (config) => {
    // 1. Add Proguard Rules to the app build.gradle
    config = withAppBuildGradle(config, (config) => {
        if (config.modResults.contents) {
            const proguardRules = `
# Razorpay Proguard Rules
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepattributes *Annotation*
-dontwarn com.razorpay.**
-keep class com.razorpay.** {*;}
-optimizations !method/inlining/*
-keepclasseswithmembers class * {
  public void onPayment*(...);
}
`;
            if (!config.modResults.contents.includes('-keep class com.razorpay.**')) {
                config.modResults.contents += proguardRules;
            }
        }
        return config;
    });

    // 2. Add Preload to MainActivity
    config = withMainActivity(config, (config) => {
        if (config.modResults.language === 'java') {
            let contents = config.modResults.contents;
            // Add import
            if (!contents.includes('import com.razorpay.Checkout;')) {
                contents = contents.replace('import android.os.Bundle;', 'import android.os.Bundle;\nimport com.razorpay.Checkout;');
            }
            // Add preload to onCreate
            if (!contents.includes('Checkout.preload')) {
                const onCreateMatch = contents.match(/super\.onCreate\(.*\);/);
                if (onCreateMatch) {
                    contents = contents.replace(onCreateMatch[0], `${onCreateMatch[0]}\n    Checkout.preload(getApplicationContext());`);
                }
            }
            config.modResults.contents = contents;
        }
        return config;
    });

    return config;
};

module.exports = withRazorpay;
