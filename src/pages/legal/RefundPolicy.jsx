import LegalPage from './LegalPage';
import { useStoreInfo } from './useStoreInfo';

export default function RefundPolicy() {
  const store = useStoreInfo();
  return (
    <LegalPage title="Cancellation and Refund Policy" updated="November 2026">
      <h2>Cancelling an order</h2>
      <p>
        You can cancel an order from the order page until it is shipped (while it shows <em>Order placed</em>,{' '}
        <em>Confirmed</em> or <em>Packed</em>). After that, contact us and we’ll do our best to help.
      </p>

      <h2>Returns</h2>
      <ul>
        <li>If an item arrives damaged, expired, or is not what you ordered, tell us within 24 hours of delivery with a photo.</li>
        <li>Fresh produce (fruits, vegetables, dairy) can be reported at the door or within 24 hours.</li>
        <li>Opened or used items can’t be returned unless they were faulty.</li>
      </ul>

      <h2>Refunds</h2>
      <ul>
        <li>Online payments are refunded to the original payment method within 5–7 working days after approval.</li>
        <li>Cash on delivery orders are refunded by UPI or bank transfer to the details you share with us.</li>
        <li>If you cancel a prepaid order before it ships, the full amount is refunded.</li>
      </ul>

      <h2>Contact</h2>
      <p>Phone / WhatsApp: {store.whatsapp}<br />Email: {store.email}</p>
    </LegalPage>
  );
}
