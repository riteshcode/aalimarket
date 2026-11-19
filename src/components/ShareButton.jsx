import { Share2 } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { money } from '../lib/format';

/**
 * Phones: opens the system share sheet (WhatsApp, Telegram, SMS…).
 * Desktop / older browsers: opens WhatsApp with the message ready.
 */
export default function ShareButton({ title, price, mrp }) {
  const { t } = useLang();

  async function share() {
    const url = window.location.href;
    const saving = mrp > price ? ` (${t('Save {amount}', { amount: money(mrp - price) })})` : '';
    const text = `${title}: ${money(price)}${saving} — Aali Market`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        return; // shopper closed the share sheet
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank', 'noopener');
  }

  return (
    <button className="icon-btn" onClick={share} aria-label={t('Share')} title={t('Share')}>
      <Share2 size={20} />
    </button>
  );
}
