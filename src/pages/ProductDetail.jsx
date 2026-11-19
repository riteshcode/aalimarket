import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Star, Truck, RotateCcw } from 'lucide-react';
import { catalogApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { useShop } from '../context/ShopContext';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { asList, getId, formatDate, discountPercent, hasVariants, defaultVariant, money } from '../lib/format';
import Price from '../components/Price';
import QtyStepper from '../components/QtyStepper';
import ProductImage from '../components/ProductImage';
import ProductCard from '../components/ProductCard';
import ShareButton from '../components/ShareButton';
import { Spinner, ErrorState } from '../components/States';

function Stars({ value, onChange }) {
  return (
    <div className="stars" role={onChange ? 'radiogroup' : undefined} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={n <= value ? 'is-on' : ''}
          onClick={onChange ? () => onChange(n) : undefined}
          disabled={!onChange}
          aria-label={`${n} star`}
        >
          <Star size={onChange ? 26 : 15} />
        </button>
      ))}
    </div>
  );
}

function Reviews({ productId }) {
  const { t } = useLang();
  const { isLoggedIn } = useAuth();
  const toast = useToast();
  const { data, loading } = useFetch(() => catalogApi.reviews(productId), [productId]);
  const reviews = asList(data);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  // The shopper's own review (any status). One review per product, so if it exists we show it instead of the form.
  const [mine, setMine] = useState(null);

  useEffect(() => {
    if (!isLoggedIn || !productId) return;
    catalogApi.myReview(productId).then(({ data }) => setMine(data)).catch(() => {});
  }, [isLoggedIn, productId]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await catalogApi.addReview(productId, { rating, comment });
      setMine(data); // starts as "pending" until the store approves it
      toast.success(t('Thanks! Your review will show after the store approves it.'));
      setComment('');
      setOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="reviews">
      <div className="section-head">
        <h2>{t('Reviews')}</h2>
        {isLoggedIn && !open && !mine && <button className="link-btn" onClick={() => setOpen(true)}>{t('Write a review')}</button>}
      </div>

      {mine && mine.status !== 'approved' && (
        <div className={`card my-review my-review--${mine.status}`}>
          <div className="review__top">
            <strong>{t('Your review')}</strong>
            <Stars value={mine.rating} />
          </div>
          {mine.comment && <p>{mine.comment}</p>}
          <span className="small">
            {mine.status === 'pending' ? t('Waiting for the store to approve it') : t('This review wasn’t approved')}
          </span>
        </div>
      )}

      {open && (
        <form className="card review-form" onSubmit={submit}>
          <Stars value={rating} onChange={setRating} />
          <textarea
            rows={3}
            placeholder={t('How was the quality, freshness, packing?')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />
          <div className="row-end">
            <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>{t('Cancel')}</button>
            <button className="btn btn--primary" disabled={saving}>{saving ? t('Posting…') : t('Post review')}</button>
          </div>
        </form>
      )}

      {loading && <Spinner />}
      {!loading && reviews.length === 0 && <p className="muted">{t('No reviews yet. Shoppers can review after delivery.')}</p>}
      <ul className="review-list">
        {reviews.map((r) => (
          <li key={getId(r)} className="review">
            <div className="review__top">
              <strong>{r.user?.name || t('Shopper')}</strong>
              <Stars value={r.rating} />
            </div>
            <p>{r.comment}</p>
            <span className="muted small">{formatDate(r.createdAt)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { tr, t } = useLang();
  const { qtyInCart, addToCart, setQty, busyId, lineKey, wishlistIds, toggleWishlist } = useShop();
  const { data: product, loading, error, reload } = useFetch(() => catalogApi.product(slug), [slug]);
  const [activeImg, setActiveImg] = useState(0);
  const [pickQty, setPickQty] = useState(1);
  const [variantId, setVariantId] = useState(null); // chosen option; null = the default one

  const id = getId(product);
  const related = useFetch(() => (id ? catalogApi.related(id, 10) : Promise.resolve({ data: [] })), [id]);

  if (loading) return <Spinner />;
  if (error) return <div className="page container"><ErrorState error={error} onRetry={reload} /></div>;
  if (!product) return null;

  const title = tr(product.title);
  const withOptions = hasVariants(product);
  // With options, price / stock / photo come from the chosen variant
  const variant = withOptions ? product.variants.find((v) => v.id === variantId) || defaultVariant(product) : null;
  const vId = variant?.id;
  const price = variant ? variant.price : product.price;
  const mrp = variant ? variant.mrp : product.mrp;
  const stock = variant ? variant.stock : product.stock;
  const unit = variant ? tr(variant.label) : product.unit;
  const baseImages = product.images?.length ? product.images : [null];
  const images = variant?.images?.length ? [...variant.images, ...product.images] : baseImages;
  const qty = qtyInCart(id, vId);
  const busy = busyId === lineKey(id, vId);
  const outOfStock = stock !== undefined && stock <= 0;
  const off = discountPercent(mrp, price);

  function chooseVariant(v) {
    setVariantId(v.id);
    setPickQty(1);
    setActiveImg(0);
  }
  const relatedList = asList(related.data);

  return (
    <div className="page container">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">{t('Home')}</Link> / <Link to="/products">{t('Shop')}</Link>
        {product.category?.name && (
          <> / <Link to={`/products?category=${getId(product.category)}`}>{tr(product.category.name)}</Link></>
        )}
      </nav>

      <div className="pdp">
        <div className="pdp__gallery">
          <div className="pdp__main">
            <ProductImage src={images[activeImg]} alt={title} />
            {off > 0 && <span className="tag-off tag-off--lg">{t('{off}% off', { off })}</span>}
          </div>
          {images.length > 1 && (
            <div className="pdp__thumbs">
              {images.map((img, i) => (
                <button key={i} className={i === activeImg ? 'is-on' : ''} onClick={() => setActiveImg(i)} aria-label={`Image ${i + 1}`}>
                  <ProductImage src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdp__info">
          {product.brand && <span className="pdp__brand">{product.brand}</span>}
          <h1 className="pdp__title">{title}</h1>
          <span className="pdp__unit">{unit}</span>

          <Price price={price} mrp={mrp} size="lg" />
          <p className="muted small">{t('Inclusive of all taxes')}</p>

          {withOptions && (
            <div className="variant-picker">
              <span className="field__label">{tr(product.optionName)}</span>
              <div className="variant-chips" role="radiogroup" aria-label={tr(product.optionName)}>
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    role="radio"
                    aria-checked={v.id === vId}
                    className={`variant-chip ${v.id === vId ? 'is-on' : ''} ${v.inStock ? '' : 'is-oos'}`}
                    onClick={() => chooseVariant(v)}
                  >
                    <strong>{tr(v.label)}</strong>
                    <span>{v.inStock ? money(v.price) : t('Out of stock')}</span>
                    {v.discountPercent > 0 && v.inStock && <em>{t('{off}% off', { off: v.discountPercent })}</em>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pdp__buy">
            {outOfStock ? (
              <span className="pcard__oos">{t('Out of stock')}</span>
            ) : qty > 0 ? (
              <>
                <QtyStepper qty={qty} busy={busy} max={stock} onChange={(n) => setQty(id, n, vId)} />
                <Link to="/cart" className="btn btn--primary btn--grow">{t('Go to cart')}</Link>
              </>
            ) : (
              <>
                <QtyStepper qty={pickQty} max={stock} onChange={(n) => setPickQty(Math.max(1, n))} />
                <button className="btn btn--primary btn--grow" disabled={busy} onClick={() => addToCart(id, pickQty, vId)}>
                  {t('Add to cart')}
                </button>
              </>
            )}
            <button
              className={`icon-btn ${wishlistIds.has(id) ? 'is-saved' : ''}`}
              onClick={() => toggleWishlist(id)}
              aria-label={t('Save to wishlist')}
            >
              <Heart size={20} />
            </button>
            <ShareButton title={title} price={price} mrp={mrp} />
          </div>

          {stock > 0 && stock <= 10 && <p className="low-stock">{t('Only {n} left', { n: stock })}</p>}

          <ul className="pdp__perks">
            <li><Truck size={18} /> {t('Delivered from your local store')}</li>
            <li><RotateCcw size={18} /> {t('Cancel any time before it ships')}</li>
          </ul>

          {product.description && (
            <div className="pdp__desc">
              <h2>{t('About this product')}</h2>
              <p>{tr(product.description)}</p>
            </div>
          )}
        </div>
      </div>

      <Reviews productId={id} />

      {relatedList.length > 0 && (
        <section className="shelf">
          <div className="section-head"><h2>{t('You may also need')}</h2></div>
          <div className="shelf__row">
            {relatedList.map((p) => <ProductCard key={getId(p)} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
