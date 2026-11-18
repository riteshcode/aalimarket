import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { PartyPopper } from 'lucide-react';
import { orderApi } from '../api/endpoints';
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
  const history = order.statusHistory || [];
  const timeFor = (status) => {
    const h = history.find((x) => x.status === status);
    return h ? { at: h.at, note: h.note } : null;
  };

  if (order.status === 'cancelled') {
    const c = timeFor('cancelled');
    return (
      <div className="timeline timeline--cancelled">
        <p><strong>Order cancelled</strong> {c?.at && <span className="muted small">{formatDate(c.at, true)}</span>}</p>
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
              <strong>{STATUS_LABELS[step]}</strong>
              {info?.at && <span className="muted small"> {formatDate(info.at, true)}</span>}
              {info?.note && <p className="muted small">{info.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { tr } = useLang();
  const toast = useToast();
  const { data: order, loading, error, reload } = useFetch(() => orderApi.get(id), [id]);
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState('Changed my mind');

  if (loading) return <Spinner />;
  if (error) return <div className="page container"><ErrorState error={error} onRetry={reload} /></div>;
  if (!order) return null;

  async function cancel() {
    setCancelling(true);
    try {
      await orderApi.cancel(id, reason);
      toast.success('Order cancelled');
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

  return (
    <div className="page container narrow">
      {params.get('placed') && (
        <div className="placed">
          <PartyPopper size={28} />
          <div>
            <strong>Order placed</strong>
            <p>We’ve got it. You can track every step right here.</p>
          </div>
        </div>
      )}

      <div className="list-head">
        <h1 className="page-title">Order #{order.orderNumber || getId(order)}</h1>
        <StatusPill status={order.status} />
      </div>
      <p className="muted">
        Placed {formatDate(order.createdAt, true)}
        {order.expectedDeliveryAt && !['delivered', 'cancelled'].includes(order.status) && `. Expected by ${formatDate(order.expectedDeliveryAt)}`}
      </p>

      <section className="card">
        <h2 className="card__title">Tracking</h2>
        <Timeline order={order} />
      </section>

      <section className="card">
        <h2 className="card__title">Items</h2>
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
          <dt>Items total</dt><dd>{money(pricing.subtotal)}</dd>
          {pricing.discount > 0 && (<><dt>Coupon {order.couponCode && `(${order.couponCode})`}</dt><dd className="green">−{money(pricing.discount)}</dd></>)}
          <dt>Delivery</dt><dd>{pricing.deliveryFee ? money(pricing.deliveryFee) : 'Free'}</dd>
          {pricing.handlingFee > 0 && (<><dt>Handling</dt><dd>{money(pricing.handlingFee)}</dd></>)}
        </dl>
        <div className="bill__total">
          <span>Total</span>
          <strong>{money(pricing.total)}</strong>
        </div>
      </section>

      <div className="two-col two-col--even">
        <section className="card">
          <h2 className="card__title">Delivery address</h2>
          <p>{[addr.line1, addr.line2, addr.landmark].filter(Boolean).join(', ')}</p>
          <p className="muted">{addr.city}, {addr.state} {addr.pincode}</p>
        </section>
        <section className="card">
          <h2 className="card__title">Payment</h2>
          <p>{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</p>
          {order.paymentStatus && <p className="muted small">Status: {order.paymentStatus}</p>}
        </section>
      </div>

      {CANCELLABLE.includes(order.status) && (
        <section className="card">
          {!showCancel ? (
            <button className="btn btn--danger-ghost" onClick={() => setShowCancel(true)}>Cancel order</button>
          ) : (
            <div className="stack-sm">
              <label className="field">
                <span className="field__label">Why are you cancelling?</span>
                <select value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option>Changed my mind</option>
                  <option>Ordered by mistake</option>
                  <option>Found a better price</option>
                  <option>Delivery is taking too long</option>
                </select>
              </label>
              <div className="row-end">
                <button className="btn btn--ghost" onClick={() => setShowCancel(false)}>Keep order</button>
                <button className="btn btn--danger" onClick={cancel} disabled={cancelling}>
                  {cancelling ? 'Cancelling…' : 'Cancel order'}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      <Link to="/orders" className="link-btn">Back to all orders</Link>
    </div>
  );
}
