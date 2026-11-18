import { useState } from 'react';
import { adminApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { money } from '../lib/format';
import { useLang } from '../context/LangContext';
import { Spinner, ErrorState } from '../components/States';

// YYYY-MM-DD in the phone's local time (the backend treats it as an IST day)
function dayString(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
const daysAgo = (n) => dayString(new Date(Date.now() - n * 86400000));

// The API leaves out days with no orders; for a daily chart we put them back as zero
function fillDays(rows, from, to) {
  const byDay = Object.fromEntries(rows.map((r) => [r.period, r]));
  const out = [];
  for (let d = new Date(from + 'T00:00:00'); dayString(d) <= to; d.setDate(d.getDate() + 1)) {
    const key = dayString(d);
    out.push(byDay[key] || { period: key, orders: 0, revenue: 0, avgOrderValue: 0 });
  }
  return out;
}

function shortLabel(period, groupBy) {
  if (groupBy !== 'day') return period;
  const d = new Date(period + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function SalesReport({ from, to }) {
  const [groupBy, setGroupBy] = useState('day');
  const { data, loading, error, reload } = useFetch(() => adminApi.salesReport({ from, to, groupBy }), [from, to, groupBy]);

  const raw = data || [];
  const rows = groupBy === 'day' ? fillDays(raw, from, to) : raw;
  const totalOrders = raw.reduce((s, r) => s + r.orders, 0);
  const totalRevenue = raw.reduce((s, r) => s + r.revenue, 0);
  const maxRevenue = Math.max(1, ...rows.map((r) => r.revenue));

  return (
    <section className="card">
      <div className="card__head">
        <h2>Sales</h2>
        <div className="seg">
          {['day', 'week', 'month'].map((g) => (
            <button key={g} type="button" className={groupBy === g ? 'is-on' : ''} onClick={() => setGroupBy(g)}>
              {g[0].toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && (
        <>
          <div className="tiles report-tiles">
            <div className="tile"><strong>{totalOrders}</strong><span>Orders</span></div>
            <div className="tile"><strong>{money(totalRevenue)}</strong><span>Revenue</span></div>
            <div className="tile"><strong>{money(totalOrders ? Math.round(totalRevenue / totalOrders) : 0)}</strong><span>Average order</span></div>
          </div>

          {rows.length === 0 ? (
            <p className="muted">No orders in this period.</p>
          ) : (
            <div className="bars" role="img" aria-label="Revenue by period">
              {rows.map((r) => (
                <div key={r.period} className="bars__col" title={`${r.period}: ${money(r.revenue)}, ${r.orders} orders`}>
                  <span className="bars__value">{r.revenue ? money(r.revenue) : ''}</span>
                  <span className="bars__bar" style={{ height: `${(r.revenue / maxRevenue) * 100}%` }} />
                  <span className="bars__label">{shortLabel(r.period, groupBy)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function TopProducts({ from, to }) {
  const { tr } = useLang();
  const { data, loading, error, reload } = useFetch(() => adminApi.topProducts({ from, to, limit: 10 }), [from, to]);
  const rows = data || [];

  return (
    <section className="card">
      <h2 className="card__title">Top products</h2>
      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && (
        <table className="table">
          <thead><tr><th>#</th><th>Product</th><th>Qty sold</th><th>Revenue</th></tr></thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.productId}>
                <td className="muted">{i + 1}</td>
                <td>{tr(p.title)}</td>
                <td>{p.qtySold}</td>
                <td>{money(p.revenue)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="muted center">No sales in this period.</td></tr>}
          </tbody>
        </table>
      )}
    </section>
  );
}

function CodReport() {
  const [date, setDate] = useState(daysAgo(0));
  const { data, loading, error, reload } = useFetch(() => adminApi.codReport(date), [date]);
  const pending = data ? data.totalExpected - data.totalCollected : 0;

  return (
    <section className="card">
      <div className="card__head">
        <h2>Cash on delivery</h2>
        <label className="date-field">Day <input type="date" value={date} max={daysAgo(0)} onChange={(e) => setDate(e.target.value)} /></label>
      </div>
      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && !loading && (
        <>
          <div className="tiles report-tiles">
            <div className="tile"><strong>{money(data.totalExpected)}</strong><span>Should come in</span></div>
            <div className="tile"><strong>{money(data.totalCollected)}</strong><span>Collected</span></div>
            <div className={`tile ${pending > 0 ? 'tile--warn' : ''}`}><strong>{money(pending)}</strong><span>Still to collect</span></div>
          </div>
          <table className="table">
            <thead><tr><th>Rider</th><th>COD orders</th><th>Expected</th><th>Collected</th><th>Difference</th></tr></thead>
            <tbody>
              {data.byRider.map((row, i) => {
                const diff = row.expected - row.collected;
                return (
                  <tr key={row.rider?.id || `none-${i}`}>
                    <td>{row.rider ? <><strong>{row.rider.name}</strong><span className="muted small">{row.rider.mobile}</span></> : <span className="muted">Not assigned</span>}</td>
                    <td>{row.orders}</td>
                    <td>{money(row.expected)}</td>
                    <td>{money(row.collected)}</td>
                    <td className={diff > 0 ? 'warn' : ''}>{diff > 0 ? money(diff) : '–'}</td>
                  </tr>
                );
              })}
              {data.byRider.length === 0 && <tr><td colSpan={5} className="muted center">No cash orders on this day.</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

export default function AdminReports() {
  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(daysAgo(0));

  function preset(days) {
    setFrom(daysAgo(days - 1));
    setTo(daysAgo(0));
  }

  return (
    <div className="admin-page">
      <h1 className="admin-title">Reports</h1>

      <div className="admin-filters">
        <div className="chip-scroll">
          <button className="chip" onClick={() => preset(1)}>Today</button>
          <button className="chip" onClick={() => preset(7)}>Last 7 days</button>
          <button className="chip" onClick={() => preset(30)}>Last 30 days</button>
        </div>
        <label className="date-field">From <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="date-field">To <input type="date" value={to} min={from} max={daysAgo(0)} onChange={(e) => setTo(e.target.value)} /></label>
      </div>

      <SalesReport from={from} to={to} />
      <TopProducts from={from} to={to} />
      <CodReport />
    </div>
  );
}
