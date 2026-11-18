import { Phone, MessageCircle, Mail, MapPin, Clock } from 'lucide-react';
import LegalPage from './LegalPage';
import { useStoreInfo } from './useStoreInfo';

export default function Contact() {
  const store = useStoreInfo();
  const waNumber = store.whatsapp.replace(/\D/g, '');

  return (
    <LegalPage title="Contact us">
      <p>Questions about an order, a missing item, or a refund? We’re happy to help.</p>
      <ul className="contact-list">
        <li><Phone size={18} /> <a href={`tel:${store.phone}`}>{store.phone}</a></li>
        {waNumber && <li><MessageCircle size={18} /> <a href={`https://wa.me/91${waNumber.slice(-10)}`} target="_blank" rel="noreferrer">WhatsApp {store.whatsapp}</a></li>}
        <li><Mail size={18} /> <a href={`mailto:${store.email}`}>{store.email}</a></li>
        <li><MapPin size={18} /> {store.address}</li>
        <li><Clock size={18} /> Open daily, {store.timings}</li>
      </ul>
    </LegalPage>
  );
}
