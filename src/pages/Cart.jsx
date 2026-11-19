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
import OffersList from '../components/OffersList';

export function BillSummary({ cart }) {
  const mrpSaving = cart.mrpTotal > cart.subtotal ? cart.mrpTotal - cart.subtotal : 0;
  const totalSaving = mrpSaving + (cart.discount || 0);
  const { t } = useLang();

  return (
    <div className="bill">
      <h2>{t('Bill details')}</h2>
      <dl>
        {mrpSaving > 0 && (<><dt>{t('MRP total')}</dt><dd><s>{money(cart.mrpTotal)}</s></dd></>)}
        <dt>{t('Items total')}</dt><dd>{money(cart.subtotal)}</dd>
        {cart.discount > 0 && (<><dt>{t('Coupon')} {cart.coupon && `(${cart.coupon})`}</dt><dd className="green">−{money(cart.discount)}</dd></>)}
        <dt>{t('Delivery')}</dt><dd>{cart.deliveryFee ? money(cart.deliveryFee) : <span className="green">{t('Free')}</span>}</dd>
        {cart.handlingFee > 0 && (<><dt>{t('Handling')}</dt><dd>{money(cart.handlingFee)}</dd></>)}
      </dl>
      <div className="bill__total">
        <span>{t('To pay')}</span>
        <strong>{money(cart.total)}</strong>
      </div>
      {totalSaving > 0 && <p className="bill__saved">{t('You save {amount} on this order', { amount: money(totalSaving) })}</p>}
    </div>
  );
}

// "Add ₹X more for free delivery" / minimum order / store closed — driven by GET /settings
export function CartNotices({ cart, settings }) {
  const { t } = useLang();
  if (!settings) return null;
  const { freeDeliveryThreshold, minOrderValue, storeOpen, storeTimings } = settings;
  const toFree = freeDeliveryThreshold - cart.subtotal;
  const toMin = minOrderValue - cart.subtotal;

  return (
    <>
      {!storeOpen && (
        <p className="cart-notice cart-notice--closed">
          {t('The store is closed right now. Orders open again at {time}.', { time: storeTimings?.open })}
        </p>
      )}
      {toMin > 0 && (
        <p className="cart-notice cart-notice--warn">{t('Minimum order is {min}. Add {amount} more to check out.', { min: money(minOrderValue), amount: money(toMin) })}</p>
      )}
      {freeDeliveryThreshold > 0 && (
        toFree > 0 ? (
          <div className="cart-notice">
            <span>{t('Add {amount} more for free delivery', { amount: money(toFree) })}</span>
            <span className="progress"><span style={{ width: `${Math.min(100, (cart.subtotal / freeDeliveryThreshold) * 100)}%` }} /></span>
          </div>
        ) : (
          <p className="cart-notice cart-notice--ok">{t('You’ve unlocked free delivery')}</p>
        )
      )}
    </>
  );
}

export default function Cart() {
  const { isLoggedIn } = useAuth();
  const { tr, t } = useLang();
  const navigate = useNavigate();
  const { cart, settings, setQty, removeFromCart, busyId, lineKey, applyCoupon, removeCoupon } = useShop();
  const [code, setCode] = useState('');

  if (!isLoggedIn) {
    return (
      <div className="page container">
        <EmptyState icon={ShoppingBag} title={t('Log in to see your cart')} text={t('Your cart is saved to your account, so it follows you across devices.')} action={t('Log in')} to="/login?next=/cart" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="page container">
        <EmptyState icon={ShoppingBag} title={t('Your cart is empty')} text={t('Add a few things and they’ll wait for you here.')} action={t('Start shopping')} to="/products" />
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
      <h1 className="page-title">{t('Cart')} <span className="muted">({cart.items.length})</span></h1>

      <div className="two-col">
        <div className="card cart-list">
          {cart.items.map((item) => (
            // One line per product + option, e.g. Aata 1 kg and Aata 5 kg are two lines
            <div key={lineKey(item.productId, item.variantId)} className={`cart-item ${item.isAvailable === false ? 'is-unavailable' : ''}`}>
              <Link to={`/product/${item.slug}`} className="cart-item__img">
                <ProductImage src={item.image} alt={tr(item.title)} />
              </Link>
              <div className="cart-item__info">
                <Link to={`/product/${item.slug}`} className="cart-item__title">{tr(item.title)}</Link>
                <span className="muted small">{item.variantLabel ? tr(item.variantLabel) : item.unit}</span>
                {item.isAvailable === false && <span className="form-error small">{t('No longer available. Please remove it.')}</span>}
                <div className="cart-item__price">
                  <strong>{money(item.lineTotal)}</strong>
                  {item.mrp > item.price && <s className="muted small">{money(item.mrp * item.qty)}</s>}
                </div>
              </div>
              <div className="cart-item__actions">
                {item.isAvailable !== false && (
                  <QtyStepper
                    qty={item.qty}
                    busy={busyId === lineKey(item.productId, item.variantId)}
                    max={item.stock}
                    onChange={(n) => setQty(item.productId, n, item.variantId)}
                    size="sm"
                  />
                )}
                <button className="link-btn danger" onClick={() => removeFromCart(item.productId, item.variantId)} aria-label={t('Remove')}>
                  <Trash2 size={16} /> {t('Remove')}
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
                <span><strong>{cart.coupon}</strong> {t('applied')}</span>
                <button className="icon-btn icon-btn--sm" onClick={removeCoupon} aria-label={t('Remove coupon')}><X size={16} /></button>
              </div>
            ) : (
              <form onSubmit={onApply} className="coupon__form">
                <TicketPercent size={20} />
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('Coupon code')} aria-label={t('Coupon code')} />
                <button className="btn btn--ghost btn--sm" disabled={busyId === 'coupon'}>{t('Apply')}</button>
              </form>
            )}
            {cart.couponError && <p className="form-error small">{cart.couponError.message || cart.couponError}</p>}
          </div>

          <OffersList subtotal={cart.subtotal} />

          <div className="card">
            <CartNotices cart={cart} settings={settings} />
            <BillSummary cart={cart} />
            <button
              className="btn btn--primary btn--block"
              onClick={() => navigate('/checkout')}
              disabled={settings && (!settings.storeOpen || cart.subtotal < settings.minOrderValue)}
            >
              {t('Proceed to checkout')}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
