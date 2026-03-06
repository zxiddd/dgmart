'use client';

// ─── Web Push Notification Service (Delivery App) ─────────────────────────────
// Handles service worker registration, VAPID subscription and in-page alarm sounds.

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY 
  || 'BJZFlizDMzXF_F-QzzjPgWyxDgfMU3yndgDEz1DagRhjMn7J3xPicsVRNX6q4O3rIg6LL4A5yALtOWb8G2TAJQ0';

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

export async function registerPushNotifications(apiBaseUrl, accessToken) {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    await fetch(`${apiBaseUrl}/notifications/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ subscription }),
    });

    console.log('[Push] Delivery app push registered.');
    return subscription;
  } catch (err) {
    console.error('[Push] Failed:', err);
    return null;
  }
}

/**
 * Urgent alarm for new available orders — louder, more insistent pattern.
 */
export function playAlarmSound() {
  if (typeof window === 'undefined') return () => {};
  let running = true;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  // Urgent rising pattern
  const pattern = [440, 550, 660, 880, 0, 880, 660, 0];
  const noteDuration = 0.1;

  const scheduleBeeps = (startTime) => {
    if (!running) return;
    pattern.forEach((freq, i) => {
      if (freq === 0) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sawtooth'; // harsh, attention-grabbing
      gain.gain.setValueAtTime(0.5, startTime + i * noteDuration);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * noteDuration + noteDuration * 0.85);
      osc.start(startTime + i * noteDuration);
      osc.stop(startTime + i * noteDuration + noteDuration);
    });
    const loopDuration = pattern.length * noteDuration;
    setTimeout(() => { if (running) scheduleBeeps(ctx.currentTime); }, (loopDuration) * 1000 + 300);
  };

  ctx.resume().then(() => scheduleBeeps(ctx.currentTime + 0.05));
  return function stopAlarm() { running = false; try { ctx.close(); } catch (_) {} };
}

export function playPingSound() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1047;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
    ctx.resume();
  } catch (_) {}
}
