import { useEffect, useState } from 'react';
import { pushApi } from '../api/endpoints';

// VAPID public key comes as base64url; the browser wants raw bytes
function base64UrlToBytes(base64Url) {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

// Remembered per app, so turning off rider alerts doesn't touch customer notifications
const optOutKey = (kind) => (kind === 'rider' ? 'aali.push.optOut.rider' : 'aali.push.optOut');
export const hasOptedOut = (kind = 'customer') => localStorage.getItem(optOutKey(kind)) === '1';

const isSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

/**
 * Push notifications for the logged-in user.
 *   kind = 'customer' → order updates, kind = 'rider' → new deliveries
 * iPhone: only works once the app is added to the Home Screen (iOS 16.4+).
 */
export function usePush(kind = 'customer') {
  const supported = isSupported();
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const blocked = supported && Notification.permission === 'denied';

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => {});
  }, [supported]);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Notifications were not allowed');

      const { data } = await pushApi.publicKey();
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(data.publicKey) }));

      await pushApi.subscribe(sub.toJSON(), kind);
      localStorage.removeItem(optOutKey(kind));
      setSubscribed(true);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await pushApi.unsubscribe(sub.endpoint, kind).catch(() => {});
        await sub.unsubscribe();
      }
      localStorage.setItem(optOutKey(kind), '1');
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }

  return { supported, subscribed, blocked, busy, enable, disable };
}
