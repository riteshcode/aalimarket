import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Phone, Navigation, MessageSquareText, LogOut, Banknote, CheckCircle2, ChevronDown, RefreshCw } from 'lucide-react';
import Logo from '../components/Logo';
import { riderApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { useToast } from '../context/ToastContext';
import { asList, money, toPaise, toRupees, formatDate } from '../lib/format';
import { Spinner, ErrorState } from '../components/States';
import { StatusPill } from '../pages/Orders';

function mapsLink(addr) {
  if (addr.location) return `https://www.google.com/maps/dir/?api=1&destination=${addr.location.lat},${addr.location.lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${addr.line1}, ${addr.city} ${addr.pincode}`)}`;
}

function DeliverForm({ order, onDone, onCancel }) {
  const { t } = useLang();
  const toast = useToast();
  const isCod = order.paymentMethod === 'cod';
  const [otp, setOtp] = useState('');
  const [cash, setCash] = useState(toRupees(order.pricing.total));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await riderApi.deliver(order.id, otp, isCod ? toPaise(cash) : undefined);
      toast.success(t('Delivered! Great job.'));
      onDone();
    } catch (err) {
      if (err.code === 'INVALID_DELIVERY_OTP' && err.details?.attemptsLeft !== undefined) {
        setError(t('Wrong OTP. {n} tries left.', { n: err.details.attemptsLeft }));
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="deliver-form" onSubmit={submit}>
      <label className="field">
        <span className="field__label">{t('Customer’s 4-digit OTP')}</span>
        <input
          className="otp__code"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          autoFocus
          required
        />
      </label>
      {isCod && (
        <label className="field">
          <span className="field__label">{t('Cash collected (₹)')}</span>
          <input type="number" min="0" step="0.01" inputMode="decimal" value={cash} onChange={(e) => setCash(e.target.value)} required />
        </label>
      )}
      {error && <p className="form-error">{error}</p>}
      <div className="row-end">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>{t('Cancel')}</button>
        <button className="btn btn--primary" disabled={busy || otp.length !== 4}>
          <CheckCircle2 size={18} /> {busy ? t('Checking…') : t('Confirm delivery')}
        </button>
      </div>
    </form>
  );
}

function RiderOrder({ order, onChanged }) {
  const { tr, t } = useLang();
  const toast = useToast();
  const [delivering, setDelivering] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [busy, setBusy] = useState(false);
  const addr = order.shippingAddress || {};
  const total = order.pricing?.total;
  const isCod = order.paymentMethod === 'cod';
  const itemCount = order.items.reduce((s, i) => s + i.qty, 0);

  async function startDelivery() {
    setBusy(true);
    try {
      await riderApi.outForDelivery(order.id);
      toast.success(t('Marked out for delivery. The customer has been told.'));
      onChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card rider-order">
      <div className="rider-order__top">
        <strong>#{order.orderNumber.slice(-6)}</strong>
        <StatusPill status={order.status} />
      </div>

      <div className="rider-order__customer">
        <div>
          <strong>{order.user?.name}</strong>
          <p>{[addr.line1, addr.line2].filter(Boolean).join(', ')}</p>
          {addr.landmark && <p className="muted small">{t('Landmark')}: {addr.landmark}</p>}
          <p className="muted small">{addr.city} {addr.pincode}</p>
        </div>
      </div>

      {order.deliveryNote && (
        <p className="rider-order__note"><MessageSquareText size={16} /> {order.deliveryNote}</p>
      )}

      <div className="rider-order__actions">
        <a className="btn btn--ghost" href={`tel:${order.user?.mobile}`}><Phone size={18} /> {t('Call')}</a>
        <a className="btn btn--ghost" href={mapsLink(addr)} target="_blank" rel="noreferrer">
          <Navigation size={18} /> {addr.location ? t('Navigate (exact)') : t('Navigate')}
        </a>
      </div>

      <div className={`rider-order__money ${isCod && order.paymentStatus !== 'paid' ? 'is-cod' : ''}`}>
        <Banknote size={18} />
        {isCod && order.paymentStatus !== 'paid'
          ? t('Collect {amount} cash', { amount: money(total) })
          : order.paymentStatus === 'paid'
            ? t('Paid online. Don’t collect cash.')
            : t('Online payment not done. Call the store before delivering.')}
      </div>

      <button className="link-btn" onClick={() => setShowItems(!showItems)} aria-expanded={showItems}>
        {t('{n} items', { n: itemCount })} <ChevronDown size={16} className={showItems ? 'flip' : ''} />
      </button>
      {showItems && (
        <ul className="rider-items">
          {order.items.map((it, i) => <li key={i}><span>{tr(it.title)}</span><span className="muted">{it.unit} × {it.qty}</span></li>)}
        </ul>
      )}

      {order.status !== 'out_for_delivery' ? (
        <button className="btn btn--primary btn--block" onClick={startDelivery} disabled={busy}>
          {busy ? t('Please wait…') : t('Start delivery')}
        </button>
      ) : delivering ? (
        <DeliverForm order={order} onCancel={() => setDelivering(false)} onDone={onChanged} />
      ) : (
        <button className="btn btn--primary btn--block" onClick={() => setDelivering(true)}>
          <CheckCircle2 size={18} /> {t('Mark delivered')}
        </button>
      )}
    </article>
  );
}

export default function RiderApp() {
  const { isRider, rider, logout } = useAuth();
  const { t, lang, setLang } = useLang();
  const [tab, setTab] = useState('active');

  // Active = everything not finished; Done = delivered
  const { data, loading, error, reload } = useFetch(
    () => (isRider ? riderApi.orders(tab === 'done' ? 'delivered' : undefined) : Promise.resolve({ data: [] })),
    [tab, isRider]
  );

  // Refresh every 30s so newly assigned orders show up
  useEffect(() => {
    if (!isRider) return undefined;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') reload();
    }, 30000);
    return () => clearInterval(timer);
  }, [isRider, reload]);

  if (!isRider) return <Navigate to="/rider/login" replace />;

  const all = asList(data);
  const orders = tab === 'done' ? all : all.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const cashToday = tab === 'done'
    ? all.filter((o) => o.cashCollected && new Date(o.updatedAt).toDateString() === new Date().toDateString())
        .reduce((s, o) => s + o.cashCollected, 0)
    : 0;

  return (
    <div className="rider">
      <header className="rider__head">
        <Logo to="/rider" sub={rider?.user?.name || t('Delivery partner')} />
        <div className="rider__head-actions">
          <button className="lang-toggle lang-toggle--dark" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} aria-label={t('Switch language')}>
            <span className={lang === 'en' ? 'is-on' : ''}>EN</span>
            <span className={lang === 'hi' ? 'is-on' : ''}>हिं</span>
          </button>
          <button className="icon-btn icon-btn--sm" onClick={() => logout('rider')} aria-label={t('Log out')}><LogOut size={16} /></button>
        </div>
      </header>

      <div className="rider__tabs">
        <button className={tab === 'active' ? 'is-on' : ''} onClick={() => setTab('active')}>{t('To deliver')}</button>
        <button className={tab === 'done' ? 'is-on' : ''} onClick={() => setTab('done')}>{t('Delivered')}</button>
        <button className="icon-btn icon-btn--sm" onClick={reload} aria-label={t('Refresh')}><RefreshCw size={16} /></button>
      </div>

      <main className="rider__list">
        {loading && !data && <Spinner />}
        {error && <ErrorState error={error} onRetry={reload} />}

        {tab === 'done' && cashToday > 0 && (
          <p className="rider__cash">{t('Cash collected today: {amount}. Hand it over at the store.', { amount: money(cashToday) })}</p>
        )}

        {!error && orders.length === 0 && !loading && (
          <p className="muted center rider__empty">{tab === 'done' ? t('No deliveries yet.') : t('No orders assigned right now. This list refreshes on its own.')}</p>
        )}

        {tab === 'active'
          ? orders.map((o) => <RiderOrder key={o.id} order={o} onChanged={reload} />)
          : orders.map((o) => (
              <div key={o.id} className="card rider-done">
                <div className="rider-order__top">
                  <strong>#{o.orderNumber.slice(-6)}</strong>
                  <span className="muted small">{formatDate(o.updatedAt, true)}</span>
                </div>
                <p>{o.user?.name}, {o.shippingAddress?.line1}</p>
                {o.cashCollected ? <p className="green">{t('Cash collected')}: {money(o.cashCollected)}</p> : <p className="muted small">{t('Paid online')}</p>}
              </div>
            ))}
      </main>
    </div>
  );
}
