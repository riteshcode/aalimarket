import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { orderApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { asList, getId, money, formatDate, STATUS_LABELS } from '../lib/format';
import { Spinner, ErrorState, EmptyState } from '../components/States';
import { useLang } from '../context/LangContext';

// raw = keep the English label (admin panel stays in English)
export function StatusPill({ status, raw }) {
  const { t } = useLang();
  const label = STATUS_LABELS[status] || status;
  return <span className={`pill pill--${status}`}>{raw ? label : t(label)}</span>;
}

export default function Orders() {
  const { t } = useLang();
  const { data, meta, loading, error, reload } = useFetch(() => orderApi.list(1), []);
  // Older orders, loaded 20 at a time with "Show older orders"
  const [older, setOlder] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const orders = [...asList(data), ...older];
  const hasMore = page < (meta?.pages || 1);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await orderApi.list(next);
      setOlder((list) => [...list, ...asList(res.data)]);
      setPage(next);
    } catch {
      // keep what we have; the button stays so they can try again
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="page container narrow">
      <h1 className="page-title">{t('Your orders')}</h1>
      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && orders.length === 0 && (
        <EmptyState icon={Package} title={t('No orders yet')} text={t('Orders you place will show up here with live tracking.')} action={t('Start shopping')} to="/products" />
      )}
      <div className="order-list">
        {orders.map((o) => {
          const count = o.items?.length ?? o.itemCount;
          return (
            <Link key={getId(o)} to={`/orders/${getId(o)}`} className="card order-row">
              <div>
                <div className="order-row__top">
                  <strong>#{o.orderNumber || getId(o)}</strong>
                  <StatusPill status={o.status} />
                </div>
                <p className="muted small">
                  {formatDate(o.createdAt)}{count ? `, ${t('{n} items', { n: count })}` : ''}
                </p>
              </div>
              <div className="order-row__end">
                <strong>{money(o.pricing?.total)}</strong>
                <ChevronRight size={18} />
              </div>
            </Link>
          );
        })}
      </div>
      {hasMore && (
        <div className="load-more">
          <button className="btn btn--ghost" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? t('Loading…') : t('Show older orders')}
          </button>
        </div>
      )}
    </div>
  );
}
