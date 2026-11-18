import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Phone, MapPin } from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { useLang } from '../context/LangContext';
import { useToast } from '../context/ToastContext';
import { asList, getId, money, formatDate, ORDER_STATUSES, STATUS_LABELS, PAYMENT_LABELS } from '../lib/format';
import { Spinner, ErrorState } from '../components/States';
import ProductImage from '../components/ProductImage';
import { StatusPill } from '../pages/Orders';
import { Drawer } from './AdminUi';

const FLOW = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
const nextStatus = (s) => FLOW[FLOW.indexOf(s) + 1] || s;

function OrderDetail({ orderId, onChanged }) {
  const { tr } = useLang();
  const toast = useToast();
  const { data: order, loading, error, reload } = useFetch(() => adminApi.order(orderId), [orderId]);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const chosen = status || nextStatus(order.status);
  const addr = order.shippingAddress || {};
  const pricing = order.pricing || {};
  const finished = ['delivered', 'cancelled'].includes(order.status);

  async function updateStatus(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateOrderStatus(orderId, chosen, note || undefined);
      toast.success(`Marked ${STATUS_LABELS[chosen].toLowerCase()}`);
      setNote('');
      setStatus('');
      reload();
      onChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <div className="list-head">
        <StatusPill status={order.status} />
        <span className="muted small">{formatDate(order.createdAt, true)}</span>
      </div>

      <div className="customer-card">
        <div>
          <strong>{order.user?.name}</strong>
          <a href={`tel:${order.user?.mobile}`} className="link-btn"><Phone size={15} /> {order.user?.mobile}</a>
        </div>
        <div>
          <MapPin size={16} />
          <span>
            {[addr.line1, addr.line2, addr.landmark].filter(Boolean).join(', ')}, {addr.city} {addr.pincode}
            <a
              className="link-btn small"
              target="_blank"
              rel="noreferrer"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${addr.line1} ${addr.city} ${addr.pincode}`)}`}
            >
              Open in Maps
            </a>
          </span>
        </div>
      </div>

      {!finished && (
        <form className="status-form status-form--compact card" onSubmit={updateStatus}>
          <label className="field">
            <span className="field__label">Move to</span>
            <select value={chosen} onChange={(e) => setStatus(e.target.value)}>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Note for the shopper <em>optional</em></span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Packing started" />
          </label>
          <div className="row-end">
            <button className="btn btn--primary" disabled={saving}>{saving ? 'Updating…' : 'Update'}</button>
          </div>
        </form>
      )}

      <section>
        <h3 className="card__title">Items</h3>
        <ul className="order-items">
          {order.items.map((it, i) => (
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
          {pricing.discount > 0 && (<><dt>Coupon ({order.couponCode})</dt><dd className="green">−{money(pricing.discount)}</dd></>)}
          <dt>Delivery</dt><dd>{pricing.deliveryFee ? money(pricing.deliveryFee) : 'Free'}</dd>
          {pricing.handlingFee > 0 && (<><dt>Handling</dt><dd>{money(pricing.handlingFee)}</dd></>)}
        </dl>
        <div className="bill__total">
          <span>{PAYMENT_LABELS[order.paymentMethod]} ({order.paymentStatus})</span>
          <strong>{money(pricing.total)}</strong>
        </div>
      </section>

      <section>
        <h3 className="card__title">History</h3>
        <ul className="history">
          {order.statusHistory.map((h, i) => (
            <li key={i}>
              <strong>{STATUS_LABELS[h.status]}</strong> <span className="muted small">{formatDate(h.at, true)}</span>
              {h.note && <p className="muted small">{h.note}</p>}
            </li>
          ))}
        </ul>
        {order.cancelReason && <p className="muted">Cancel reason: {order.cancelReason}</p>}
      </section>
    </div>
  );
}

export default function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const openId = params.get('open');
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(params.get('q') || '');
  const [search, setSearch] = useState(params.get('q') || '');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, meta, loading, error, reload } = useFetch(
    () => adminApi.orders({ page, limit: 20, status, q: search, from, to }),
    [page, status, search, from, to]
  );
  const orders = asList(data);
  const pages = meta?.pages || 1;

  function setParam(key, value) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  }

  return (
    <div className="admin-page">
      <h1 className="admin-title">Orders</h1>

      <div className="admin-filters">
        <form className="search search--admin" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q.trim()); }}>
          <Search size={18} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order number or mobile" />
        </form>
        <label className="date-field">From <input type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} /></label>
        <label className="date-field">To <input type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} /></label>
      </div>

      <div className="chip-scroll">
        <button className={`chip ${!status ? 'is-on' : ''}`} onClick={() => { setPage(1); setParam('status', ''); }}>All</button>
        {ORDER_STATUSES.map((s) => (
          <button key={s} className={`chip ${status === s ? 'is-on' : ''}`} onClick={() => { setPage(1); setParam('status', s); }}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && (
        <div className="card card--flush">
          <table className="table">
            <thead><tr><th>Order</th><th>Customer</th><th>Area</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={getId(o)} className="table__click" onClick={() => setParam('open', getId(o))}>
                  <td><strong>#{o.orderNumber}</strong><span className="muted small">{formatDate(o.createdAt, true)}</span></td>
                  <td>{o.user?.name}<span className="muted small">{o.user?.mobile}</span></td>
                  <td>{o.shippingAddress?.city}<span className="muted small">{o.shippingAddress?.pincode}</span></td>
                  <td>{money(o.pricing?.total)}<span className="muted small">{PAYMENT_LABELS[o.paymentMethod]}, {o.paymentStatus}</span></td>
                  <td><StatusPill status={o.status} /></td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={5} className="muted center">No orders match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="pager">
          <button className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button className="btn btn--ghost btn--sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {openId && (
        <Drawer title="Order details" onClose={() => setParam('open', '')}>
          <OrderDetail orderId={openId} onChanged={reload} />
        </Drawer>
      )}
    </div>
  );
}
