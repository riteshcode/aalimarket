import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { adminApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { useAuth } from '../context/AuthContext';
import { money, formatDate, PAYMENT_LABELS } from '../lib/format';
import { useStoreInfo } from '../pages/legal/useStoreInfo';
import { Spinner, ErrorState } from '../components/States';

// Printable bill + packing slip. Opens in a new tab from the order drawer and prints itself.
export default function PrintBill() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const store = useStoreInfo();
  const { data: order, loading, error, reload } = useFetch(() => adminApi.order(id), [id]);

  useEffect(() => {
    if (order) setTimeout(() => window.print(), 300);
  }, [order]);

  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  if (loading) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const addr = order.shippingAddress || {};
  const pricing = order.pricing || {};
  const isCod = order.paymentMethod === 'cod';

  return (
    <div className="bill-print">
      <div className="bill-print__actions no-print">
        <button className="btn btn--primary" onClick={() => window.print()}>Print</button>
        <button className="btn btn--ghost" onClick={() => window.close()}>Close</button>
      </div>

      <header className="bill-print__head">
        <div>
          <h1>{store.name}</h1>
          <p>{store.address}</p>
          <p>Phone: {store.phone}</p>
          <p>FSSAI: {store.fssai}{store.gstin && `, GSTIN: ${store.gstin}`}</p>
        </div>
        <div className="bill-print__meta">
          <h2>Bill</h2>
          <p><strong>#{order.orderNumber}</strong></p>
          <p>{formatDate(order.createdAt, true)}</p>
        </div>
      </header>

      <section className="bill-print__to">
        <h3>Deliver to</h3>
        <p><strong>{order.user?.name}</strong>, {order.user?.mobile}</p>
        <p>{[addr.line1, addr.line2, addr.landmark].filter(Boolean).join(', ')}</p>
        <p>{addr.city}, {addr.state} {addr.pincode}</p>
        {order.deliveryNote && <p><strong>Note:</strong> {order.deliveryNote}</p>}
        {order.rider && <p><strong>Rider:</strong> {order.rider.name}, {order.rider.mobile}</p>}
      </section>

      <table className="bill-print__table">
        <thead>
          <tr><th>✓</th><th>Item</th><th>Pack</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
        </thead>
        <tbody>
          {order.items.map((it, i) => (
            <tr key={i}>
              <td className="tick" />
              <td>{it.title.en}<br /><small>{it.title.hi}</small></td>
              <td>{it.unit}</td>
              <td>{it.qty}</td>
              <td>{money(it.price)}</td>
              <td>{money(it.price * it.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="bill-print__totals">
        <tbody>
          <tr><td>Items total</td><td>{money(pricing.subtotal)}</td></tr>
          {pricing.discount > 0 && <tr><td>Coupon {order.couponCode}</td><td>−{money(pricing.discount)}</td></tr>}
          <tr><td>Delivery</td><td>{pricing.deliveryFee ? money(pricing.deliveryFee) : 'Free'}</td></tr>
          {pricing.handlingFee > 0 && <tr><td>Handling</td><td>{money(pricing.handlingFee)}</td></tr>}
          <tr className="grand"><td>Total</td><td>{money(pricing.total)}</td></tr>
        </tbody>
      </table>

      <p className={`bill-print__pay ${isCod && order.paymentStatus !== 'paid' ? 'is-cod' : ''}`}>
        {isCod && order.paymentStatus !== 'paid'
          ? `COLLECT CASH: ${money(pricing.total)}`
          : `${PAYMENT_LABELS[order.paymentMethod]}: ${order.paymentStatus === 'paid' ? 'PAID' : order.paymentStatus.toUpperCase()}`}
      </p>

      <p className="bill-print__thanks">Thank you for shopping with {store.name}!</p>
    </div>
  );
}
