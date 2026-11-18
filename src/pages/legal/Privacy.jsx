import LegalPage from './LegalPage';
import { useStoreInfo } from './useStoreInfo';

export default function Privacy() {
  const store = useStoreInfo();
  return (
    <LegalPage title="Privacy Policy" updated="November 2026">
      <p>This policy explains what information {store.name} collects when you use our website and app, and how we use it.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your mobile number, name and (if you add it) email.</li>
        <li><strong>Delivery details:</strong> the addresses you save, so we can deliver your orders.</li>
        <li><strong>Order details:</strong> what you bought, when, the amount, and how you paid.</li>
        <li><strong>Payment details:</strong> online payments are handled by our payment partner. We never see or store your card number, UPI PIN or bank password.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To log you in with a one-time password (OTP).</li>
        <li>To pack, deliver and update you about your orders.</li>
        <li>To answer your questions and handle returns or refunds.</li>
        <li>To keep the service safe and prevent misuse.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>
        We share only what’s needed: your name, phone and address with the person delivering your order, and payment
        details with our payment partner. We do not sell your information to anyone.
      </p>

      <h2>Your choices</h2>
      <p>
        You can edit your name, email and addresses in your account at any time. To delete your account, contact us
        using the details below.
      </p>

      <h2>Contact</h2>
      <p>{store.name}, {store.address}<br />Phone: {store.phone}, Email: {store.email}</p>
    </LegalPage>
  );
}
