import { useShop } from '../../context/ShopContext';

// Store contact details come from GET /settings once the backend adds them.
// Until then these placeholders show, so it's obvious what still needs filling in.
export function useStoreInfo() {
  const { settings } = useShop();
  const s = settings || {};
  const addr = s.address || {};

  return {
    name: s.storeName || 'Aali Market',
    phone: s.phone || '[store phone number]',
    whatsapp: s.whatsapp || s.phone || '[WhatsApp number]',
    email: s.email || '[store email]',
    address: addr.line1 ? `${addr.line1}, ${addr.city}, ${addr.state} ${addr.pincode}` : '[store address]',
    city: addr.city || '[city]',
    fssai: s.fssaiNumber || '[FSSAI licence number]',
    gstin: s.gstin || '',
    timings: s.storeTimings ? `${s.storeTimings.open} – ${s.storeTimings.close}` : '08:00 – 22:00',
  };
}
