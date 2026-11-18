import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX, SlidersHorizontal, X } from 'lucide-react';
import { catalogApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { useLang } from '../context/LangContext';
import { asList, getId, toPaise, money } from '../lib/format';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton, ErrorState, EmptyState } from '../components/States';

const SORTS = [
  { value: 'popular', label: 'Popular' },
  { value: 'discount', label: 'Biggest saving' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest' },
];

const PAGE_SIZE = 20;

export default function Products() {
  const { tr, t } = useLang();
  const [params, setParams] = useSearchParams();
  const sort = params.get('sort') || 'popular';
  const category = params.get('category') || '';
  const q = params.get('q') || '';
  // Extra filters, kept in the URL so they survive refresh. Prices in the URL are rupees.
  const minPrice = params.get('min') || '';
  const maxPrice = params.get('max') || '';
  const brand = params.get('brand') || '';
  const inStock = params.get('inStock') || '';
  const filterCount = [minPrice, maxPrice, brand, inStock].filter(Boolean).length;
  const [showFilters, setShowFilters] = useState(false);

  const categories = useFetch(() => catalogApi.categories(), []);
  const categoryList = asList(categories.data);

  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reset list whenever filters change
  useEffect(() => {
    setPage(1);
    load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, category, q, minPrice, maxPrice, brand, inStock]);

  async function load(pageNo, replace = false) {
    setLoading(true);
    setError(null);
    try {
      // category = category id, q = text search (whole words). Empty values are skipped by the API client.
      const { data, meta } = await catalogApi.products({
        page: pageNo,
        limit: PAGE_SIZE,
        sort,
        category,
        q,
        minPrice: minPrice ? toPaise(minPrice) : '',
        maxPrice: maxPrice ? toPaise(maxPrice) : '',
        brand,
        inStock,
      });
      const list = asList(data);
      setItems((prev) => (replace ? list : [...prev, ...list]));
      setTotal(meta?.total ?? list.length);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  }

  function applyFilters(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const next = new URLSearchParams(params);
    ['min', 'max', 'brand'].forEach((key) => {
      const value = String(form.get(key) || '').trim();
      value ? next.set(key, value) : next.delete(key);
    });
    form.get('inStock') ? next.set('inStock', 'true') : next.delete('inStock');
    setParams(next);
    setShowFilters(false);
  }

  function clearFilters() {
    const next = new URLSearchParams(params);
    ['min', 'max', 'brand', 'inStock'].forEach((key) => next.delete(key));
    setParams(next);
    setShowFilters(false);
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    load(next);
  }

  const activeCategory = categoryList.find((c) => getId(c) === category);
  const heading = q ? t('Results for “{q}”', { q }) : activeCategory ? tr(activeCategory.name) : t('All products');

  return (
    <div className="page container">
      <div className="list-head">
        <h1 className="page-title">{heading}</h1>
        {!loading && <span className="muted">{t('{n} items', { n: total })}</span>}
      </div>

      <div className="filters">
        <div className="chip-scroll" role="tablist" aria-label="Category">
          <button className={`chip ${!category ? 'is-on' : ''}`} onClick={() => updateParam('category', '')}>{t('All')}</button>
          {categoryList.map((c) => (
            <button
              key={getId(c)}
              className={`chip ${category === getId(c) ? 'is-on' : ''}`}
              onClick={() => updateParam('category', getId(c))}
            >
              {tr(c.name)}
            </button>
          ))}
        </div>
        <div className="filters__end">
          <button className={`chip ${filterCount ? 'is-on' : ''}`} onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}>
            <SlidersHorizontal size={15} /> {t('Filters')}{filterCount ? ` (${filterCount})` : ''}
          </button>
          <label className="sort">
            <span className="sr-only">{t('Sort by')}</span>
            <select value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{t(s.label)}</option>)}
            </select>
          </label>
        </div>
      </div>

      {showFilters && (
        // key resets the uncontrolled inputs when the URL filters change
        <form className="card filter-panel" onSubmit={applyFilters} key={`${minPrice}-${maxPrice}-${brand}-${inStock}`}>
          <div className="filter-panel__row">
            <label className="field">
              <span className="field__label">{t('Min price (₹)')}</span>
              <input name="min" type="number" min="0" inputMode="numeric" defaultValue={minPrice} />
            </label>
            <label className="field">
              <span className="field__label">{t('Max price (₹)')}</span>
              <input name="max" type="number" min="0" inputMode="numeric" defaultValue={maxPrice} />
            </label>
            <label className="field">
              <span className="field__label">{t('Brand')}</span>
              <input name="brand" defaultValue={brand} placeholder="Aashirvaad" />
            </label>
          </div>
          <label className="check">
            <input type="checkbox" name="inStock" defaultChecked={inStock === 'true'} />
            {t('Only show items in stock')}
          </label>
          <div className="row-end">
            {filterCount > 0 && <button type="button" className="btn btn--ghost" onClick={clearFilters}><X size={16} /> {t('Clear')}</button>}
            <button className="btn btn--primary">{t('Apply filters')}</button>
          </div>
        </form>
      )}

      {filterCount > 0 && !showFilters && (
        <p className="muted small">
          {[
            minPrice && `${t('From')} ${money(toPaise(minPrice))}`,
            maxPrice && `${t('Up to')} ${money(toPaise(maxPrice))}`,
            brand,
            inStock && t('In stock'),
          ].filter(Boolean).join(', ')}{' '}
          <button className="link-btn" onClick={clearFilters}>{t('Clear')}</button>
        </p>
      )}

      {error && <ErrorState error={error} onRetry={() => load(1, true)} />}

      {!error && items.length === 0 && loading && <ProductGridSkeleton />}

      {!error && !loading && items.length === 0 && (
        <EmptyState icon={SearchX} title={t('Nothing matches')} text={t('Try another word or clear the filters.')} />
      )}

      <div className="pgrid">
        {items.map((p) => <ProductCard key={getId(p)} product={p} />)}
      </div>

      {items.length > 0 && items.length < total && (
        <div className="load-more">
          <button className="btn btn--ghost" onClick={loadMore} disabled={loading}>
            {loading ? t('Loading…') : t('Show more products')}
          </button>
        </div>
      )}
    </div>
  );
}
