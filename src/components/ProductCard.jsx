import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ChevronDown } from 'lucide-react';
import Price from './Price';
import QtyStepper from './QtyStepper';
import ProductImage from './ProductImage';
import VariantSheet from './VariantSheet';
import { useShop } from '../context/ShopContext';
import { useLang } from '../context/LangContext';
import { discountPercent, getId, hasVariants } from '../lib/format';

export default function ProductCard({ product }) {
  const { tr, t } = useLang();
  const { qtyInCart, qtyOfProduct, addToCart, setQty, busyId, lineKey, wishlistIds, toggleWishlist } = useShop();
  const [showOptions, setShowOptions] = useState(false);

  const id = getId(product);
  const withOptions = hasVariants(product);
  const qty = withOptions ? qtyOfProduct(id) : qtyInCart(id);
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
        {withOptions ? (
          <button className="pcard__options" onClick={() => setShowOptions(true)}>
            {product.unit} <span>{t('+{n} more', { n: product.variants.length - 1 })}</span> <ChevronDown size={12} />
          </button>
        ) : (
          <span className="pcard__unit">{product.unit}</span>
        )}
        <Price price={product.price} mrp={product.mrp} size="sm" />

        <div className="pcard__action">
          {outOfStock ? (
            <span className="pcard__oos">{t('Out of stock')}</span>
          ) : withOptions ? (
            // Options: always open the chooser; show how many are already in the cart
            <button className={`btn btn--add ${qty > 0 ? 'is-in-cart' : ''}`} onClick={() => setShowOptions(true)}>
              {qty > 0 ? t('{n} in cart', { n: qty }) : t('Add')}
            </button>
          ) : qty > 0 ? (
            <QtyStepper qty={qty} busy={busyId === lineKey(id)} max={product.stock} onChange={(n) => setQty(id, n)} size="sm" />
          ) : (
            <button className="btn btn--add" disabled={busyId === lineKey(id)} onClick={() => addToCart(id, 1)}>
              {t('Add')}
            </button>
          )}
        </div>
      </div>

      {showOptions && <VariantSheet product={product} onClose={() => setShowOptions(false)} />}
    </article>
  );
}
