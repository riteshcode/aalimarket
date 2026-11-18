import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { catalogApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { useLang } from '../context/LangContext';
import { asList, getId } from '../lib/format';
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
  const { tr } = useLang();
  const [params, setParams] = useSearchParams();
  const sort = params.get('sort') || 'popular';
  const category = params.get('category') || '';
  const q = params.get('q') || '';

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
  }, [sort, category, q]);

  async function load(pageNo, replace = false) {
    setLoading(true);
    setError(null);
    try {
      // category = category id, q = text search (whole words). Empty values are skipped by the API client.
      const { data, meta } = await catalogApi.products({ page: pageNo, limit: PAGE_SIZE, sort, category, q });
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

  function loadMore() {
    const next = page + 1;
    setPage(next);
    load(next);
  }

  const activeCategory = categoryList.find((c) => getId(c) === category);
  const heading = q ? `Results for “${q}”` : activeCategory ? tr(activeCategory.name) : 'All products';

  return (
    <div className="page container">
      <div className="list-head">
        <h1 className="page-title">{heading}</h1>
        {!loading && <span className="muted">{total} items</span>}
      </div>

      <div className="filters">
        <div className="chip-scroll" role="tablist" aria-label="Category">
          <button className={`chip ${!category ? 'is-on' : ''}`} onClick={() => updateParam('category', '')}>All</button>
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
        <label className="sort">
          <span className="sr-only">Sort by</span>
          <select value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {error && <ErrorState error={error} onRetry={() => load(1, true)} />}

      {!error && items.length === 0 && loading && <ProductGridSkeleton />}

      {!error && !loading && items.length === 0 && (
        <EmptyState icon={SearchX} title="Nothing matches" text="Try another word or clear the category filter." />
      )}

      <div className="pgrid">
        {items.map((p) => <ProductCard key={getId(p)} product={p} />)}
      </div>

      {items.length > 0 && items.length < total && (
        <div className="load-more">
          <button className="btn btn--ghost" onClick={loadMore} disabled={loading}>
            {loading ? 'Loading…' : 'Show more products'}
          </button>
        </div>
      )}
    </div>
  );
}
