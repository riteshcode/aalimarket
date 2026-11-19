import { BellRing } from 'lucide-react';
import { usePush } from '../lib/usePush';
import { useLang } from '../context/LangContext';
import { useToast } from '../context/ToastContext';

// "Get an alert when the store gives you a new delivery" — shown until the rider turns it on
export default function RiderAlerts() {
  const { t } = useLang();
  const toast = useToast();
  const { supported, subscribed, blocked, busy, enable } = usePush('rider');

  if (!supported || subscribed) return null;

  async function turnOn() {
    try {
      await enable();
      toast.success(t('Alerts on. You’ll hear about every new delivery.'));
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="card rider-alerts">
      <BellRing size={22} />
      <div>
        <strong>{t('New delivery alerts')}</strong>
        <span className="muted small">
          {blocked ? t('Notifications are blocked. Allow them in your browser settings.') : t('Get a notification when the store gives you an order.')}
        </span>
      </div>
      {!blocked && <button className="btn btn--primary btn--sm" onClick={turnOn} disabled={busy}>{t('Turn on')}</button>}
    </div>
  );
}
