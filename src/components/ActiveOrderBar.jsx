import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, Bike, ChevronRight } from 'lucide-react';
import { orderApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { getId, STATUS_LABELS } from '../lib/format';

const REFRESH_MS = 60000;
const FINISHED = ['delivered', 'cancelled'];

// Pages where the bar would get in the way
function hiddenOn(pathname, activeId) {
  return (
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/product/') || // product page has its own sticky "Add to cart" bar
    (activeId && pathname === `/orders/${activeId}`)
  );
}

/**
 * Small "your order is on its way" bar above the bottom tabs, so the shopper can jump to tracking from anywhere.
 * Shows the delivery OTP once the order is out for delivery.
 */
export default function ActiveOrderBar() {
  const { isLoggedIn } = useAuth();
  const { t } = useLang();
  const { pathname } = useLocation();
  const [active, setActive] = useState([]); // unfinished orders, newest first
  const [otp, setOtp] = useState(null);
  const lastFetch = useRef(0);

  async function load() {
    lastFetch.current = Date.now();
    try {
      const { data } = await orderApi.list(1);
      const open = (data || []).filter((o) => !FINISHED.includes(o.status));
      setActive(open);

      // The list doesn't include the OTP — fetch it for an order that's at the door
      const atDoor = open.find((o) => o.status === 'out_for_delivery');
      if (atDoor) {
        const { data: full } = await orderApi.get(getId(atDoor));
        setOtp(full.deliveryOtp || null);
      } else {
        setOtp(null);
      }
    } catch {
      // keep whatever we had
    }
  }

  // Load on login, then every minute while the app is visible
  useEffect(() => {
    if (!isLoggedIn) {
      setActive([]);
      return undefined;
    }
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [isLoggedIn]);

  // Moving between pages (e.g. right after placing an order) refreshes it, at most every 15s
  useEffect(() => {
    if (isLoggedIn && Date.now() - lastFetch.current > 15000) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const first = active[0];
  const show = isLoggedIn && first && !hiddenOn(pathname, getId(first));

  // Lets the CSS lift toasts and page padding above the bar
  useEffect(() => {
    document.body.classList.toggle('has-order-bar', Boolean(show));
    return () => document.body.classList.remove('has-order-bar');
  }, [show]);

  if (!show) return null;

  // More than one order on the way → go to the list
  if (active.length > 1) {
    return (
      <Link to="/orders" className="order-bar">
        <span className="order-bar__icon"><Package size={20} /></span>
        <span className="order-bar__text">
          <strong>{t('{n} orders on the way', { n: active.length })}</strong>
          <span>{t('Tap to track')}</span>
        </span>
        <ChevronRight size={20} />
      </Link>
    );
  }

  const atDoor = first.status === 'out_for_delivery';
  return (
    <Link to={`/orders/${getId(first)}`} className={`order-bar ${atDoor ? 'order-bar--door' : ''}`}>
      <span className="order-bar__icon">{atDoor ? <Bike size={20} /> : <Package size={20} />}</span>
      <span className="order-bar__text">
        <strong>{t(STATUS_LABELS[first.status])}</strong>
        <span>{t('Order')} #{first.orderNumber.slice(-6)}</span>
      </span>
      {atDoor && otp ? (
        <span className="order-bar__otp">
          <small>OTP</small>
          {otp}
        </span>
      ) : (
        <span className="order-bar__track">{t('Track')} <ChevronRight size={16} /></span>
      )}
    </Link>
  );
}
