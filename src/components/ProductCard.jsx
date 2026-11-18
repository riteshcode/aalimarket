import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import Price from './Price';
import QtyStepper from './QtyStepper';
import ProductImage from './ProductImage';
import { useShop } from '../context/ShopContext';
import { useLang } from '../context/LangContext';
import { discountPercent, getId } from '../lib/format';

export default function ProductCard({ product }) {
  const { tr, t } = useLang();
  const { qtyInCart, addToCart, setQty, busyId, wishlistIds, toggleWishlist } = useShop();

  const id = getId(product);
  const qty = qtyInCart(id);
  const off = discountPercent(product.mrp, product.price);
  const outOfStock = product.stock !== undefined && product.stock <= 0;
  const title = tr(product.title);
  const href = `/product/${product.slug || id}`;

  return (
    <article className="pcard">
      <Link to={href} className="pcard__media">
        <ProductImage src={product.images?.[0]} alt={title} />
        {off > 0 && <span className="tag-off">{t('{off}% off', { off })}</span>}
      </Link>

      <button
        className={`pcard__wish ${wishlistIds.has(id) ? 'is-saved' : ''}`}
        onClick={() => toggleWishlist(id)}
        aria-label={wishlistIds.has(id) ? t('Remove from wishlist') : t('Save to wishlist')}
      >
        <Heart size={18} />
      </button>

      <div className="pcard__body">
        <Link to={href} className="pcard__title">{title}</Link>
        <span className="pcard__unit">{product.unit}</span>
        <Price price={product.price} mrp={product.mrp} size="sm" />

        <div className="pcard__action">
          {outOfStock ? (
            <span className="pcard__oos">{t('Out of stock')}</span>
          ) : qty > 0 ? (
            <QtyStepper qty={qty} busy={busyId === id} max={product.stock} onChange={(n) => setQty(id, n)} size="sm" />
          ) : (
            <button className="btn btn--add" disabled={busyId === id} onClick={() => addToCart(id, 1)}>
              {t('Add')}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
