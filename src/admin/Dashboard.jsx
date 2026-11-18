import { Link } from 'react-router-dom';
import { ShoppingBag, IndianRupee, Clock, Bike, AlertTriangle, Users } from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { asList, getId, money, formatDate, PAYMENT_LABELS } from '../lib/format';
import { useLang } from '../context/LangContext';
import { StatusPill } from '../pages/Orders';

export default function Dashboard() {
  const { tr } = useLang();
  const stats = useFetch(() => adminApi.stats(), []);
  const recent = useFetch(() => adminApi.orders({ page: 1, limit: 6 }), []);
  const lowStock = useFetch(() => adminApi.products({ lowStock: 'true', isActive: 'true', limit: 8 }), []);
  const s = stats.data || {};

  const tiles = [
    { label: 'Orders today', value: s.todayOrders, to: '/admin/orders', icon: ShoppingBag },
    { label: 'Revenue today', value: s.todayRevenue !== undefined ? money(s.todayRevenue) : undefined, to: '/admin/orders', icon: IndianRupee },
    { label: 'To pack and ship', value: s.pendingOrders, to: '/admin/orders', icon: Clock },
    { label: 'Out for delivery', value: s.outForDelivery, to: '/admin/orders?status=out_for_delivery', icon: Bike },
    { label: 'Low on stock', value: s.lowStockCount, to: '/admin/products?lowStock=true', icon: AlertTriangle },
    { label: 'Customers', value: s.totalCustomers, to: '/admin/customers', icon: Users },
  ];

  return (
    <div className="admin-page">
      <h1 className="admin-title">Overview</h1>

      <div className="tiles tiles--6">
        {tiles.map(({ label, value, to, icon: Icon }) => (
          <Link key={label} to={to} className="tile">
            <Icon size={20} />
            <strong>{value ?? '–'}</strong>
            <span>{label}</span>
          </Link>
        ))}
      </div>

      <section className="card">
        <div className="card__head">
          <h2>Latest orders</h2>
          <Link to="/admin/orders" className="link-btn">All orders</Link>
        </div>
        <table className="table">
          <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {asList(recent.data).map((o) => (
              <tr key={getId(o)}>
                <td><Link to={`/admin/orders?open=${getId(o)}`}><strong>#{o.orderNumber}</strong></Link><span className="muted small">{formatDate(o.createdAt, true)}</span></td>
                <td>{o.user?.name}<span className="muted small">{o.user?.mobile}</span></td>
                <td>{money(o.pricing?.total)}<span className="muted small">{PAYMENT_LABELS[o.paymentMethod]}</span></td>
                <td><StatusPill status={o.status} /></td>
              </tr>
            ))}
            {!recent.loading && asList(recent.data).length === 0 && <tr><td colSpan={4} className="muted center">No orders yet.</td></tr>}
          </tbody>
        </table>
      </section>

      <section className="card">
        <div className="card__head">
          <h2><AlertTriangle size={18} /> Running low</h2>
          <Link to="/admin/products?lowStock=true" className="link-btn">Manage stock</Link>
        </div>
        {asList(lowStock.data).length === 0 ? (
          <p className="muted">Every product has enough stock.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Product</th><th>Price</th><th>Stock</th></tr></thead>
            <tbody>
              {asList(lowStock.data).map((p) => (
                <tr key={getId(p)}>
                  <td>{tr(p.title)} <span className="muted small">{p.unit}</span></td>
                  <td>{money(p.price)}</td>
                  <td><span className={`pill ${p.stock <= 0 ? 'pill--cancelled' : 'pill--packed'}`}>{p.stock <= 0 ? 'Out' : p.stock}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
