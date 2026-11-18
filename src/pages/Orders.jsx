import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { orderApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { asList, getId, money, formatDate, STATUS_LABELS } from '../lib/format';
import { Spinner, ErrorState, EmptyState } from '../components/States';

export function StatusPill({ status }) {
  return <span className={`pill pill--${status}`}>{STATUS_LABELS[status] || status}</span>;
}

export default function Orders() {
  const { data, loading, error, reload } = useFetch(() => orderApi.list(1), []);
  const orders = asList(data);

  return (
    <div className="page container narrow">
      <h1 className="page-title">Your orders</h1>
      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && orders.length === 0 && (
        <EmptyState icon={Package} title="No orders yet" text="Orders you place will show up here with live tracking." action="Start shopping" to="/products" />
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
                  {formatDate(o.createdAt)}{count ? `, ${count} item${count > 1 ? 's' : ''}` : ''}
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
    </div>
  );
}
