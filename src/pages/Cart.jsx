import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, TicketPercent, X } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { money } from '../lib/format';
import QtyStepper from '../components/QtyStepper';
import ProductImage from '../components/ProductImage';
import { EmptyState } from '../components/States';

export function BillSummary({ cart }) {
  const mrpSaving = cart.mrpTotal > cart.subtotal ? cart.mrpTotal - cart.subtotal : 0;
  const totalSaving = mrpSaving + (cart.discount || 0);

  return (
    <div className="bill">
      <h2>Bill details</h2>
      <dl>
        {mrpSaving > 0 && (<><dt>MRP total</dt><dd><s>{money(cart.mrpTotal)}</s></dd></>)}
        <dt>Items total</dt><dd>{money(cart.subtotal)}</dd>
        {cart.discount > 0 && (<><dt>Coupon {cart.coupon && `(${cart.coupon})`}</dt><dd className="green">−{money(cart.discount)}</dd></>)}
        <dt>Delivery</dt><dd>{cart.deliveryFee ? money(cart.deliveryFee) : <span className="green">Free</span>}</dd>
        {cart.handlingFee > 0 && (<><dt>Handling</dt><dd>{money(cart.handlingFee)}</dd></>)}
      </dl>
      <div className="bill__total">
        <span>To pay</span>
        <strong>{money(cart.total)}</strong>
      </div>
      {totalSaving > 0 && <p className="bill__saved">You save {money(totalSaving)} on this order</p>}
    </div>
  );
}

// "Add ₹X more for free delivery" / minimum order / store closed — driven by GET /settings
export function CartNotices({ cart, settings }) {
  if (!settings) return null;
  const { freeDeliveryThreshold, minOrderValue, storeOpen, storeTimings } = settings;
  const toFree = freeDeliveryThreshold - cart.subtotal;
  const toMin = minOrderValue - cart.subtotal;

  return (
    <>
      {!storeOpen && (
        <p className="cart-notice cart-notice--closed">
          The store is closed right now. Orders open again at {storeTimings?.open}.
        </p>
      )}
      {toMin > 0 && (
        <p className="cart-notice cart-notice--warn">Minimum order is {money(minOrderValue)}. Add {money(toMin)} more to check out.</p>
      )}
      {freeDeliveryThreshold > 0 && (
        toFree > 0 ? (
          <div className="cart-notice">
            <span>Add <strong>{money(toFree)}</strong> more for free delivery</span>
            <span className="progress"><span style={{ width: `${Math.min(100, (cart.subtotal / freeDeliveryThreshold) * 100)}%` }} /></span>
          </div>
        ) : (
          <p className="cart-notice cart-notice--ok">You’ve unlocked free delivery</p>
        )
      )}
    </>
  );
}

export default function Cart() {
  const { isLoggedIn } = useAuth();
  const { tr } = useLang();
  const navigate = useNavigate();
  const { cart, settings, setQty, removeFromCart, busyId, applyCoupon, removeCoupon } = useShop();
  const [code, setCode] = useState('');

  if (!isLoggedIn) {
    return (
      <div className="page container">
        <EmptyState icon={ShoppingBag} title="Log in to see your cart" text="Your cart is saved to your account, so it follows you across devices." action="Log in" to="/login?next=/cart" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="page container">
        <EmptyState icon={ShoppingBag} title="Your cart is empty" text="Add a few things and they’ll wait for you here." action="Start shopping" to="/products" />
      </div>
    );
  }

  async function onApply(e) {
    e.preventDefault();
    if (!code.trim()) return;
    const ok = await applyCoupon(code);
    if (ok) setCode('');
  }

  return (
    <div className="page container">
      <h1 className="page-title">Cart <span className="muted">({cart.items.length})</span></h1>

      <div className="two-col">
        <div className="card cart-list">
          {cart.items.map((item) => (
            <div key={item.productId} className="cart-item">
              <Link to={`/product/${item.slug}`} className="cart-item__img">
                <ProductImage src={item.image} alt={tr(item.title)} />
              </Link>
              <div className="cart-item__info">
                <Link to={`/product/${item.slug}`} className="cart-item__title">{tr(item.title)}</Link>
                <span className="muted small">{item.unit}</span>
                <div className="cart-item__price">
                  <strong>{money(item.lineTotal)}</strong>
                  {item.mrp > item.price && <s className="muted small">{money(item.mrp * item.qty)}</s>}
                </div>
              </div>
              <div className="cart-item__actions">
                <QtyStepper qty={item.qty} busy={busyId === item.productId} max={item.stock} onChange={(n) => setQty(item.productId, n)} size="sm" />
                <button className="link-btn danger" onClick={() => removeFromCart(item.productId)} aria-label="Remove">
                  <Trash2 size={16} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="sticky-col">
          <div className="card coupon">
            {cart.coupon ? (
              <div className="coupon__applied">
                <TicketPercent size={20} />
                <span><strong>{cart.coupon}</strong> applied</span>
                <button className="icon-btn icon-btn--sm" onClick={removeCoupon} aria-label="Remove coupon"><X size={16} /></button>
              </div>
            ) : (
              <form onSubmit={onApply} className="coupon__form">
                <TicketPercent size={20} />
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" />
                <button className="btn btn--ghost btn--sm" disabled={busyId === 'coupon'}>Apply</button>
              </form>
            )}
            {cart.couponError && <p className="form-error small">{cart.couponError.message || cart.couponError}</p>}
          </div>

          <div className="card">
            <CartNotices cart={cart} settings={settings} />
            <BillSummary cart={cart} />
            <button
              className="btn btn--primary btn--block"
              onClick={() => navigate('/checkout')}
              disabled={settings && (!settings.storeOpen || cart.subtotal < settings.minOrderValue)}
            >
              Proceed to checkout
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
