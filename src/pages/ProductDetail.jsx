import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Star, Truck, RotateCcw } from 'lucide-react';
import { catalogApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { useShop } from '../context/ShopContext';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { asList, getId, formatDate, discountPercent } from '../lib/format';
import Price from '../components/Price';
import QtyStepper from '../components/QtyStepper';
import ProductImage from '../components/ProductImage';
import ProductCard from '../components/ProductCard';
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
  const { data, loading, reload } = useFetch(() => catalogApi.reviews(productId), [productId]);
  const reviews = asList(data);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await catalogApi.addReview(productId, { rating, comment });
      toast.success(t('Review posted'));
      setComment('');
      setOpen(false);
      reload();
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
        {isLoggedIn && !open && <button className="link-btn" onClick={() => setOpen(true)}>{t('Write a review')}</button>}
      </div>

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
  const { qtyInCart, addToCart, setQty, busyId, wishlistIds, toggleWishlist } = useShop();
  const { data: product, loading, error, reload } = useFetch(() => catalogApi.product(slug), [slug]);
  const [activeImg, setActiveImg] = useState(0);
  const [pickQty, setPickQty] = useState(1);

  const id = getId(product);
  const related = useFetch(() => (id ? catalogApi.related(id, 10) : Promise.resolve({ data: [] })), [id]);

  if (loading) return <Spinner />;
  if (error) return <div className="page container"><ErrorState error={error} onRetry={reload} /></div>;
  if (!product) return null;

  const title = tr(product.title);
  const images = product.images?.length ? product.images : [null];
  const qty = qtyInCart(id);
  const outOfStock = product.stock !== undefined && product.stock <= 0;
  const off = discountPercent(product.mrp, product.price);
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
          <span className="pdp__unit">{product.unit}</span>

          <Price price={product.price} mrp={product.mrp} size="lg" />
          <p className="muted small">{t('Inclusive of all taxes')}</p>

          <div className="pdp__buy">
            {outOfStock ? (
              <span className="pcard__oos">{t('Out of stock')}</span>
            ) : qty > 0 ? (
              <>
                <QtyStepper qty={qty} busy={busyId === id} max={product.stock} onChange={(n) => setQty(id, n)} />
                <Link to="/cart" className="btn btn--primary btn--grow">{t('Go to cart')}</Link>
              </>
            ) : (
              <>
                <QtyStepper qty={pickQty} max={product.stock} onChange={(n) => setPickQty(Math.max(1, n))} />
                <button className="btn btn--primary btn--grow" disabled={busyId === id} onClick={() => addToCart(id, pickQty)}>
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
          </div>

          {product.stock > 0 && product.stock <= 10 && <p className="low-stock">{t('Only {n} left', { n: product.stock })}</p>}

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
