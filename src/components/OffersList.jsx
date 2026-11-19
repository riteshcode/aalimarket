import { TicketPercent } from 'lucide-react';
import { couponApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { useLang } from '../context/LangContext';
import { useShop } from '../context/ShopContext';
import { money } from '../lib/format';

// "Flat ₹50 off" / "10% off, up to ₹100" when the store didn't write its own text
function offerText(c, t) {
  if (c.type === 'flat') return t('Flat {amount} off', { amount: money(c.value) });
  return c.maxDiscount
    ? t('{p}% off, up to {amount}', { p: c.value, amount: money(c.maxDiscount) })
    : t('{p}% off', { p: c.value });
}

// Cart: coupons the shopper can use right now, one tap to apply
export default function OffersList({ subtotal }) {
  const { tr, t } = useLang();
  const { cart, applyCoupon, busyId } = useShop();
  const { data } = useFetch(() => couponApi.available(), []);
  const offers = data || [];

  if (offers.length === 0) return null;

  return (
    <div className="card offers">
      <h3 className="card__title"><TicketPercent size={18} /> {t('Offers for you')}</h3>
      <ul>
        {offers.map((c) => {
          const short = c.minOrderValue - subtotal;
          const applied = cart.coupon === c.code;
          return (
            <li key={c.code}>
              <div>
                <span className="code">{c.code}</span>
                <p>{c.description ? tr(c.description) : offerText(c, t)}</p>
                {short > 0 && !applied && (
                  <span className="muted small">{t('Add {amount} more to use this', { amount: money(short) })}</span>
                )}
              </div>
              {applied ? (
                <span className="green small">{t('applied')}</span>
              ) : (
                <button className="btn btn--ghost btn--sm" disabled={short > 0 || busyId === 'coupon'} onClick={() => applyCoupon(c.code)}>
                  {t('Apply')}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
