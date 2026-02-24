/**
 * PLATFORM: WEB
 * Firebase JS SDK — works on web preview.
 * Expo automatically uses this file (via the .web.js extension) when running on the web.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPhoneNumber as webSignIn } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCdC6o7QTgioxyHNu3JgQH9J9rKF2v02lY",
    authDomain: "degloormart-68d68.firebaseapp.com",
    projectId: "degloormart-68d68",
    storageBucket: "degloormart-68d68.firebasestorage.app",
    messagingSenderId: "467364105893",
    appId: "1:467364105893:android:1b279344f239b7592b474c",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const webAuth = getAuth(app);

// We simulate the native auth() callable behavior for the web
const auth = () => webAuth;

// Replicate the native signInWithPhoneNumber signature
auth().signInWithPhoneNumber = async (phoneNumber, appVerifier) => {
    // Optional warning on web if we want it, or try to use the web SDK's flow:
    // return webSignIn(webAuth, phoneNumber, appVerifier);

    // For DegloorMart, we just warn they need the native app for OTP test
    throw new Error('Phone OTP SMS only works in the native Android/iOS app. Please build with EAS to test this feature.');
};

export default auth;
