import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { useLang } from '../context/LangContext';
import { asList, getId, imageUrl } from '../lib/format';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton, ErrorState } from '../components/States';
import CategoryChip from '../components/CategoryChip';

// Banner links use slugs, but GET /products filters by category id — map them to app routes
function bannerRoute(link, categories) {
  if (!link || !link.startsWith('/')) return null;
  const [, type, slug] = link.split('/');
  if (type === 'products' && slug) return `/product/${slug}`;
  if (type === 'category' && slug) {
    const cat = categories.find((c) => c.slug === slug);
    return cat ? `/products?category=${getId(cat)}` : '/products';
  }
  return link;
}

function BannerStrip({ banners, categories }) {
  const { tr } = useLang();
  const ref = useRef(null);
  const [active, setActive] = useState(0);

  // Gentle auto-advance; pauses when the shopper prefers reduced motion
  useEffect(() => {
    if (banners.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => {
      const next = (active + 1) % banners.length;
      ref.current?.children[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }, 5000);
    return () => clearInterval(timer);
  }, [active, banners.length]);

  function onScroll() {
    const el = ref.current;
    if (el) setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <section className="banners" aria-label="Offers">
      <div className="banners__track" ref={ref} onScroll={onScroll}>
        {banners.map((b) => {
          // Banner images carry their own text, so the title is used as alt text only
          const inner = <img src={imageUrl(b.image)} alt={tr(b.title)} />;
          const to = bannerRoute(b.link, categories);
          return to ? (
            <Link key={getId(b)} to={to} className="banners__slide">{inner}</Link>
          ) : (
            <div key={getId(b)} className="banners__slide">{inner}</div>
          );
        })}
      </div>
      {banners.length > 1 && (
        <div className="banners__dots">
          {banners.map((b, i) => <span key={getId(b)} className={i === active ? 'is-on' : ''} />)}
        </div>
      )}
    </section>
  );
}

function Shelf({ title, sort }) {
  const { t } = useLang();
  const { data, loading, error, reload } = useFetch(() => catalogApi.products({ page: 1, limit: 10, sort }), [sort]);
  const products = asList(data);

  return (
    <section className="shelf">
      <div className="section-head">
        <h2>{t(title)}</h2>
        <Link to={`/products?sort=${sort}`}>{t('See all')}</Link>
      </div>
      {loading && <ProductGridSkeleton count={4} />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && (
        <div className="shelf__row">
          {products.map((p) => <ProductCard key={getId(p)} product={p} />)}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const { t } = useLang();
  const banners = useFetch(() => catalogApi.banners(), []);
  const categories = useFetch(() => catalogApi.categories(), []);
  const bannerList = asList(banners.data);
  const categoryList = asList(categories.data);

  return (
    <div className="page page--home">
      {bannerList.length > 0 ? (
        <BannerStrip banners={bannerList} categories={categoryList} />
      ) : (
        !banners.loading && (
          <section className="hero">
            <div className="hero__price" aria-hidden="true">
              <span>₹</span>85
              <s>₹99</s>
            </div>
            <div>
              <h1>{t('Your town’s lowest prices, delivered home.')}</h1>
              <p>{t('Groceries and daily needs from Aali Market. Every price shows how much you save on MRP.')}</p>
              <Link to="/products?sort=discount" className="btn btn--haldi">{t('Shop biggest savings')}</Link>
            </div>
          </section>
        )
      )}

      {categoryList.length > 0 && (
        <section className="shelf">
          <div className="section-head">
            <h2>{t('Shop by category')}</h2>
            <Link to="/categories">{t('All categories')}</Link>
          </div>
          <div className="chip-row">
            {categoryList.map((c) => <CategoryChip key={getId(c)} category={c} />)}
          </div>
        </section>
      )}

      <Shelf title="Biggest savings today" sort="discount" />
      <Shelf title="Most bought" sort="popular" />
      <Shelf title="New in store" sort="newest" />
    </div>
  );
}
