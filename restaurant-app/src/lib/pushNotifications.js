'use client';

// ─── Web Push Notification Service ────────────────────────────────────────────
// Handles service worker registration, VAPID subscription and in-page alarm sounds.

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY 
  || 'BJZFlizDMzXF_F-QzzjPgWyxDgfMU3yndgDEz1DagRhjMn7J3xPicsVRNX6q4O3rIg6LL4A5yALtOWb8G2TAJQ0';

/**
 * Convert VAPID public key from base64 string to Uint8Array (required by browser API)
 */
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

/**
 * Register the service worker and subscribe to push notifications.
 * Posts the subscription to the backend for storage.
 */
export async function registerPushNotifications(apiBaseUrl, accessToken) {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Browser does not support service workers or push.');
    return null;
  }

  try {
    // 1. Register the service worker
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // 2. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[Push] Notification permission denied.');
      return null;
    }

    // 3. Subscribe to VAPID push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // 4. Send subscription to backend
    await fetch(`${apiBaseUrl}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ subscription }),
    });

    console.log('[Push] Push subscription registered successfully.');
    return subscription;
  } catch (err) {
    console.error('[Push] Failed to register push notifications:', err);
    return null;
  }
}

/**
 * In-page alarm sound using Web Audio API.
 * Creates an urgent repeating beep that continues until stopped.
 * Returns a stop function.
 */
export function playAlarmSound() {
  if (typeof window === 'undefined' || !window.AudioContext) return () => {};

  let running = true;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  const pattern = [880, 0, 880, 0, 880, 0, 660, 0]; // Hz (0 = silence)
  const noteDuration = 0.12; // seconds per note

  const scheduleBeeps = (startTime) => {
    if (!running) return;
    pattern.forEach((freq, i) => {
      if (freq === 0) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.4, startTime + i * noteDuration);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * noteDuration + noteDuration * 0.9);
      osc.start(startTime + i * noteDuration);
      osc.stop(startTime + i * noteDuration + noteDuration);
    });

    const loopDuration = pattern.length * noteDuration;
    const next = startTime + loopDuration;
    // Schedule next loop cycle
    setTimeout(() => {
      if (running) scheduleBeeps(ctx.currentTime);
    }, (next - ctx.currentTime - 0.1) * 1000 + 300);
  };

  // Start with a tiny delay to allow AudioContext to unlock
  ctx.resume().then(() => scheduleBeeps(ctx.currentTime + 0.05));

  return function stopAlarm() {
    running = false;
    try { ctx.close(); } catch (_) {}
  };
}

/**
 * Play a single soft notification ping (for non-alarm events like status updates).
 */
export function playPingSound() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1047; // C6 – pleasant ping
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
    ctx.resume();
  } catch (_) {}
}
