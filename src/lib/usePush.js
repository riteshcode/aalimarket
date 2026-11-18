import { useEffect, useState } from 'react';
import { pushApi } from '../api/endpoints';

// VAPID public key comes as base64url; the browser wants raw bytes
function base64UrlToBytes(base64Url) {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

const OPT_OUT_KEY = 'aali.push.optOut';
export const hasOptedOut = () => localStorage.getItem(OPT_OUT_KEY) === '1';

const isSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

/**
 * Order-update notifications for the logged-in shopper.
 * iPhone: only works once the app is added to the Home Screen (iOS 16.4+).
 */
export function usePush() {
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

      await pushApi.subscribe(sub.toJSON());
      localStorage.removeItem(OPT_OUT_KEY);
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
        await pushApi.unsubscribe(sub.endpoint).catch(() => {});
        await sub.unsubscribe();
      }
      localStorage.setItem(OPT_OUT_KEY, '1');
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }

  return { supported, subscribed, blocked, busy, enable, disable };
}
