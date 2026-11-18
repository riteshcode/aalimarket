import { useEffect, useRef, useState } from 'react';
import { adminApi } from '../api/endpoints';

// Short two-tone "ding" made with the Web Audio API — no sound file needed
function playDing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  } catch {
    // audio not available — the badge and toast still show
  }
}

const POLL_MS = 30000;

/**
 * Checks for new orders every 30s while the admin panel is open,
 * using GET /admin/orders/latest?since=<ISO> → { count, orders: [{ id, orderNumber, total, createdAt }] } (newest first).
 *
 * "since" is the createdAt of the newest order we've seen (server time), so the phone's clock doesn't matter.
 * Seen ids are remembered too, in case the API includes the boundary order again.
 */
export function useNewOrderAlert(enabled, onNewOrder) {
  const [unseen, setUnseen] = useState(0);
  const since = useRef(null);
  const seenIds = useRef(new Set());

  useEffect(() => {
    if (!enabled) return undefined;

    async function check() {
      try {
        const firstRun = since.current === null;
        // First run looks back a day just to find where we are — no alert for those
        const query = firstRun ? new Date(Date.now() - 86400000).toISOString() : since.current;
        const { data } = await adminApi.latestOrders(query);
        const orders = data?.orders || [];

        const fresh = orders.filter((o) => !seenIds.current.has(o.id));
        orders.forEach((o) => seenIds.current.add(o.id));
        if (orders[0]) since.current = orders[0].createdAt;
        else if (firstRun) since.current = new Date(Date.now() - 120000).toISOString();

        if (!firstRun && fresh.length > 0) {
          setUnseen((n) => n + fresh.length);
          playDing();
          onNewOrder?.(fresh[0], fresh.length);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New order on Aali Market', {
              body: fresh.length > 1 ? `${fresh.length} new orders` : `#${fresh[0].orderNumber}`,
              icon: '/icons/icon-192.png',
            });
          }
        }
      } catch {
        // network blip — try again next round
      }
    }

    check();
    const timer = setInterval(check, POLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { unseen, clearUnseen: () => setUnseen(0) };
}
