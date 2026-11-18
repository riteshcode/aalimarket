import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { MapPin, Plus, CheckCircle2, XCircle, Banknote, Smartphone, CreditCard, Landmark } from 'lucide-react';
import { addressApi, orderApi, cartApi, paymentApi } from '../api/endpoints';
import { useShop } from '../context/ShopContext';
import { useToast } from '../context/ToastContext';
import { asList, getId, money, normalizeCart } from '../lib/format';
import { collectPayment } from '../lib/payment';
import { useAuth } from '../context/AuthContext';
import AddressForm from '../components/AddressForm';
import { BillSummary, CartNotices } from './Cart';
import { Spinner } from '../components/States';

const PAYMENTS = [
  { value: 'cod', label: 'Cash on delivery', hint: 'Pay when your order arrives', icon: Banknote },
  { value: 'upi', label: 'UPI', hint: 'GPay, PhonePe, Paytm', icon: Smartphone },
  { value: 'card', label: 'Debit / credit card', icon: CreditCard },
  { value: 'netbanking', label: 'Net banking', icon: Landmark },
];

export default function Checkout() {
  const navigate = useNavigate();
  const toast = useToast();
  const { cart, loadCart, settings } = useShop();
  const { user } = useAuth();
  // Cart totals for the selected pincode (some areas have their own delivery fee)
  const [areaCart, setAreaCart] = useState(null);

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const [service, setService] = useState(null); // { ok, message }
  const [payment, setPayment] = useState('cod');
  const [placing, setPlacing] = useState(false);

  // One key per checkout visit — a double tap on "Place order" won't create two orders
  const idempotencyKey = useMemo(() => crypto.randomUUID?.() || String(Date.now()) + Math.random(), []);

  useEffect(() => { loadAddresses(); }, []);

  async function loadAddresses() {
    setLoading(true);
    try {
      const { data } = await addressApi.list();
      const list = asList(data);
      setAddresses(list);
      const def = list.find((a) => a.isDefault) || list[0];
      setSelected(def ? getId(def) : null);
      setAdding(list.length === 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Check delivery for the selected pincode
  const selectedAddress = addresses.find((a) => getId(a) === selected);
  useEffect(() => {
    const pincode = selectedAddress?.pincode;
    if (!pincode) {
      setService(null);
      setAreaCart(null);
      return;
    }

    addressApi.serviceability(pincode)
      .then(({ data }) => {
        const area = data.areaName?.en ? `${data.areaName.en} (${data.pincode})` : data.pincode;
        const eta = data.etaDays ? `delivery in ${data.etaDays} day${data.etaDays > 1 ? 's' : ''}` : '';
        setService({
          ok: data.serviceable,
          message: data.serviceable ? `We deliver to ${area}` : `We don’t deliver to ${data.pincode} yet`,
          eta,
        });
      })
      .catch(() => setService(null));

    cartApi.get(pincode)
      .then(({ data }) => setAreaCart(normalizeCart(data)))
      .catch(() => setAreaCart(null));
  }, [selectedAddress?.pincode, cart.total]);

  async function saveAddress(form) {
    setSavingAddr(true);
    try {
      const { data } = await addressApi.create(form);
      toast.success('Address saved');
      setAdding(false);
      await loadAddresses();
      if (getId(data)) setSelected(getId(data));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingAddr(false);
    }
  }

  async function placeOrder() {
    if (!selected) return toast.error('Choose a delivery address first.');
    setPlacing(true);
    try {
      const { data: order } = await orderApi.create(selected, payment, idempotencyKey);
      await loadCart();

      // UPI / card / net banking: open the payment step, then verify with the backend
      if (order.payment) {
        try {
          const result = await collectPayment(order.payment, user);
          await paymentApi.verify({ orderId: getId(order), ...result });
        } catch (err) {
          toast.error(`${err.message}. Your order is saved with payment pending.`);
        }
      }

      navigate(`/orders/${getId(order)}?placed=1`, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPlacing(false);
    }
  }

  if (!loading && cart.items.length === 0 && !placing) return <Navigate to="/cart" replace />;

  return (
    <div className="page container">
      <h1 className="page-title">Checkout</h1>

      <div className="two-col">
        <div className="stack">
          <section className="card">
            <div className="card__head">
              <h2><MapPin size={18} /> Deliver to</h2>
              {!adding && addresses.length > 0 && (
                <button className="link-btn" onClick={() => setAdding(true)}><Plus size={16} /> New address</button>
              )}
            </div>

            {loading && <Spinner />}

            {!loading && !adding && (
              <div className="radio-list">
                {addresses.map((a) => (
                  <label key={getId(a)} className={`radio-card ${selected === getId(a) ? 'is-on' : ''}`}>
                    <input type="radio" name="address" checked={selected === getId(a)} onChange={() => setSelected(getId(a))} />
                    <div>
                      <strong>{a.label}</strong>
                      <p>{[a.line1, a.line2, a.landmark].filter(Boolean).join(', ')}</p>
                      <p className="muted small">{a.city}, {a.state} {a.pincode}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {adding && (
              <AddressForm
                onSubmit={saveAddress}
                saving={savingAddr}
                onCancel={addresses.length ? () => setAdding(false) : null}
              />
            )}

            {service && !adding && (
              <p className={`service ${service.ok ? 'is-ok' : 'is-no'}`}>
                {service.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {service.message}{service.eta ? `, ${service.eta}` : ''}
              </p>
            )}
          </section>

          <section className="card">
            <div className="card__head"><h2>Payment</h2></div>
            <div className="radio-list">
              {PAYMENTS.map(({ value, label, hint, icon: Icon }) => (
                <label key={value} className={`radio-card ${payment === value ? 'is-on' : ''}`}>
                  <input type="radio" name="payment" checked={payment === value} onChange={() => setPayment(value)} />
                  <Icon size={20} />
                  <div>
                    <strong>{label}</strong>
                    {hint && <p className="muted small">{hint}</p>}
                  </div>
                </label>
              ))}
            </div>
            {payment !== 'cod' && (
              <p className="muted small note">Online payment is confirmed by the payment provider after the order is placed.</p>
            )}
          </section>
        </div>

        <aside className="sticky-col">
          <div className="card">
            <CartNotices cart={cart} settings={settings} />
            <BillSummary cart={areaCart || cart} />
            <button
              className="btn btn--primary btn--block"
              onClick={placeOrder}
              disabled={placing || !selected || adding || service?.ok === false || settings?.storeOpen === false}
            >
              {placing ? 'Placing order…' : `Place order (${money((areaCart || cart).total)})`}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
