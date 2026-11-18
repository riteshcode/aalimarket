import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { asList, formatDate } from '../lib/format';
import { Spinner, ErrorState } from '../components/States';

export default function AdminCustomers() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const { data, meta, loading, error, reload } = useFetch(() => adminApi.users({ page, limit: 20, q: search }), [page, search]);
  const users = asList(data);
  const pages = meta?.pages || 1;

  return (
    <div className="admin-page">
      <div className="admin-head">
        <h1 className="admin-title">Customers</h1>
        {meta && <span className="muted">{meta.total} total</span>}
      </div>

      <form className="search search--admin" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q.trim()); }}>
        <Search size={18} />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or mobile" />
      </form>

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && (
        <div className="card card--flush">
          <table className="table">
            <thead><tr><th>Name</th><th>Mobile</th><th>Orders</th><th>Joined</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong>{u.email && <span className="muted small">{u.email}</span>}</td>
                  <td><a href={`tel:${u.mobile}`} className="link-btn">{u.mobile}</a></td>
                  <td>
                    {u.ordersCount > 0 ? <Link to={`/admin/orders?q=${u.mobile}`} className="link-btn">{u.ordersCount}</Link> : 0}
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={4} className="muted center">No customers found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="pager">
          <button className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button className="btn btn--ghost btn--sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
