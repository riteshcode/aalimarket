import LegalPage from './LegalPage';
import { useStoreInfo } from './useStoreInfo';

export default function Terms() {
  const store = useStoreInfo();
  return (
    <LegalPage title="Terms of Use" updated="November 2026">
      <p>By using the {store.name} website or app, you agree to these terms.</p>

      <h2>Orders</h2>
      <ul>
        <li>An order is confirmed once you receive an order number.</li>
        <li>We may cancel an order if an item is out of stock, the price shown was clearly wrong, or we can’t deliver to your address. If you already paid, you’ll get a full refund.</li>
        <li>Product photos are for reference; packaging may differ slightly.</li>
      </ul>

      <h2>Prices and payment</h2>
      <ul>
        <li>All prices are in Indian Rupees and include applicable taxes.</li>
        <li>Delivery and handling charges, if any, are shown before you place the order.</li>
        <li>You can pay by cash on delivery, UPI, card or net banking where available.</li>
      </ul>

      <h2>Coupons</h2>
      <p>Each coupon has its own conditions (minimum order, validity, usage limit). We may withdraw a coupon that is being misused.</p>

      <h2>Delivery</h2>
      <p>We deliver to the areas listed at checkout. Delivery times are estimates and can change due to weather, traffic or high demand.</p>

      <h2>Your account</h2>
      <p>Keep your phone secure, since the OTP sent to it gives access to your account. Tell us right away if you think someone else is using it.</p>

      <h2>Contact</h2>
      <p>{store.name}, {store.address}<br />Phone: {store.phone}, Email: {store.email}</p>
    </LegalPage>
  );
}
