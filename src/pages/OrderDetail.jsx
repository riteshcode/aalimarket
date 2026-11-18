import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { PartyPopper, KeyRound, Bell, RotateCcw, CreditCard, Banknote } from 'lucide-react';
import { orderApi, paymentApi } from '../api/endpoints';
import { collectPayment } from '../lib/payment';
import { usePush } from '../lib/usePush';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../lib/useFetch';
import { useLang } from '../context/LangContext';
import { useToast } from '../context/ToastContext';
import {
  getId, money, formatDate, STATUS_LABELS, ORDER_STATUSES, CANCELLABLE, PAYMENT_LABELS,
} from '../lib/format';
import { Spinner, ErrorState } from '../components/States';
import ProductImage from '../components/ProductImage';
import { StatusPill } from './Orders';

const TRACK_STEPS = ORDER_STATUSES.filter((s) => s !== 'cancelled');

function Timeline({ order }) {
  const { t } = useLang();
  const history = order.statusHistory || [];
  const timeFor = (status) => {
    const h = history.find((x) => x.status === status);
    return h ? { at: h.at, note: h.note } : null;
  };

  if (order.status === 'cancelled') {
    const c = timeFor('cancelled');
    return (
      <div className="timeline timeline--cancelled">
        <p><strong>{t('Order cancelled')}</strong> {c?.at && <span className="muted small">{formatDate(c.at, true)}</span>}</p>
        {(c?.note || order.cancelReason) && <p className="muted">{c?.note || order.cancelReason}</p>}
      </div>
    );
  }

  const currentIndex = TRACK_STEPS.indexOf(order.status);
  return (
    <ol className="timeline">
      {TRACK_STEPS.map((step, i) => {
        const info = timeFor(step);
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'todo';
        return (
          <li key={step} className={`timeline__step is-${state}`}>
            <span className="timeline__dot" />
            <div>
              <strong>{t(STATUS_LABELS[step])}</strong>
              {info?.at && <span className="muted small"> {formatDate(info.at, true)}</span>}
              {info?.note && <p className="muted small">{info.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// Shown right after an order is placed: offer status notifications
function PushPrompt() {
  const { t } = useLang();
  const toast = useToast();
  const { supported, subscribed, blocked, busy, enable } = usePush();
  if (!supported || subscribed || blocked) return null;

  async function turnOn() {
    try {
      await enable();
      toast.success(t('You’ll get a notification at every step'));
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="card push-prompt">
      <Bell size={22} />
      <p>{t('Get a notification when your order is packed and on its way?')}</p>
      <button className="btn btn--primary btn--sm" onClick={turnOn} disabled={busy}>{t('Turn on')}</button>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { tr, t } = useLang();
  const toast = useToast();
  const navigate = useNavigate();
  const { loadCart } = useShop();
  const { user } = useAuth();
  const [paying, setPaying] = useState(false);
  const [reordering, setReordering] = useState(false);
  const { data: order, loading, error, reload } = useFetch(() => orderApi.get(id), [id]);
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState('Changed my mind');

  // Live tracking: refresh every 30 seconds until the order is finished
  const isFinished = order && ['delivered', 'cancelled'].includes(order.status);
  useEffect(() => {
    if (!order || isFinished) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') reload();
    }, 30000);
    return () => clearInterval(timer);
  }, [order, isFinished, reload]);

  // Only show the spinner on the first load, not on the background refresh
  if (loading && !order) return <Spinner />;
  if (error) return <div className="page container"><ErrorState error={error} onRetry={reload} /></div>;
  if (!order) return null;

  // Online payment didn't go through → open the payment step again
  async function payNow() {
    setPaying(true);
    try {
      const { data } = await orderApi.retryPayment(id);
      const result = await collectPayment(data.payment, user);
      await paymentApi.verify({ orderId: id, ...result });
      toast.success(t('Payment received'));
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPaying(false);
    }
  }

  async function payCash() {
    setPaying(true);
    try {
      await orderApi.switchToCod(id);
      toast.success(t('Switched to cash on delivery'));
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPaying(false);
    }
  }

  // "Buy again": puts this order's items back in the cart at today's prices
  async function buyAgain() {
    setReordering(true);
    try {
      const { data } = await orderApi.reorder(id);
      await loadCart();
      const skipped = data.skipped || [];
      if (skipped.length) {
        const names = skipped.map((s) => tr(s.title)).join(', ');
        toast.error(t('Some items changed: {names}', { names }));
      } else {
        toast.success(t('Added to cart'));
      }
      navigate('/cart');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReordering(false);
    }
  }

  async function cancel() {
    setCancelling(true);
    try {
      await orderApi.cancel(id, reason);
      toast.success(t('Order cancelled'));
      setShowCancel(false);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  }

  const addr = order.shippingAddress || {};
  const items = order.items || [];
  const pricing = order.pricing || {};
  const needsPayment = order.paymentMethod !== 'cod' && order.paymentStatus !== 'paid' && order.status !== 'cancelled';

  return (
    <div className="page container narrow">
      {params.get('placed') && (
        <div className="placed">
          <PartyPopper size={28} />
          <div>
            <strong>{t('Order placed')}</strong>
            <p>{t('We’ve got it. You can track every step right here.')}</p>
          </div>
        </div>
      )}

      {params.get('placed') && <PushPrompt />}

      {order.deliveryOtp && !isFinished && (
        <div className="otp-card">
          <KeyRound size={22} />
          <div>
            <span>{t('Delivery OTP')}</span>
            <strong>{order.deliveryOtp}</strong>
            <p>{t('Share this only with the delivery person, when you get your items.')}</p>
          </div>
        </div>
      )}

      {needsPayment && (
        <div className="card pay-again">
          <p><strong>{t('Payment not completed')}</strong> {t('Your order is saved. Pay online now or pay cash when it arrives.')}</p>
          <div className="row-end">
            <button className="btn btn--ghost" onClick={payCash} disabled={paying}><Banknote size={18} /> {t('Pay cash on delivery')}</button>
            <button className="btn btn--primary" onClick={payNow} disabled={paying}>
              <CreditCard size={18} /> {paying ? t('Please wait…') : t('Pay {amount} now', { amount: money(pricing.total) })}
            </button>
          </div>
        </div>
      )}

      <div className="list-head">
        <h1 className="page-title">{t('Order')} #{order.orderNumber || getId(order)}</h1>
        <StatusPill status={order.status} />
      </div>
      <p className="muted">
        {t('Placed')} {formatDate(order.createdAt, true)}
        {order.expectedDeliveryAt && !isFinished && `. ${t('Expected by')} ${formatDate(order.expectedDeliveryAt)}`}
      </p>

      <section className="card">
        <h2 className="card__title">{t('Tracking')}</h2>
        <Timeline order={order} />
      </section>

      <section className="card">
        <h2 className="card__title">{t('Items')}</h2>
        <ul className="order-items">
          {items.map((it, i) => (
            <li key={i}>
              <span className="order-items__img"><ProductImage src={it.image} alt="" /></span>
              <div>
                <span>{tr(it.title)}</span>
                <span className="muted small">{it.unit} × {it.qty}</span>
              </div>
              <strong>{money(it.price * it.qty)}</strong>
            </li>
          ))}
        </ul>
        <dl className="bill bill--compact">
          <dt>{t('Items total')}</dt><dd>{money(pricing.subtotal)}</dd>
          {pricing.discount > 0 && (<><dt>{t('Coupon')} {order.couponCode && `(${order.couponCode})`}</dt><dd className="green">−{money(pricing.discount)}</dd></>)}
          <dt>{t('Delivery')}</dt><dd>{pricing.deliveryFee ? money(pricing.deliveryFee) : t('Free')}</dd>
          {pricing.handlingFee > 0 && (<><dt>{t('Handling')}</dt><dd>{money(pricing.handlingFee)}</dd></>)}
        </dl>
        <div className="bill__total">
          <span>{t('Total')}</span>
          <strong>{money(pricing.total)}</strong>
        </div>
      </section>

      <div className="two-col two-col--even">
        <section className="card">
          <h2 className="card__title">{t('Delivery address')}</h2>
          <p>{[addr.line1, addr.line2, addr.landmark].filter(Boolean).join(', ')}</p>
          <p className="muted">{addr.city}, {addr.state} {addr.pincode}</p>
          {order.deliveryNote && <p className="delivery-note">“{order.deliveryNote}”</p>}
        </section>
        <section className="card">
          <h2 className="card__title">{t('Payment')}</h2>
          <p>{t(PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod)}</p>
          {order.paymentStatus && <p className="muted small">{t(order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'failed' ? 'Payment failed' : 'Payment pending')}</p>}
        </section>
      </div>

      {CANCELLABLE.includes(order.status) && (
        <section className="card">
          {!showCancel ? (
            <button className="btn btn--danger-ghost" onClick={() => setShowCancel(true)}>{t('Cancel order')}</button>
          ) : (
            <div className="stack-sm">
              <label className="field">
                <span className="field__label">{t('Why are you cancelling?')}</span>
                <select value={reason} onChange={(e) => setReason(e.target.value)}>
                  {/* value stays English so the admin reads one language */}
                  {['Changed my mind', 'Ordered by mistake', 'Found a better price', 'Delivery is taking too long'].map((r) => (
                    <option key={r} value={r}>{t(r)}</option>
                  ))}
                </select>
              </label>
              <div className="row-end">
                <button className="btn btn--ghost" onClick={() => setShowCancel(false)}>{t('Keep order')}</button>
                <button className="btn btn--danger" onClick={cancel} disabled={cancelling}>
                  {cancelling ? t('Cancelling…') : t('Cancel order')}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      <div className="row-between">
        <Link to="/orders" className="link-btn">{t('Back to all orders')}</Link>
        <button className="btn btn--ghost" onClick={buyAgain} disabled={reordering}>
          <RotateCcw size={18} /> {reordering ? t('Adding…') : t('Buy again')}
        </button>
      </div>
    </div>
  );
}
