import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { orderApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { useShop } from '../context/ShopContext';
import { useToast } from '../context/ToastContext';
import { getId, formatDate } from '../lib/format';
import ProductImage from './ProductImage';

// Home page: "Order again" card with the last delivered order — one tap puts it all back in the cart
export default function OrderAgain() {
  const { isLoggedIn } = useAuth();
  const { tr, t } = useLang();
  const { loadCart } = useShop();
  const toast = useToast();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setOrder(null);
      return;
    }
    orderApi.list(1)
      .then(({ data }) => setOrder((data || []).find((o) => o.status === 'delivered') || null))
      .catch(() => {});
  }, [isLoggedIn]);

  if (!order) return null;

  const items = order.items || [];
  const shown = items.slice(0, 4);

  async function reorder() {
    setBusy(true);
    try {
      const { data } = await orderApi.reorder(getId(order));
      await loadCart();
      const skipped = data.skipped || [];
      if (skipped.length) {
        toast.error(t('Some items changed: {names}', { names: skipped.map((s) => tr(s.title)).join(', ') }));
      } else {
        toast.success(t('Added to cart'));
      }
      navigate('/cart');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="shelf">
      <div className="section-head">
        <h2>{t('Order again')}</h2>
        <Link to="/orders">{t('Your orders')}</Link>
      </div>
      <div className="card order-again">
        <div className="order-again__items">
          {shown.map((it, i) => (
            <span key={i} className="order-again__img" title={tr(it.title)}><ProductImage src={it.image} alt={tr(it.title)} /></span>
          ))}
          {items.length > shown.length && <span className="order-again__more">+{items.length - shown.length}</span>}
        </div>
        <div className="order-again__info">
          <strong>{t('{n} items', { n: items.length })}</strong>
          <span className="muted small">{t('Delivered')} {formatDate(order.updatedAt)}</span>
        </div>
        <button className="btn btn--primary btn--sm" onClick={reorder} disabled={busy}>
          <RotateCcw size={16} /> {busy ? t('Adding…') : t('Add all')}
        </button>
      </div>
    </section>
  );
}
